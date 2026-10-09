package com.creative.collaboration.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "post_media")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Which post this media belongs to
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    // IMAGE, VIDEO or FILE
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MediaType mediaType;

    // Private MEGA path
    @Column(nullable = false, length = 1500)
    private String storageKey;

    // Original uploaded filename
    @Column(nullable = false, length = 255)
    private String originalFileName;

    // Example: image/jpeg, video/mp4, application/pdf
    @Column(length = 150)
    private String contentType;

    // File size in bytes
    private Long fileSize;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void beforeInsert() {

        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}