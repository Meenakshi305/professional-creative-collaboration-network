
package com.creative.collaboration.repository;

import com.creative.collaboration.entity.PostComment;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostCommentRepository
        extends JpaRepository<PostComment, Long> {

    // Existing comment listing for frontend.
    List<PostComment> findByPost_IdOrderByCreatedAtAscIdAsc(
            Long postId
    );

    // Historical moderation scanner.
    // Fetches comments after the last processed ID.
    @Query("""
        SELECT c
        FROM PostComment c
        JOIN FETCH c.post
        JOIN FETCH c.user
        WHERE c.id > :lastId
        ORDER BY c.id ASC
    """)
    List<PostComment> findNextBatchForModeration(
            @Param("lastId") Long lastId,
            Pageable pageable
    );
}
