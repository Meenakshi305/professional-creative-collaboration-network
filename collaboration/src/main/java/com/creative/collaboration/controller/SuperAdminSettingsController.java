package com.creative.collaboration.controller;

import com.creative.collaboration.entity.SuperAdminModuleSetting;
import com.creative.collaboration.repository.SuperAdminModuleSettingRepository;
import com.creative.collaboration.service.AdminAuditService;
import com.creative.collaboration.service.AdminIdentityService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/superadmin/modules")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminSettingsController {
    // Persisted display/config flags. Backend business operations MUST explicitly check
    // these settings before calling them enforced feature switches.
    private static final Set<String> ALLOWED = Set.of(
            "POSTS","EVENTS","COLLABORATIONS","PORTFOLIOS","REGISTRATIONS","REPORTING");
    private final SuperAdminModuleSettingRepository repo;
    private final AdminIdentityService identity;
    private final AdminAuditService audit;
    public SuperAdminSettingsController(SuperAdminModuleSettingRepository repo,
                                        AdminIdentityService identity, AdminAuditService audit) {
        this.repo=repo;this.identity=identity;this.audit=audit;
    }
    public record Toggle(@NotNull Boolean enabled) {}
    @GetMapping public List<SuperAdminModuleSetting> list(){return repo.findAll();}
    @PutMapping("/{key}") @Transactional
    public SuperAdminModuleSetting set(@PathVariable String key, @Valid @RequestBody Toggle toggle,
                                       Authentication authentication) {
        String normalized=key.toUpperCase(java.util.Locale.ROOT);
        if(!ALLOWED.contains(normalized))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Unknown module key");
        var actor=identity.current(authentication);
        var setting=repo.findById(normalized).orElseGet(() ->
                SuperAdminModuleSetting.builder().moduleKey(normalized).enabled(true).build());
        setting.setEnabled(toggle.enabled());
        setting.setChangedById(actor.getId());
        var saved=repo.save(setting);
        audit.record(actor.getId(),"UPDATE_MODULE","MODULE",null,normalized+" enabled="+toggle.enabled());
        return saved;
    }
}
