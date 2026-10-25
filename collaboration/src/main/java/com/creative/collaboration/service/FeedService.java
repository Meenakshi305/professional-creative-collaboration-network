package com.creative.collaboration.service;

import com.creative.collaboration.dto.PostResponse;
import com.creative.collaboration.exception.ResourceNotFoundException;
import com.creative.collaboration.repository.PostRepository;
import com.creative.collaboration.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FeedService {

    private final PostRepository postRepository;

    private final UserRepository userRepository;

    private final PostService postService;


    public FeedService(
            PostRepository postRepository,
            UserRepository userRepository,
            PostService postService
    ) {

        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.postService = postService;
    }


    // =========================================
    // MAIN DASHBOARD FEED
    // GET /api/feed
    // =========================================

    @Transactional(readOnly = true)
    public List<PostResponse> getFeed(
            Long loggedInUserId
    ) {

        // Check logged-in user exists
        if (
                !userRepository.existsById(
                        loggedInUserId
                )
        ) {

            throw new ResourceNotFoundException(
                    "User not found with ID: "
                            + loggedInUserId
            );
        }


        /*
         * PostRepository.findFeedPosts()
         *
         * Finds posts only from users
         * that loggedInUserId follows.
         *
         * Posts are already sorted:
         * newest first.
         */

        return postRepository
                .findFeedPosts(
                        loggedInUserId
                )
                .stream()
                .map(
                        postService::convertToResponse
                )
                .toList();
    }
}