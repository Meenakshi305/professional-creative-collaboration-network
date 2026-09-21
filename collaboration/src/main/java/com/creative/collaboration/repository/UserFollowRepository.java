package com.creative.collaboration.repository;

import com.creative.collaboration.entity.UserFollow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserFollowRepository
        extends JpaRepository<UserFollow, Long> {

    boolean existsByFollower_IdAndFollowing_Id(
            Long followerId,
            Long followingId
    );

    Optional<UserFollow>
    findByFollower_IdAndFollowing_Id(
            Long followerId,
            Long followingId
    );

    List<UserFollow> findByFollowing_Id(
            Long userId
    );

    List<UserFollow> findByFollower_Id(
            Long userId
    );
}