package com.creative.collaboration.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity @Table(name="prohibited_words")
public class ProhibitedWord {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false,unique=true,length=150) private String word;
 @Column(nullable=false,length=20) private String severity="MEDIUM";
 @Column(nullable=false) private boolean active=false;
 @Column(name="created_at",nullable=false,updatable=false) private LocalDateTime createdAt;
 @PrePersist void created(){if(createdAt==null) createdAt=LocalDateTime.now();}
 public Long getId(){return id;}
 public String getWord(){return word;} public void setWord(String v){word=v;}
 public String getSeverity(){return severity;} public void setSeverity(String v){severity=v;}
 public boolean isActive(){return active;} public void setActive(boolean v){active=v;}
 public LocalDateTime getCreatedAt(){return createdAt;}
}
