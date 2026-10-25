
package com.creative.collaboration.service;

import com.creative.collaboration.entity.AppSupportReport;
import com.creative.collaboration.repository.AppSupportReportRepository;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class UserSettingsService {

    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwordEncoder;
    private final AppSupportReportRepository reportRepository;

    public UserSettingsService(
            JdbcTemplate jdbc,
            PasswordEncoder passwordEncoder,
            AppSupportReportRepository reportRepository
    ) {
        this.jdbc = jdbc;
        this.passwordEncoder = passwordEncoder;
        this.reportRepository = reportRepository;
    }

    private record Account(
            Long id,
            String displayName,
            String email,
            String passwordHash
    ) {}

    public record ProfileResponse(
            String displayName,
            String email
    ) {}

    public record ReportResponse(
            Long id,
            String status
    ) {}

    // Retrieve currently authenticated account.
    // Existing JWT authentication uses email as the subject.
    private Account currentAccount(Authentication auth) {

        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication required"
            );
        }

        List<Account> accounts = jdbc.query(
                """
                SELECT id, full_name, email, password_hash
                FROM users
                WHERE email = ?
                """,
                (rs, row) -> new Account(
                        rs.getLong("id"),
                        rs.getString("full_name"),
                        rs.getString("email"),
                        rs.getString("password_hash")
                ),
                auth.getName()
        );

        if (accounts.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Account not found. Sign in again."
            );
        }

        return accounts.get(0);
    }

    // ========================================
    // ACCOUNT SETTINGS
    // ========================================

    public ProfileResponse getProfile(Authentication auth) {
        Account account = currentAccount(auth);

        return new ProfileResponse(
                account.displayName(),
                account.email()
        );
    }

    @Transactional
    public ProfileResponse updateProfile(
            Authentication auth,
            String displayName,
            String email
    ) {
        Account account = currentAccount(auth);

        String cleanName = displayName.trim();
        String cleanEmail = email.trim()
                .toLowerCase(Locale.ROOT);

        if (cleanName.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Display name cannot be empty"
            );
        }

        // Prevent duplicate email addresses.
        Integer duplicateCount = jdbc.queryForObject(
                """
                SELECT COUNT(*)
                FROM users
                WHERE email = ? AND id <> ?
                """,
                Integer.class,
                cleanEmail,
                account.id()
        );

        if (duplicateCount != null && duplicateCount > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email is already registered"
            );
        }

        try {
            int updated = jdbc.update(
                    """
                    UPDATE users
                    SET full_name = ?, email = ?
                    WHERE id = ?
                    """,
                    cleanName,
                    cleanEmail,
                    account.id()
            );

            if (updated != 1) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Account not found"
                );
            }

        } catch (DuplicateKeyException ex) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email is already registered"
            );
        }

        return new ProfileResponse(
                cleanName,
                cleanEmail
        );
    }

    // ========================================
    // ACCOUNT SECURITY
    // ========================================

    @Transactional
    public void changePassword(
            Authentication auth,
            String currentPassword,
            String newPassword
    ) {
        Account account = currentAccount(auth);

        if (!passwordEncoder.matches(
                currentPassword,
                account.passwordHash()
        )) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Current password is incorrect"
            );
        }

        if (currentPassword.equals(newPassword)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "New password must be different"
            );
        }

        String encodedPassword =
                passwordEncoder.encode(newPassword);

        jdbc.update(
                """
                UPDATE users
                SET password_hash = ?
                WHERE id = ?
                """,
                encodedPassword,
                account.id()
        );
    }

    // ========================================
    // REPORT ISSUE OR USER
    // ========================================

    @Transactional
    public ReportResponse submitReport(
            Authentication auth,
            String reportType,
            String reportedUsername,
            String description
    ) {
        Account reporter = currentAccount(auth);

        String cleanType = reportType.trim()
                .toUpperCase(Locale.ROOT);

        if (!Set.of("ISSUE", "USER").contains(cleanType)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid report type"
            );
        }

        String cleanDescription = description.trim();

        if (
                cleanDescription.length() < 10 ||
                        cleanDescription.length() > 2000
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Description must be 10 to 2000 characters"
            );
        }

        Long reportedUserId = null;

        if (cleanType.equals("USER")) {

            String username = reportedUsername == null
                    ? ""
                    : reportedUsername.trim().replaceFirst("^@+", "");

            if (username.isBlank()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Username is required"
                );
            }

            List<Long> userIds = jdbc.query(
                    """
                    SELECT id
                    FROM users
                    WHERE username = ?
                    """,
                    (rs, row) -> rs.getLong("id"),
                    username
            );

            if (userIds.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Reported username does not exist"
                );
            }

            reportedUserId = userIds.get(0);

            if (reportedUserId.equals(reporter.id())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "You cannot report your own account"
                );
            }
        }

        AppSupportReport report = new AppSupportReport();

        report.setReporterUserId(reporter.id());
        report.setReportType(cleanType);
        report.setReportedUserId(reportedUserId);
        report.setDescription(cleanDescription);
        report.setStatus("PENDING");

        AppSupportReport saved =
                reportRepository.saveAndFlush(report);

        return new ReportResponse(
                saved.getId(),
                saved.getStatus()
        );
    }
}
