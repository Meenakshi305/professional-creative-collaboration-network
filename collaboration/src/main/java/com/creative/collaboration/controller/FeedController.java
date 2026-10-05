package com.creative.collaboration.controller;

import com.creative.collaboration.dto.PostResponse;
import com.creative.collaboration.service.FeedService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feed")
public class FeedController {

    private final FeedService feedService;

    public FeedController(
            FeedService feedService
    ) {
        this.feedService = feedService;
    }


    // =========================================
    // MAIN DASHBOARD FEED
    // GET /api/feed
    // =========================================

    @GetMapping
    public ResponseEntity<List<PostResponse>>
    getFeed(

            @RequestHeader("X-User-Id")
            Long userId

    ) {

        return ResponseEntity.ok(
                feedService.getFeed(
                        userId
                )
        );
    }
}