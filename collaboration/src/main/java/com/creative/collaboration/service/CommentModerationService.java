package com.creative.collaboration.service;

import com.creative.collaboration.entity.CommentModerationReport;
import com.creative.collaboration.entity.User;
import com.creative.collaboration.repository.CommentModerationReportRepository;
import com.creative.collaboration.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.Map;
import static org.springframework.http.HttpStatus.*;

@Service
public class CommentModerationService {
 private final JdbcTemplate jdbc;
 private final CommentModerationReportRepository reports;
 private final UserRepository users;
 private final AdminIdentityService identity;
 private final AdminAuditService audit;
 private final String commentTable;

 public CommentModerationService(JdbcTemplate jdbc, CommentModerationReportRepository reports,
     UserRepository users, AdminIdentityService identity, AdminAuditService audit,
     @Value("${creative.comments.table:post_comments}") String table) {
  if(!table.matches("[A-Za-z_][A-Za-z0-9_]*")) throw new IllegalArgumentException("Invalid comment table name");
  this.jdbc=jdbc;this.reports=reports;this.users=users;this.identity=identity;this.audit=audit;this.commentTable=table;
 }

 public record CommentDetail(Long id,Long postId,Long authorId,String content) {}
 public CommentDetail getComment(Long postId, Long commentId){
  // Verify these actual table columns before running: id, post_id, user_id, content.
  String sql="SELECT id,post_id,user_id,content FROM `"+commentTable+"` WHERE id=? AND post_id=?";
  var rows=jdbc.query(sql,(rs,i)->new CommentDetail(rs.getLong("id"),rs.getLong("post_id"),rs.getLong("user_id"),rs.getString("content")),commentId,postId);
  if(rows.isEmpty()) throw new ResponseStatusException(NOT_FOUND,"Comment not found");
  return rows.get(0);
 }

 @Transactional
 public CommentModerationReport submit(Long postId,Long commentId,String reason,Authentication auth){
  getComment(postId,commentId); // prevents reporting an invented comment
  User actor=identity.current(auth);
  if(reports.existsByCommentIdAndReporterIdAndStatus(commentId,actor.getId(),"PENDING"))
   throw new ResponseStatusException(CONFLICT,"You have already reported this comment");
  CommentModerationReport r=new CommentModerationReport();
  r.setPostId(postId);r.setCommentId(commentId);r.setReporterId(actor.getId());r.setReason(reason.trim());
  return reports.save(r);
 }

 @Transactional
 public CommentModerationReport assign(Long reportId,Long assigneeId,Authentication auth){
  User actor=identity.current(auth);
  User target=users.findById(assigneeId).orElseThrow(()->new ResponseStatusException(NOT_FOUND,"Admin not found"));
  String role=target.getRole();
  if(!target.isActive() || !("ADMIN".equals(role) || "SUPER_ADMIN".equals(role)))
   throw new ResponseStatusException(BAD_REQUEST,"Assignee must be an active administrator");
  CommentModerationReport r=report(reportId);
  if(!"PENDING".equals(r.getStatus()))throw new ResponseStatusException(CONFLICT,"Already resolved");
  if(!identity.isSuperAdmin(auth) && !actor.getId().equals(assigneeId))
   throw new ResponseStatusException(FORBIDDEN,"Admins can only assign reports to themselves");
  r.setAssignedAdminId(assigneeId);
  audit.record(actor.getId(),"ASSIGN_COMMENT_REPORT","COMMENT_REPORT",reportId,"Assigned to "+assigneeId);
  return reports.save(r);
 }

 @Transactional
 public CommentModerationReport decide(Long id,String decision,String note,Authentication auth){
  User actor=identity.current(auth);
  CommentModerationReport r=report(id);
  if(!"PENDING".equals(r.getStatus()))throw new ResponseStatusException(CONFLICT,"Already resolved");
  if(r.getAssignedAdminId()!=null && !r.getAssignedAdminId().equals(actor.getId()) && !identity.isSuperAdmin(auth))
   throw new ResponseStatusException(FORBIDDEN,"Assigned to another admin");
  if(!"DISMISSED".equals(decision) && !"UPHELD".equals(decision))
   throw new ResponseStatusException(BAD_REQUEST,"Invalid decision");
  r.setStatus(decision);r.setResolutionNote(note);r.setResolvedById(actor.getId());r.setResolvedAt(LocalDateTime.now());
  audit.record(actor.getId(),"REVIEW_COMMENT_REPORT","COMMENT_REPORT",id,decision+": "+note);
  return reports.save(r);
 }

 // Separate action from 'UPHELD' so a reviewer can preserve evidence first.
 @Transactional
 public void removeReportedComment(Long reportId,String reason,Authentication auth){
  User actor=identity.current(auth);
  CommentModerationReport r=report(reportId);
  if(!"UPHELD".equals(r.getStatus())) throw new ResponseStatusException(CONFLICT,"Uphold report before removal");
  if(r.getAssignedAdminId()!=null && !r.getAssignedAdminId().equals(actor.getId()) && !identity.isSuperAdmin(auth))
   throw new ResponseStatusException(FORBIDDEN,"Assigned to another admin");
  getComment(r.getPostId(),r.getCommentId());
  // Hard deletion may fail if other tables reference the comment. Back up first.
  int removed=jdbc.update("DELETE FROM `"+commentTable+"` WHERE id=? AND post_id=?",r.getCommentId(),r.getPostId());
  if(removed!=1)throw new ResponseStatusException(CONFLICT,"Comment could not be removed");
  audit.record(actor.getId(),"REMOVE_COMMENT","COMMENT",r.getCommentId(),reason);
 }
 public CommentModerationReport report(Long id){return reports.findById(id).orElseThrow(()->new ResponseStatusException(NOT_FOUND,"Report not found"));}
 public CommentDetail preview(Long reportId){CommentModerationReport r=report(reportId);return getComment(r.getPostId(),r.getCommentId());}
}
