
package com.creative.collaboration.service;

import com.creative.collaboration.dto.PostLikeResponse;
import com.creative.collaboration.repository.PostLikeRepository;
import com.creative.collaboration.repository.PostRepository;
import com.creative.collaboration.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PostLikeService {

    private final PostLikeRepository likeRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public PostLikeService(
            PostLikeRepository likeRepository,
            PostRepository postRepository,
            UserRepository userRepository
    ) {
        this.likeRepository = likeRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    private void checkPost(Long postId) {
        if (!postRepository.existsById(postId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Post not found"
            );
        }
    }

    private void checkUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "User not found"
            );
        }
    }

    private PostLikeResponse status(
            Long postId,
            Long userId
    ) {
        return new PostLikeResponse(
                postId,
                likeRepository.countByPost_Id(postId),
                likeRepository.existsByPost_IdAndUser_Id(
                        postId,
                        userId
                )
        );
    }

    // GET /api/posts/{postId}/likes
    @Transactional(readOnly = true)
    public PostLikeResponse getStatus(
            Long postId,
            Long userId
    ) {
        checkPost(postId);
        checkUser(userId);
        return status(postId, userId);
    }

    // POST /api/posts/{postId}/likes
    @Transactional
    public PostLikeResponse likePost(
            Long postId,
            Long userId
    ) {
        checkPost(postId);
        checkUser(userId);

        likeRepository.insertLikeIfAbsent(
                postId,
                userId
        );

        return status(postId, userId);
    }

    // DELETE /api/posts/{postId}/likes
    @Transactional
    public PostLikeResponse unlikePost(
            Long postId,
            Long userId
    ) {
        checkPost(postId);
        checkUser(userId);

        likeRepository.removeLike(
                postId,
                userId
        );

        return status(postId, userId);
    }
}
