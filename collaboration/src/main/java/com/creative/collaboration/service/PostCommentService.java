
package com.creative.collaboration.service;

import com.creative.collaboration.dto.PostCommentResponse;
import com.creative.collaboration.entity.Post;
import com.creative.collaboration.entity.PostComment;
import com.creative.collaboration.entity.User;

import com.creative.collaboration.repository.PostCommentRepository;
import com.creative.collaboration.repository.PostRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class PostCommentService {

    private static final Logger log =
            LoggerFactory.getLogger(PostCommentService.class);

    private final PostCommentRepository comments;
    private final PostRepository posts;
    private final CurrentUserService currentUserService;
    private final CommentWordModerationService moderationService;

    // ==========================================
    // CONSTRUCTOR
    // ==========================================

    public PostCommentService(
            PostCommentRepository comments,
            PostRepository posts,
            CurrentUserService currentUserService,
            CommentWordModerationService moderationService
    ) {
        this.comments = comments;
        this.posts = posts;
        this.currentUserService = currentUserService;
        this.moderationService = moderationService;
    }

    // ==========================================
    // FIND POST
    // ==========================================

    private Post findPost(Long postId) {

        return posts.findById(postId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Post not found"
                        )
                );
    }

    // ==========================================
    // VALIDATE COMMENT
    // ==========================================

    private String validateContent(String content) {

        String clean = content == null
                ? ""
                : content.trim();

        if (clean.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Comment cannot be empty"
            );
        }

        if (clean.length() > 1000) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Comment cannot exceed 1000 characters"
            );
        }

        return clean;
    }

    // ==========================================
    // CONVERT ENTITY TO RESPONSE
    // ==========================================

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

    // ==========================================
    // 1. GET COMMENTS FOR POST
    // ==========================================

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
                .map(comment -> toResponse(comment, viewerId))
                .toList();
    }

    // ==========================================
    // 2. ADD COMMENT
    // AUTOMATIC PROFANITY SCAN
    // ==========================================

    @Transactional
    public PostCommentResponse addComment(
            Long postId,
            String content,
            Authentication authentication
    ) {

        User user = currentUserService
                .getCurrentUser(authentication);

        Post post = findPost(postId);

        String clean = validateContent(content);

        PostComment comment = PostComment.builder()
                .post(post)
                .user(user)
                .content(clean)
                .build();

        // Save comment and generate ID.
        PostComment saved = comments.saveAndFlush(comment);

        log.info(
                "[COMMENTS] Created comment {} on post {}",
                saved.getId(),
                postId
        );

        // Scan using CommentWordModerationService.
        // That service reads badwords.txt.
        // Matching comments create PENDING flags.
        moderationService.checkAndFlag(
                saved.getId(),
                saved.getPost().getId(),
                saved.getUser().getId(),
                saved.getContent()
        );

        log.info(
                "[COMMENTS] Moderation scan completed for comment {}",
                saved.getId()
        );

        return toResponse(saved, user.getId());
    }

    // ==========================================
    // 3. UPDATE COMMENT
    // AUTOMATIC PROFANITY SCAN
    // ==========================================

    @Transactional
    public PostCommentResponse updateComment(
            Long postId,
            Long commentId,
            String content,
            Authentication authentication
    ) {

        User user = currentUserService
                .getCurrentUser(authentication);

        PostComment comment = comments.findById(commentId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Comment not found"
                        )
                );

        // Confirm comment belongs to this post.
        if (!comment.getPost().getId().equals(postId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Comment does not belong to this post"
            );
        }

        // Only comment author can edit.
        if (!comment.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only edit your own comment"
            );
        }

        String clean = validateContent(content);

        comment.setContent(clean);

        PostComment saved = comments.saveAndFlush(comment);

        log.info(
                "[COMMENTS] Updated comment {} on post {}",
                saved.getId(),
                postId
        );

        // Scan the updated content.
        moderationService.checkAndFlag(
                saved.getId(),
                saved.getPost().getId(),
                saved.getUser().getId(),
                saved.getContent()
        );

        return toResponse(saved, user.getId());
    }

    // ==========================================
    // 4. USER DELETES OWN COMMENT
    // ==========================================

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
                    "Comment does not belong to this post"
            );
        }

        if (!comment.getUser().getId().equals(viewerId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only delete your own comment"
            );
        }

        comments.delete(comment);
        comments.flush();

        log.info(
                "[COMMENTS] User {} deleted comment {} from post {}",
                viewerId,
                commentId,
                postId
        );
    }

    // ==========================================
    // 5. ADMIN / SUPERADMIN REMOVES COMMENT
    // ==========================================
    //
    // Called only by secured moderation controller.
    //
    // Example:
    //
    // postComments.removeCommentByModeration(
    //     flag.getPostId(),
    //     flag.getCommentId(),
    //     flag.getCommentUserId()
    // );
    //
    // ==========================================

    @Transactional
    public void removeCommentByModeration(
            Long postId,
            Long commentId,
            Long authorId
    ) {

        PostComment comment = comments.findById(commentId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.CONFLICT,
                                "Original comment no longer exists"
                        )
                );

        // Ensure flag refers to the correct post.
        if (!comment.getPost().getId().equals(postId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Flag post ID does not match comment"
            );
        }

        // Ensure flag refers to the correct author.
        if (!comment.getUser().getId().equals(authorId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Flag author ID does not match comment"
            );
        }

        // Delete the original post comment.
        comments.delete(comment);

        // Flush so deletion errors surface during review.
        comments.flush();

        log.info(
                "[MODERATION] Admin removed comment {} from post {} " +
                        "(original author {})",
                commentId,
                postId,
                authorId
        );
    }
}
