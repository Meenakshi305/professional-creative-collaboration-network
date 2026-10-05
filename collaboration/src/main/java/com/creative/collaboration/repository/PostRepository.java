package com.creative.collaboration.repository;

import com.creative.collaboration.entity.Post;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {

    // My posts / another user's profile posts
    List<Post> findByUser_IdOrderByCreatedAtDesc(Long userId);


    // Main dashboard:
    // posts only from people the logged-in user follows
    @Query("""
        SELECT p
        FROM Post p
        WHERE p.user.id IN (
            SELECT f.following.id
            FROM UserFollow f
            WHERE f.follower.id = :userId
        )
        ORDER BY p.createdAt DESC
    """)
    List<Post> findFeedPosts(
            @Param("userId") Long userId
    );
}