
package com.creative.collaboration.repository;

import com.creative.collaboration.entity.Comment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CommentRepository
        extends JpaRepository<Comment, Long> {

    // Find comments belonging to one post
    List<Comment> findByPostIdOrderByCreatedAtDesc(Long postId);

    // Paginated comments for a post
    Page<Comment> findByPostId(
            Long postId,
            Pageable pageable
    );

    // Find comments written by one user
    List<Comment> findByUserIdOrderByCreatedAtDesc(Long userId);

    // Count comments on a post
    long countByPostId(Long postId);

    // Check whether a particular comment belongs
    // to the specified user
    boolean existsByIdAndUserId(
            Long commentId,
            Long userId
    );
}
