package com.creative.collaboration.controller;

import com.creative.collaboration.entity.User;
import com.creative.collaboration.repository.UserRepository;
import com.creative.collaboration.service.AdminAuditService;
import com.creative.collaboration.service.AdminIdentityService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.Locale;

@RestController
@RequestMapping("/api/superadmin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminManagementController {
    private final UserRepository users;
    private final AdminIdentityService identity;
    private final AdminAuditService audit;

    public SuperAdminManagementController(UserRepository users, AdminIdentityService identity,
                                          AdminAuditService audit) {
        this.users = users; this.identity = identity; this.audit = audit;
    }

    public record UserView(Long id, String fullName, String username, String email,
                           String role, boolean active, LocalDateTime createdAt) {}
    public record SetRole(@NotBlank String role) {}
    public record SetStatus(@NotNull Boolean active) {}
    private UserView view(User u) {
        return new UserView(u.getId(),u.getFullName(),u.getUsername(),u.getEmail(),
                u.getRole(),u.isActive(),u.getCreatedAt());
    }
    private String role(User u) {
        return u.getRole() == null ? "USER" : u.getRole().replaceFirst("(?i)^ROLE_", "").toUpperCase(Locale.ROOT);
    }
    private User find(Long id) {
        return users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"User not found"));
    }
    @GetMapping("/users")
    public Page<UserView> allUsers(Pageable pageable) {
        return users.findAll(pageable).map(this::view);
    }
    @GetMapping("/admins/search")
    public java.util.List<UserView> allAdmins() {
        return users.findAll().stream()
                .filter(u -> "ADMIN".equals(role(u)) || "SUPER_ADMIN".equals(role(u)))
                .map(this::view).toList();
    }
    @PatchMapping("/users/{id}/role")
    @Transactional
    public UserView changeRole(@PathVariable Long id, @Valid @RequestBody SetRole body,
                               Authentication authentication) {
        User actor = identity.current(authentication);
        User target = find(id);
        String newRole = body.role().trim().toUpperCase(Locale.ROOT);
        if (!newRole.equals("USER") && !newRole.equals("ADMIN") && !newRole.equals("SUPER_ADMIN"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Allowed roles: USER, ADMIN, SUPER_ADMIN");
        if (actor.getId().equals(target.getId()) && !newRole.equals("SUPER_ADMIN"))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Cannot demote yourself");
        if ("SUPER_ADMIN".equals(role(target)) && !newRole.equals("SUPER_ADMIN"))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"SuperAdmin demotion requires a separate controlled process");
        String oldRole = role(target);
        target.setRole(newRole);
        users.save(target);
        audit.record(actor.getId(),"CHANGE_ROLE","USER",id,oldRole+" -> "+newRole);
        return view(target);
    }
    @PatchMapping("/users/{id}/status")
    @Transactional
    public UserView changeStatus(@PathVariable Long id, @Valid @RequestBody SetStatus body,
                                 Authentication authentication) {
        User actor = identity.current(authentication);
        User target = find(id);
        if (actor.getId().equals(target.getId()) || "SUPER_ADMIN".equals(role(target)))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Cannot deactivate yourself or a SuperAdmin");
        target.setActive(body.active());
        users.save(target);
        audit.record(actor.getId(),body.active()?"ACTIVATE_USER":"DEACTIVATE_USER","USER",id,null);
        return view(target);
    }
}
