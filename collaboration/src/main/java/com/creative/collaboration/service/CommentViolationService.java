
package com.creative.collaboration.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommentViolationService {

    private static final int BAN_THRESHOLD = 6;

    private final JdbcTemplate jdbc;

    public CommentViolationService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * Call after a flagged comment is confirmed
     * and its status is changed to UPHELD.
     *
     * Assumes users.active is the account status
     * field used by your authentication system.
     */
    @Transactional
    public boolean deactivateIfThresholdReached(Long authorId) {

        // Lock user row to serialize concurrent decisions.
        var users = jdbc.query(
                """
                SELECT id, role
                FROM users
                WHERE id = ?
                FOR UPDATE
                """,
                (rs, row) -> rs.getString("role"),
                authorId
        );

        if (users.isEmpty()) {
            throw new IllegalArgumentException("User not found");
        }

        // Never auto-ban an administrator.
        if (!"USER".equalsIgnoreCase(users.get(0))) {
            return false;
        }

        Integer violations = jdbc.queryForObject(
                """
                SELECT COUNT(*)
                FROM flagged_comments
                WHERE comment_user_id = ?
                  AND status = 'UPHELD'
                """,
                Integer.class,
                authorId
        );

        if (violations == null || violations < BAN_THRESHOLD) {
            return false;
        }

        int changed = jdbc.update(
                """
                UPDATE users
                SET active = FALSE
                WHERE id = ?
                  AND role = 'USER'
                  AND active = TRUE
                """,
                authorId
        );

        return changed > 0;
    }
}
