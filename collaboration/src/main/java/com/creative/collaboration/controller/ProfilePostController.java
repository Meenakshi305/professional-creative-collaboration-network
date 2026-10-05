package com.creative.collaboration.controller;

import com.creative.collaboration.dto.PostResponse;
import com.creative.collaboration.service.PostService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class ProfilePostController {

    private final PostService postService;

    public ProfilePostController(
            PostService postService
    ) {
        this.postService = postService;
    }


    // =========================================
    // POSTS ON A USER PROFILE
    // GET /api/users/{userId}/posts
    // =========================================

    @GetMapping("/{userId}/posts")
    public ResponseEntity<List<PostResponse>>
    getUserPosts(

            @PathVariable
            Long userId

    ) {

        return ResponseEntity.ok(
                postService.getUserPosts(
                        userId
                )
        );
    }
}