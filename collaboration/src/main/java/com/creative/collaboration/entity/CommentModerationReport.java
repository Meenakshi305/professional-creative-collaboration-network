package com.creative.collaboration.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name="comment_moderation_reports")
public class CommentModerationReport {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
 private Long id;
 @Column(nullable=false) private Long postId;
 @Column(nullable=false) private Long commentId;
 @Column(nullable=false) private Long reporterId;
 @Column(nullable=false,length=1000) private String reason;
 @Column(nullable=false,length=20) private String status="PENDING";
 private Long assignedAdminId;
 private Long resolvedById;
 @Column(length=1000) private String resolutionNote;
 @Column(nullable=false,updatable=false) private LocalDateTime createdAt;
 private LocalDateTime resolvedAt;
 @PrePersist public void prePersist(){if(createdAt==null) createdAt=LocalDateTime.now();}
 public Long getId(){return id;}
 public Long getPostId(){return postId;} public void setPostId(Long x){postId=x;}
 public Long getCommentId(){return commentId;} public void setCommentId(Long x){commentId=x;}
 public Long getReporterId(){return reporterId;} public void setReporterId(Long x){reporterId=x;}
 public String getReason(){return reason;} public void setReason(String x){reason=x;}
 public String getStatus(){return status;} public void setStatus(String x){status=x;}
 public Long getAssignedAdminId(){return assignedAdminId;} public void setAssignedAdminId(Long x){assignedAdminId=x;}
 public Long getResolvedById(){return resolvedById;} public void setResolvedById(Long x){resolvedById=x;}
 public String getResolutionNote(){return resolutionNote;} public void setResolutionNote(String x){resolutionNote=x;}
 public LocalDateTime getCreatedAt(){return createdAt;}
 public LocalDateTime getResolvedAt(){return resolvedAt;} public void setResolvedAt(LocalDateTime x){resolvedAt=x;}
}
