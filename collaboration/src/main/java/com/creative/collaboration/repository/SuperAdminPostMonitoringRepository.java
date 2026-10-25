package com.creative.collaboration.repository;

import com.creative.collaboration.entity.Post;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

/** Read-only projection over existing Post and User JPA mappings. */
public interface SuperAdminPostMonitoringRepository extends Repository<Post, Long> {
    @Query("""
        select p.user.id, p.user.username, p.createdAt
        from Post p
        where p.createdAt >= :start and p.createdAt < :end
        order by p.createdAt asc
        """)
    List<Object[]> findPostActivity(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );
}
