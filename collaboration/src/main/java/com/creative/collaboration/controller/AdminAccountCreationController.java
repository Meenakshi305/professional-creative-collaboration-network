package com.creative.collaboration.controller;

import com.creative.collaboration.entity.User;
import com.creative.collaboration.repository.UserRepository;
import com.creative.collaboration.service.AdminAuditService;
import com.creative.collaboration.service.AdminIdentityService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.util.Locale;

@RestController
@RequestMapping("/api/admin/accounts")
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
public class AdminAccountCreationController {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final AdminAuditService audit;
    private final AdminIdentityService identity;

    public AdminAccountCreationController(UserRepository users, PasswordEncoder passwordEncoder,
                                          AdminAuditService audit, AdminIdentityService identity) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.audit = audit;
        this.identity = identity;
    }

    public record CreateUserRequest(
        @NotBlank @Size(max=150) String fullName,
        @NotBlank @Size(min=3,max=100) String username,
        @NotBlank @Email @Size(max=150) String email,
        @NotBlank @Size(min=12,max=128) String temporaryPassword,
        LocalDate dateOfBirth,
        String role
    ) {}
    public record CreatedUser(Long id, String username, String email, String role, boolean active) {}

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public CreatedUser create(@Valid @RequestBody CreateUserRequest body, Authentication auth) {
        String email = body.email().trim().toLowerCase(Locale.ROOT);
        String username = body.username().trim();
        String requestedRole = body.role() == null || body.role().isBlank()
            ? "USER" : body.role().trim().toUpperCase(Locale.ROOT);
        if (!requestedRole.equals("USER") && !requestedRole.equals("ADMIN"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Creation supports USER or ADMIN only");
        if (!requestedRole.equals("USER") && !identity.isSuperAdmin(auth))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Only SuperAdmin can create an Admin");
        if (users.existsByEmail(email) || users.existsByUsername(username))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Email or username already registered");
        if (body.dateOfBirth() != null && body.dateOfBirth().isAfter(LocalDate.now()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid date of birth");
        // For accounts requiring guardian consent, complete the existing consent process before activation.
        boolean minor = body.dateOfBirth() != null && body.dateOfBirth().isAfter(LocalDate.now().minusYears(18));
        User user = User.builder()
            .fullName(body.fullName().trim())
            .username(username)
            .email(email)
            .passwordHash(passwordEncoder.encode(body.temporaryPassword()))
            .dateOfBirth(body.dateOfBirth())
            .role(requestedRole)
            .active(!minor)
            .build();
        users.save(user);
        audit.record(identity.current(auth).getId(),"CREATE_USER","USER",user.getId(),"role="+requestedRole);
        return new CreatedUser(user.getId(),user.getUsername(),user.getEmail(),user.getRole(),user.isActive());
    }
}
