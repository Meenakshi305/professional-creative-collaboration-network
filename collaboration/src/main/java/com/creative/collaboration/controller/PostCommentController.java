
package com.creative.collaboration.controller;

import com.creative.collaboration.dto.PostCommentResponse;
import com.creative.collaboration.service.PostCommentService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts/{postId}/comments")
public class PostCommentController {

    private final PostCommentService service;

    public PostCommentController(PostCommentService service) {
        this.service = service;
    }

    // ==========================================
    // REQUEST DTO
    // ==========================================

    public record CreateCommentRequest(
            @NotBlank(message = "Comment cannot be empty")
            @Size(
                    max = 1000,
                    message = "Comment cannot exceed 1000 characters"
            )
            String content
    ) {}

    // ==========================================
    // 1. GET COMMENTS
    // ==========================================

    @GetMapping
    public ResponseEntity<List<PostCommentResponse>> getComments(
            @PathVariable Long postId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                service.getComments(postId, authentication)
        );
    }

    // ==========================================
    // 2. ADD COMMENT
    // Automatic moderation occurs in the service
    // ==========================================

    @PostMapping
    public ResponseEntity<PostCommentResponse> addComment(
            @PathVariable Long postId,
            @Valid @RequestBody CreateCommentRequest request,
            Authentication authentication
    ) {
        PostCommentResponse response = service.addComment(
                postId,
                request.content(),
                authentication
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // ==========================================
    // 3. EDIT COMMENT
    // Edited content is scanned automatically
    // ==========================================

    @PutMapping("/{commentId}")
    public ResponseEntity<PostCommentResponse> updateComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @Valid @RequestBody CreateCommentRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                service.updateComment(
                        postId,
                        commentId,
                        request.content(),
                        authentication
                )
        );
    }

    // ==========================================
    // 4. DELETE COMMENT
    // Only comment author can delete
    // ==========================================

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            Authentication authentication
    ) {
        service.deleteComment(
                postId,
                commentId,
                authentication
        );

        return ResponseEntity.noContent().build();
    }
}
