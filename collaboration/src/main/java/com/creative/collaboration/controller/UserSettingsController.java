
package com.creative.collaboration.controller;

import com.creative.collaboration.service.UserSettingsService;
import com.creative.collaboration.service.UserSettingsService.ProfileResponse;
import com.creative.collaboration.service.UserSettingsService.ReportResponse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@PreAuthorize("isAuthenticated()")
public class UserSettingsController {

    private final UserSettingsService service;

    public UserSettingsController(UserSettingsService service) {
        this.service = service;
    }

    // ========================================
    // REQUEST DTOs
    // ========================================

    public record UpdateAccountRequest(
            @NotBlank
            @Size(max = 150)
            String displayName,

            @NotBlank
            @Email
            @Size(max = 150)
            String email
    ) {}

    public record ChangePasswordRequest(
            @NotBlank
            String currentPassword,

            @NotBlank
            @Size(min = 8, max = 128)
            String newPassword
    ) {}

    public record SubmitReportRequest(
            @NotBlank
            String reportType,

            String reportedUsername,

            @NotBlank
            @Size(min = 10, max = 2000)
            String description
    ) {}

    public record HelpItem(
            String question,
            String answer
    ) {}

    // ========================================
    // ACCOUNT SETTINGS
    // ========================================

    @GetMapping
    public ProfileResponse getAccount(
            Authentication auth
    ) {
        return service.getProfile(auth);
    }

    @PatchMapping("/account")
    public ProfileResponse updateAccount(
            @Valid @RequestBody UpdateAccountRequest request,
            Authentication auth
    ) {
        return service.updateProfile(
                auth,
                request.displayName(),
                request.email()
        );
    }

    // ========================================
    // ACCOUNT SECURITY
    // ========================================

    @PostMapping("/password")
    public Map<String, String> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication auth
    ) {
        service.changePassword(
                auth,
                request.currentPassword(),
                request.newPassword()
        );

        return Map.of(
                "message",
                "Password changed successfully. Please sign in again."
        );
    }

    // ========================================
    // REPORT ISSUE OR USER
    // ========================================

    @PostMapping("/reports")
    @ResponseStatus(HttpStatus.CREATED)
    public ReportResponse submitReport(
            @Valid @RequestBody SubmitReportRequest request,
            Authentication auth
    ) {
        return service.submitReport(
                auth,
                request.reportType(),
                request.reportedUsername(),
                request.description()
        );
    }

    // ========================================
    // HELP & SUPPORT
    // ========================================

    @GetMapping("/help")
    public List<HelpItem> getHelp() {
        return List.of(
                new HelpItem(
                        "How do I update my account?",
                        "Go to Settings > Account Settings. " +
                                "Update your name or email and select Save Changes."
                ),

                new HelpItem(
                        "How can I report another user?",
                        "Open Settings > Report Issue or User. " +
                                "Select Report a User, enter their username " +
                                "and explain the reason."
                ),

                new HelpItem(
                        "How do I report a technical problem?",
                        "Open Report Issue or User, select Technical Issue, " +
                                "describe the problem and submit the report."
                ),

                new HelpItem(
                        "How can I change my password?",
                        "Open Account Security. Enter your current password " +
                                "and choose a new password."
                ),

                new HelpItem(
                        "My portfolio image is not displaying. What should I do?",
                        "Refresh the page and check whether the image upload " +
                                "completed. Report the problem if it continues."
                ),

                new HelpItem(
                        "How do I register for an event?",
                        "Open Events, select an event and follow " +
                                "the registration instructions."
                ),

                new HelpItem(
                        "How can I apply for a collaboration?",
                        "Open Collaborations, select an opportunity " +
                                "and follow its application instructions."
                )
        );
    }

    // ========================================
    // COMMUNITY GUIDELINES
    // ========================================

    @GetMapping("/guidelines")
    public List<String> getGuidelines() {
        return List.of(
                "Treat other creators with respect. " +
                        "Harassment, bullying and hate speech are prohibited.",

                "Only publish content you own or have permission to use.",

                "Do not impersonate another person or misrepresent " +
                        "your experience and qualifications.",

                "Do not publish scams, spam or misleading events.",

                "Protect the privacy and safety of other users, " +
                        "especially minors.",

                "Users under 18 must comply with the platform's " +
                        "guardian consent requirements.",

                "Use reporting tools to report harmful content, " +
                        "inappropriate users or technical issues.",

                "Follow event and collaboration guidelines. " +
                        "Respect commitments made to other creators.",

                "Administrators may investigate reported activity " +
                        "and take appropriate moderation actions."
        );
    }
}
