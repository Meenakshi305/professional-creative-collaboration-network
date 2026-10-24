
package com.creative.collaboration.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public class SuperAdminDailyLikesRepository {

    private final JdbcTemplate jdbcTemplate;

    public SuperAdminDailyLikesRepository(
            JdbcTemplate jdbcTemplate
    ) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public record DailyLikes(
            LocalDate date,
            long totalLikes,
            long usersReceivingLikes
    ) {}

    public record TopLikedUser(
            Long userId,
            String username,
            String fullName,
            long likesReceived
    ) {}

    // Daily Likes over the selected period
    public List<DailyLikes> getDailyLikes(int days) {

        int safeDays = Math.max(1, Math.min(days, 30));

        String sql = """
            SELECT
                DATE(pl.created_at) AS like_date,
                COUNT(pl.id) AS total_likes,
                COUNT(DISTINCT p.user_id) AS users_receiving_likes
            FROM post_likes pl
            JOIN posts p ON pl.post_id = p.id
            WHERE pl.created_at >= CURRENT_DATE()
                  - INTERVAL ? DAY
              AND pl.created_at < CURRENT_DATE()
                  + INTERVAL 1 DAY
            GROUP BY DATE(pl.created_at)
            ORDER BY like_date
            """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new DailyLikes(
                        rs.getDate("like_date").toLocalDate(),
                        rs.getLong("total_likes"),
                        rs.getLong("users_receiving_likes")
                ),
                safeDays - 1
        );
    }

    // Top 10 users receiving Likes today
    public List<TopLikedUser> getTopLikedUsersToday() {

        String sql = """
            SELECT
                u.id AS user_id,
                u.username,
                u.full_name,
                COUNT(pl.id) AS likes_received
            FROM post_likes pl
            JOIN posts p ON pl.post_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE pl.created_at >= CURRENT_DATE()
              AND pl.created_at < CURRENT_DATE()
                  + INTERVAL 1 DAY
            GROUP BY u.id, u.username, u.full_name
            ORDER BY likes_received DESC, u.id ASC
            LIMIT 10
            """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new TopLikedUser(
                        rs.getLong("user_id"),
                        rs.getString("username"),
                        rs.getString("full_name"),
                        rs.getLong("likes_received")
                )
        );
    }

    // Maximum Likes received by a user today
    public long getMaximumLikesToday() {

        List<TopLikedUser> users = getTopLikedUsersToday();

        return users.isEmpty()
                ? 0
                : users.get(0).likesReceived();
    }

    // Total Likes today
    public long getTotalLikesToday() {

        String sql = """
            SELECT COUNT(*)
            FROM post_likes
            WHERE created_at >= CURRENT_DATE()
              AND created_at < CURRENT_DATE()
                  + INTERVAL 1 DAY
            """;

        Long count = jdbcTemplate.queryForObject(
                sql,
                Long.class
        );

        return count == null ? 0 : count;
    }
}

