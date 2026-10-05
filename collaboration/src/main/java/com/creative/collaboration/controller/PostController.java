package com.creative.collaboration.controller;

import com.creative.collaboration.dto.PostResponse;
import com.creative.collaboration.dto.UpdatePostRequest;
import com.creative.collaboration.service.PostService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;

    public PostController(
            PostService postService
    ) {
        this.postService = postService;
    }


    // =========================================
    // CREATE POST
    // POST /api/posts
    // =========================================

    @PostMapping(
            consumes = "multipart/form-data"
    )
    public ResponseEntity<PostResponse>
    createPost(

            @RequestHeader("X-User-Id")
            Long userId,

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

        return ResponseEntity.ok(
                postService.createPost(
                        userId,
                        caption,
                        files
                )
        );
    }


    // =========================================
    // MY POSTS
    // GET /api/posts/me
    // =========================================

    @GetMapping("/me")
    public ResponseEntity<List<PostResponse>>
    getMyPosts(

            @RequestHeader("X-User-Id")
            Long userId

    ) {

        return ResponseEntity.ok(
                postService.getMyPosts(
                        userId
                )
        );
    }


    // =========================================
    // GET ONE POST
    // GET /api/posts/{postId}
    // =========================================

    @GetMapping("/{postId}")
    public ResponseEntity<PostResponse>
    getPost(

            @PathVariable
            Long postId

    ) {

        return ResponseEntity.ok(
                postService.getPost(
                        postId
                )
        );
    }


    // =========================================
    // UPDATE POST
    // PUT /api/posts/{postId}
    // =========================================

    @PutMapping("/{postId}")
    public ResponseEntity<PostResponse>
    updatePost(

            @PathVariable
            Long postId,

            @RequestHeader("X-User-Id")
            Long userId,

            @RequestBody
            UpdatePostRequest request

    ) {

        return ResponseEntity.ok(
                postService.updatePost(
                        postId,
                        userId,
                        request
                )
        );
    }


    // =========================================
    // DELETE POST
    // DELETE /api/posts/{postId}
    // =========================================

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void>
    deletePost(

            @PathVariable
            Long postId,

            @RequestHeader("X-User-Id")
            Long userId

    ) {

        postService.deletePost(
                postId,
                userId
        );

        return ResponseEntity
                .noContent()
                .build();
    }
}