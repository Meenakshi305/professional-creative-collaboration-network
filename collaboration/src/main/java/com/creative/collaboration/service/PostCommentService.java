
package com.creative.collaboration.service;

import com.creative.collaboration.dto.PostCommentResponse;
import com.creative.collaboration.entity.Post;
import com.creative.collaboration.entity.PostComment;
import com.creative.collaboration.entity.User;
import com.creative.collaboration.repository.PostCommentRepository;
import com.creative.collaboration.repository.PostRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class PostCommentService {

    private final PostCommentRepository comments;
    private final PostRepository posts;
    private final CurrentUserService currentUserService;

    public PostCommentService(
            PostCommentRepository comments,
            PostRepository posts,
            CurrentUserService currentUserService
    ) {
        this.comments = comments;
        this.posts = posts;
        this.currentUserService = currentUserService;
    }

    private Post findPost(Long id) {
        return posts.findById(id).orElseThrow(() ->
                new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Post not found"
                )
        );
    }

    private PostCommentResponse toResponse(
            PostComment comment,
            Long viewerId
    ) {
        return new PostCommentResponse(
                comment.getId(),
                comment.getPost().getId(),
                comment.getUser().getId(),
                comment.getUser().getUsername(),
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getUser().getId().equals(viewerId)
        );
    }

    // Fetch comments belonging to one post
    @Transactional(readOnly = true)
    public List<PostCommentResponse> getComments(
            Long postId,
            Authentication authentication
    ) {
        findPost(postId);

        Long viewerId = currentUserService
                .getCurrentUserId(authentication);

        return comments
                .findByPost_IdOrderByCreatedAtAscIdAsc(postId)
                .stream()
                .map(c -> toResponse(c, viewerId))
                .toList();
    }

    // Create a comment using the JWT account
    @Transactional
    public PostCommentResponse addComment(
            Long postId,
            String content,
            Authentication authentication
    ) {
        User user = currentUserService
                .getCurrentUser(authentication);

        Post post = findPost(postId);

        String clean = content == null
                ? ""
                : content.trim();

        if (clean.isEmpty() || clean.length() > 1000) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Comment must contain 1-1000 characters"
            );
        }

        PostComment comment = PostComment.builder()
                .post(post)
                .user(user)
                .content(clean)
                .build();

        return toResponse(
                comments.saveAndFlush(comment),
                user.getId()
        );
    }

    // Delete only your own comment
    @Transactional
    public void deleteComment(
            Long postId,
            Long commentId,
            Authentication authentication
    ) {
        Long viewerId = currentUserService
                .getCurrentUserId(authentication);

        PostComment comment = comments.findById(commentId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Comment not found"
                        )
                );

        if (!comment.getPost().getId().equals(postId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Comment not found on this post"
            );
        }

        if (!comment.getUser().getId().equals(viewerId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only delete your own comment"
            );
        }

        comments.delete(comment);
    }
}
