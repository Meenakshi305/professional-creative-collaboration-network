package com.creative.collaboration.controller;

import com.creative.collaboration.entity.User;
import com.creative.collaboration.repository.UserRepository;
import com.creative.collaboration.service.AdminAuditService;
import com.creative.collaboration.service.AdminIdentityService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import static org.springframework.http.HttpStatus.*;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
public class AdminUserController {
  private final UserRepository users;
  private final AdminIdentityService identity;
  private final AdminAuditService audit;
  public AdminUserController(UserRepository users, AdminIdentityService identity, AdminAuditService audit){
    this.users=users; this.identity=identity; this.audit=audit;
  }
  public record UserResponse(Long id, String fullName, String username, String email,
                             String role, boolean active, LocalDateTime createdAt) {}
  public record UpdateStatusRequest(@NotNull Boolean active) {}
  private UserResponse dto(User u){return new UserResponse(u.getId(),u.getFullName(),
      u.getUsername(),u.getEmail(),u.getRole(),u.isActive(),u.getCreatedAt());}
  @GetMapping public Page<UserResponse> list(Pageable page){return users.findAll(page).map(this::dto);}
  @GetMapping("/{id}") public UserResponse one(@PathVariable Long id){
    return dto(users.findById(id).orElseThrow(()->new ResponseStatusException(NOT_FOUND,"User not found")));
  }
  @PatchMapping("/{id}/status") @Transactional
  public ResponseEntity<UserResponse> status(@PathVariable Long id,
      @Valid @RequestBody UpdateStatusRequest body, Authentication auth){
    User actor=identity.current(auth);
    User target=users.findById(id).orElseThrow(()->new ResponseStatusException(NOT_FOUND,"User not found"));
    if(actor.getId().equals(target.getId())) throw new ResponseStatusException(FORBIDDEN,"Cannot change own status");
    String role=target.getRole()==null?"USER":target.getRole().replaceFirst("^ROLE_","").toUpperCase();
    if("SUPER_ADMIN".equals(role)) throw new ResponseStatusException(FORBIDDEN,"SuperAdmin accounts protected");
    if("ADMIN".equals(role)&&!identity.isSuperAdmin(auth))
      throw new ResponseStatusException(FORBIDDEN,"Only SuperAdmin can manage an Admin");
    target.setActive(body.active());
    users.save(target);
    audit.record(actor.getId(),body.active()?"ACTIVATE_USER":"DEACTIVATE_USER","USER",id,null);
    return ResponseEntity.ok(dto(target));
  }
}
