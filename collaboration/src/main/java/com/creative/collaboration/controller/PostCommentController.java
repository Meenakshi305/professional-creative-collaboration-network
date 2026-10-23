
package com.creative.collaboration.controller;

import com.creative.collaboration.dto.PostCommentResponse;
import com.creative.collaboration.service.PostCommentService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts/{postId}/comments")
public class PostCommentController {

    private final PostCommentService service;

    public PostCommentController(
            PostCommentService service
    ) {
        this.service = service;
    }

    public record CreateCommentRequest(String content) {}

    @GetMapping
    public ResponseEntity<List<PostCommentResponse>> getComments(
            @PathVariable Long postId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                service.getComments(postId, authentication)
        );
    }

    @PostMapping
    public ResponseEntity<PostCommentResponse> addComment(
            @PathVariable Long postId,
            @RequestBody CreateCommentRequest request,
            Authentication authentication
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.addComment(
                        postId,
                        request.content(),
                        authentication
                ));
    }

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
