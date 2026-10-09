package com.creative.collaboration.controller;

import com.creative.collaboration.dto.PostResponse;
import com.creative.collaboration.service.CurrentUserService;
import com.creative.collaboration.service.FeedService;

import org.springframework.http.ResponseEntity;

import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feed")
public class FeedController {

    private final FeedService feedService;

    private final CurrentUserService
            currentUserService;


    public FeedController(

            FeedService feedService,

            CurrentUserService currentUserService

    ) {

        this.feedService =
                feedService;

        this.currentUserService =
                currentUserService;
    }


    @GetMapping
    public ResponseEntity<List<PostResponse>>
    getFeed(
            Authentication authentication
    ) {

        Long userId =
                currentUserService
                        .getCurrentUserId(
                                authentication
                        );


        return ResponseEntity.ok(
                feedService.getFeed(
                        userId
                )
        );
    }
}