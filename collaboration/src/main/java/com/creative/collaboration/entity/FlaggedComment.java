package com.creative.collaboration.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity @Table(name="flagged_comments")
public class FlaggedComment {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="comment_id",nullable=false,unique=true) private Long commentId;
 @Column(name="post_id",nullable=false) private Long postId;
 @Column(name="comment_user_id",nullable=false) private Long commentUserId;
 @Column(name="comment_text",nullable=false,columnDefinition="TEXT") private String commentText;
 @Column(name="matched_words",nullable=false,length=1000) private String matchedWords;
 @Column(nullable=false,length=20) private String status="PENDING";
 @Column(name="detected_at",nullable=false) private LocalDateTime detectedAt;
 @Column(name="reviewed_by") private Long reviewedBy;
 @Column(name="reviewed_at") private LocalDateTime reviewedAt;
 @Column(name="review_note",length=2000) private String reviewNote;
 @PrePersist void created(){if(detectedAt==null)detectedAt=LocalDateTime.now();}
 public Long getId(){return id;}
 public Long getCommentId(){return commentId;} public void setCommentId(Long v){commentId=v;}
 public Long getPostId(){return postId;} public void setPostId(Long v){postId=v;}
 public Long getCommentUserId(){return commentUserId;} public void setCommentUserId(Long v){commentUserId=v;}
 public String getCommentText(){return commentText;} public void setCommentText(String v){commentText=v;}
 public String getMatchedWords(){return matchedWords;} public void setMatchedWords(String v){matchedWords=v;}
 public String getStatus(){return status;} public void setStatus(String v){status=v;}
 public LocalDateTime getDetectedAt(){return detectedAt;} public void setDetectedAt(LocalDateTime v){detectedAt=v;}
 public Long getReviewedBy(){return reviewedBy;} public void setReviewedBy(Long v){reviewedBy=v;}
 public LocalDateTime getReviewedAt(){return reviewedAt;} public void setReviewedAt(LocalDateTime v){reviewedAt=v;}
 public String getReviewNote(){return reviewNote;} public void setReviewNote(String v){reviewNote=v;}
}
