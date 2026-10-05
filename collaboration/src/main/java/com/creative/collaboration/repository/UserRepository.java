package com.creative.collaboration.repository;

import com.creative.collaboration.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository
        extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);


    @Query("""
        SELECT DISTINCT u
        FROM User u
        LEFT JOIN UserProfile p
            ON p.user = u
        WHERE u.active = true
        AND (
            LOWER(COALESCE(u.fullName, ''))
                LIKE LOWER(CONCAT('%', :query, '%'))

            OR LOWER(COALESCE(u.username, ''))
                LIKE LOWER(CONCAT('%', :query, '%'))

            OR LOWER(COALESCE(p.skills, ''))
                LIKE LOWER(CONCAT('%', :query, '%'))

            OR LOWER(COALESCE(p.bio, ''))
                LIKE LOWER(CONCAT('%', :query, '%'))
        )
    """)
    List<User> searchUsers(
            @Param("query") String query
    );
}