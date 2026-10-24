package com.creative.collaboration.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.dao.DataAccessException;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.LocalDateTime;
import java.sql.Timestamp;
import java.util.List;

import static org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE;

/** Counts likes RECEIVED on authors' posts during each calendar day.
 * Requires the app's actual likes table to contain post_id, created_at;
 * adapt the FROM clause if your existing likes storage differs.
 */
@RestController
@RequestMapping({"/api/superadmin/analytics/likes", "/api/admin/analytics/likes"})
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class SuperAdminDailyLikesController {
    private final JdbcTemplate jdbc;

    public SuperAdminDailyLikesController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public record LikedUser(long userId, String username, long likesReceived) {}
    public record DailyLikes(String date, long totalLikes, LikedUser winner) {}
    public record DailyLikesSummary(String timezone, String from, String through,
                                    LikedUser mostLikedToday, List<DailyLikes> daily,
                                    List<LikedUser> topUsersToday) {}

    @GetMapping("/daily")
    public DailyLikesSummary daily(@RequestParam(defaultValue = "7") int days) {
        if (days != 7) throw new ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST, "Only seven days are supported");
        ZoneId zone = ZoneId.systemDefault();
        LocalDate today = LocalDate.now(zone);
        LocalDate first = today.minusDays(6);
        LocalDateTime start = first.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();
        // Column assumptions must be checked against the real likes table.
        final String sql = """
            SELECT DATE(l.created_at) AS liked_date, u.id AS user_id,
                   u.username AS username, COUNT(*) AS likes_received
            FROM post_likes l
            JOIN posts p ON p.id = l.post_id
            JOIN users u ON u.id = p.user_id
            WHERE l.created_at >= ? AND l.created_at < ?
            GROUP BY DATE(l.created_at), u.id, u.username
            ORDER BY liked_date ASC, likes_received DESC, u.id ASC
            """;
        record Row(LocalDate day, LikedUser user) {}
        final List<Row> rows;
        try {
            rows = jdbc.query(sql, (rs, index) -> new Row(
                            rs.getDate("liked_date").toLocalDate(),
                            new LikedUser(rs.getLong("user_id"), rs.getString("username"),
                                    rs.getLong("likes_received"))),
                    Timestamp.valueOf(start), Timestamp.valueOf(end));
        } catch (DataAccessException ex) {
            throw new ResponseStatusException(SERVICE_UNAVAILABLE,
                    "Likes data is not available. Verify post_likes table and column mappings.", ex);
        }
        List<DailyLikes> daily = new java.util.ArrayList<>();
        for (int i=0;i<7;i++) {
            LocalDate day = first.plusDays(i);
            List<LikedUser> users = rows.stream().filter(r -> r.day().equals(day)).map(Row::user).toList();
            long count = users.stream().mapToLong(LikedUser::likesReceived).sum();
            daily.add(new DailyLikes(day.toString(), count, users.isEmpty() ? null : users.get(0)));
        }
        List<LikedUser> todayRanking = rows.stream()
                .filter(r -> r.day().equals(today)).map(Row::user).limit(10).toList();
        return new DailyLikesSummary(zone.getId(), first.toString(), today.toString(),
                todayRanking.isEmpty() ? null : todayRanking.get(0), daily, todayRanking);
    }
}
