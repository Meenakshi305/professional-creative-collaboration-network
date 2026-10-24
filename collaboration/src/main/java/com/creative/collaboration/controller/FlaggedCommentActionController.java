
package com.creative.collaboration.controller;

import com.creative.collaboration.entity.FlaggedComment;
import com.creative.collaboration.repository.FlaggedCommentRepository;
import com.creative.collaboration.service.CommentWordModerationService;
import com.creative.collaboration.service.CurrentUserService;
import com.creative.collaboration.service.PostCommentService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Set;

@RestController
@RequestMapping("/api/admin/flagged-comments")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class FlaggedCommentActionController {

    private final FlaggedCommentRepository flags;
    private final CommentWordModerationService moderation;
    private final PostCommentService postComments;
    private final CurrentUserService currentUserService;
    private final JdbcTemplate jdbc;

    public FlaggedCommentActionController(
            FlaggedCommentRepository flags,
            CommentWordModerationService moderation,
            PostCommentService postComments,
            CurrentUserService currentUserService,
            JdbcTemplate jdbc
    ) {
        this.flags = flags;
        this.moderation = moderation;
        this.postComments = postComments;
        this.currentUserService = currentUserService;
        this.jdbc = jdbc;
    }

    // ==========================================
    // REQUEST AND RESPONSE RECORDS
    // ==========================================

    public record ActionRequest(
            @NotBlank String action,
            @NotBlank @Size(min = 10, max = 2000)
            String reason
    ) {}

    public record ActionResult(
            Long flagId,
            String status,
            boolean commentRemoved,
            boolean accountDeactivated
    ) {}

    public record ReviewRequest(
            @NotBlank String decision,
            @NotBlank @Size(min = 5, max = 2000)
            String note
    ) {}

    // ==========================================
    // 1. LIST ALL FLAGGED COMMENTS
    // ==========================================

    @GetMapping
    public Page<FlaggedComment> list(
            @RequestParam(defaultValue = "ALL")
            String status,
            @RequestParam(defaultValue = "0")
            int page,
            @RequestParam(defaultValue = "20")
            int size
    ) {
        PageRequest pageable = PageRequest.of(
                Math.max(0, page),
                Math.max(1, Math.min(size, 100))
        );

        String normalized = status.trim()
                .toUpperCase(Locale.ROOT);

        if ("ALL".equals(normalized)) {
            return flags.findAll(pageable);
        }

        if (!Set.of(
                "PENDING",
                "UPHELD",
                "DISMISSED"
        ).contains(normalized)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid report status"
            );
        }

        return flags.findByStatus(normalized, pageable);
    }

    // ==========================================
    // 2. REVIEW ONLY
    // ==========================================

    @PatchMapping("/{id}/review")
    @Transactional
    public FlaggedComment review(
            @PathVariable Long id,
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication
    ) {
        Long adminId = currentUserService
                .getCurrentUserId(authentication);

        return moderation.review(
                id,
                adminId,
                request.decision(),
                request.note().trim()
        );
    }

    // ==========================================
    // 3. MODERATION ACTIONS
    // ==========================================

    @PatchMapping("/{id}/action")
    @Transactional
    public ActionResult action(
            @PathVariable Long id,
            @Valid @RequestBody ActionRequest request,
            Authentication authentication
    ) {
        Long adminId = currentUserService
                .getCurrentUserId(authentication);

        String action = request.action().trim()
                .toUpperCase(Locale.ROOT);

        if (!Set.of(
                "REMOVE_COMMENT",
                "BAN_USER",
                "REMOVE_AND_BAN",
                "DISMISS"
        ).contains(action)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid moderation action"
            );
        }

        FlaggedComment flag = flags.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Flagged comment not found"
                        )
                );

        if (!"PENDING".equals(flag.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This report has already been reviewed"
            );
        }

        boolean dismiss = action.equals("DISMISS");

        boolean removeComment =
                action.equals("REMOVE_COMMENT")
                        || action.equals("REMOVE_AND_BAN");

        boolean banUser =
                action.equals("BAN_USER")
                        || action.equals("REMOVE_AND_BAN");

        Long authorId = flag.getCommentUserId();

        // ======================================
        // PROTECT ADMIN/SUPERADMIN ACCOUNTS
        // ======================================

        if (banUser) {
            List<String> roles = jdbc.query(
                    """
                    SELECT role
                    FROM users
                    WHERE id = ?
                    FOR UPDATE
                    """,
                    (rs, row) -> rs.getString("role"),
                    authorId
            );

            if (roles.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Comment author not found"
                );
            }

            String role = roles.get(0);

            if (!"USER".equalsIgnoreCase(role)
                    || authorId.equals(adminId)) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "This account cannot be banned"
                );
            }
        }

        // ======================================
        // CONFIRM OR DISMISS THE VIOLATION
        // ======================================

        FlaggedComment reviewed = moderation.review(
                id,
                adminId,
                dismiss ? "DISMISSED" : "UPHELD",
                request.reason().trim()
        );

        // ======================================
        // REMOVE ORIGINAL COMMENT
        // ======================================

        if (removeComment) {
            postComments.removeCommentByModeration(
                    flag.getPostId(),
                    flag.getCommentId(),
                    authorId
            );
        }

        // ======================================
        // EXPLICIT BAN
        // ======================================

        if (banUser) {
            jdbc.update(
                    """
                    UPDATE users
                    SET active = FALSE
                    WHERE id = ?
                      AND role = 'USER'
                      AND active = TRUE
                    """,
                    authorId
            );
        }

        // ======================================
        // CHECK FINAL ACCOUNT STATUS
        // ======================================

        List<Boolean> states = jdbc.query(
                "SELECT active FROM users WHERE id = ?",
                (rs, row) -> rs.getBoolean("active"),
                authorId
        );

        boolean accountDeactivated =
                !states.isEmpty() && !states.get(0);

        return new ActionResult(
                reviewed.getId(),
                reviewed.getStatus(),
                removeComment,
                accountDeactivated
        );
    }
}
