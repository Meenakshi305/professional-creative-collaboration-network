
package com.creative.collaboration.repository;

import com.creative.collaboration.entity.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostLikeRepository
        extends JpaRepository<PostLike, Long> {

    long countByPost_Id(Long postId);

    boolean existsByPost_IdAndUser_Id(
            Long postId,
            Long userId
    );

    @Modifying
    @Query(value = """
        INSERT IGNORE INTO post_likes
            (post_id, user_id, created_at)
        VALUES
            (:postId, :userId, CURRENT_TIMESTAMP(6))
        """, nativeQuery = true)
    int insertLikeIfAbsent(
            @Param("postId") Long postId,
            @Param("userId") Long userId
    );

    @Modifying
    @Query("""
        DELETE FROM PostLike l
        WHERE l.post.id = :postId
          AND l.user.id = :userId
        """)
    int removeLike(
            @Param("postId") Long postId,
            @Param("userId") Long userId
    );

    @Modifying
    @Query("""
        DELETE FROM PostLike l
        WHERE l.post.id = :postId
        """)
    int removeAllForPost(
            @Param("postId") Long postId
    );
}
