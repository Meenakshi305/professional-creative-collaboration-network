package com.creative.collaboration.controller;

import com.creative.collaboration.dto.PostResponse;
import com.creative.collaboration.dto.UpdatePostRequest;
import com.creative.collaboration.service.CurrentUserService;
import com.creative.collaboration.service.PostService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;
    private final CurrentUserService currentUserService;

    public PostController(
            PostService postService,
            CurrentUserService currentUserService
    ) {
        this.postService = postService;
        this.currentUserService = currentUserService;
    }


    @PostMapping(
            consumes = "multipart/form-data"
    )
    public ResponseEntity<PostResponse> createPost(

            Authentication authentication,

            @RequestParam(
                    value = "caption",
                    required = false
            )
            String caption,

            @RequestParam(
                    value = "files",
                    required = false
            )
            List<MultipartFile> files

    ) {

        Long userId =
                currentUserService
                        .getCurrentUserId(
                                authentication
                        );

        return ResponseEntity.ok(
                postService.createPost(
                        userId,
                        caption,
                        files
                )
        );
    }


    @GetMapping("/me")
    public ResponseEntity<List<PostResponse>>
    getMyPosts(
            Authentication authentication
    ) {

        Long userId =
                currentUserService
                        .getCurrentUserId(
                                authentication
                        );

        return ResponseEntity.ok(
                postService.getMyPosts(
                        userId
                )
        );
    }


    @GetMapping("/{postId}")
    public ResponseEntity<PostResponse>
    getPost(
            @PathVariable Long postId
    ) {

        return ResponseEntity.ok(
                postService.getPost(
                        postId
                )
        );
    }


    @PutMapping("/{postId}")
    public ResponseEntity<PostResponse>
    updatePost(

            @PathVariable Long postId,

            Authentication authentication,

            @RequestBody
            UpdatePostRequest request

    ) {

        Long userId =
                currentUserService
                        .getCurrentUserId(
                                authentication
                        );

        return ResponseEntity.ok(
                postService.updatePost(
                        postId,
                        userId,
                        request
                )
        );
    }


    @DeleteMapping("/{postId}")
    public ResponseEntity<Void>
    deletePost(

            @PathVariable Long postId,

            Authentication authentication

    ) {

        Long userId =
                currentUserService
                        .getCurrentUserId(
                                authentication
                        );

        postService.deletePost(
                postId,
                userId
        );

        return ResponseEntity
                .noContent()
                .build();
    }
}