
package com.creative.collaboration.service;

import com.creative.collaboration.entity.Comment;
import com.creative.collaboration.entity.Post;
import com.creative.collaboration.entity.User;

import com.creative.collaboration.repository.CommentRepository;
import com.creative.collaboration.repository.PostRepository;
import com.creative.collaboration.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CommentWordModerationService moderationService;

    public CommentService(
            CommentRepository commentRepository,
            PostRepository postRepository,
            UserRepository userRepository,
            CommentWordModerationService moderationService
    ) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.moderationService = moderationService;
    }

    // ======================================
    // CREATE COMMENT + AUTOMATIC DETECTION
    // ======================================

    @Transactional
    public Comment createComment(
            Long postId,
            Long authorId,
            String commentText
    ) {
        if (commentText == null || commentText.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Comment cannot be empty"
            );
        }

        Post post = postRepository.findById(postId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Post not found"
                        )
                );

        User author = userRepository.findById(authorId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "User not found"
                        )
                );

        // Use the existing User account-status method.
        // Example: author.isActive()

        Comment comment = new Comment();

        // These setters must match your actual Comment entity.
        comment.setPost(post);
        comment.setUser(author);
        comment.setContent(commentText.trim());

        Comment savedComment =
                commentRepository.saveAndFlush(comment);

        // Automatically check the newly saved comment.
        // No user report is required.
        moderationService.checkAndFlag(
                savedComment.getId(),
                postId,
                authorId,
                savedComment.getContent()
        );

        return savedComment;
    }

    // ======================================
    // EDIT COMMENT + AUTOMATIC DETECTION
    // ======================================

    @Transactional
    public Comment updateComment(
            Long commentId,
            Long authorId,
            String newText
    ) {
        if (newText == null || newText.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Comment cannot be empty"
            );
        }

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Comment not found"
                        )
                );

        if (!comment.getUser().getId().equals(authorId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You cannot edit another user's comment"
            );
        }

        comment.setContent(newText.trim());

        Comment savedComment =
                commentRepository.saveAndFlush(comment);

        moderationService.checkAndFlag(
                savedComment.getId(),
                savedComment.getPost().getId(),
                authorId,
                savedComment.getContent()
        );

        return savedComment;
    }
}
