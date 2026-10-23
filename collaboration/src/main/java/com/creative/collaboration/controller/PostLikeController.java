
package com.creative.collaboration.controller;

import com.creative.collaboration.dto.PostLikeResponse;
import com.creative.collaboration.service.CurrentUserService;
import com.creative.collaboration.service.PostLikeService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts/{postId}/likes")
public class PostLikeController {

    private final PostLikeService postLikeService;
    private final CurrentUserService currentUserService;

    public PostLikeController(
            PostLikeService postLikeService,
            CurrentUserService currentUserService
    ) {
        this.postLikeService = postLikeService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public ResponseEntity<PostLikeResponse> getLikes(
            @PathVariable Long postId,
            Authentication authentication
    ) {
        Long userId = currentUserService
                .getCurrentUserId(authentication);

        return ResponseEntity.ok(
                postLikeService.getStatus(postId, userId)
        );
    }

    @PostMapping
    public ResponseEntity<PostLikeResponse> likePost(
            @PathVariable Long postId,
            Authentication authentication
    ) {
        Long userId = currentUserService
                .getCurrentUserId(authentication);

        return ResponseEntity.ok(
                postLikeService.likePost(postId, userId)
        );
    }

    @DeleteMapping
    public ResponseEntity<PostLikeResponse> unlikePost(
            @PathVariable Long postId,
            Authentication authentication
    ) {
        Long userId = currentUserService
                .getCurrentUserId(authentication);

        return ResponseEntity.ok(
                postLikeService.unlikePost(postId, userId)
        );
    }
}
