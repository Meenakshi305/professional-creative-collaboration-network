
package com.creative.collaboration.repository;

import com.creative.collaboration.entity.FlaggedComment;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface FlaggedCommentRepository
        extends JpaRepository<FlaggedComment, Long> {

    // Check whether comment is already flagged.
    Optional<FlaggedComment> findByCommentId(Long commentId);

    // Display flags by moderation status.
    Page<FlaggedComment> findByStatus(
            String status,
            Pageable pageable
    );

    // Confirm or dismiss a pending flag atomically.
    @Modifying(
            flushAutomatically = true,
            clearAutomatically = true
    )
    @Query("""
        UPDATE FlaggedComment f
        SET f.status = :decision,
            f.reviewedBy = :reviewerId,
            f.reviewedAt = :reviewedAt,
            f.reviewNote = :note
        WHERE f.id = :flagId
          AND f.status = 'PENDING'
    """)
    int claimDecision(
            @Param("flagId") Long flagId,
            @Param("reviewerId") Long reviewerId,
            @Param("decision") String decision,
            @Param("note") String note,
            @Param("reviewedAt") LocalDateTime reviewedAt
    );
}
