package com.creative.collaboration.guardian;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/guardian")
public class GuardianController {
    private final GuardianService service;
    public GuardianController(GuardianService service) { this.service = service; }
    public record Decision(@NotNull Boolean approve, boolean guardianConfirmed) {}
    @GetMapping("/status")
    public GuardianService.ConsentStatus status(Authentication auth) { return service.status(auth.getName()); }
    @GetMapping("/requests")
    public List<GuardianService.RequestView> requests(Authentication auth) { return service.requests(auth.getName()); }
    @PostMapping("/requests/{id}/decision") @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void decide(Authentication auth, @PathVariable Long id, @Valid @RequestBody Decision decision) {
        service.decide(auth.getName(), id, decision.approve(), decision.guardianConfirmed());
    }
    @GetMapping("/children")
    public List<GuardianService.ChildView> children(Authentication auth) { return service.children(auth.getName()); }
    @GetMapping("/children/{id}/activity")
    public GuardianService.ChildActivity activity(Authentication auth, @PathVariable Long id) { return service.activity(auth.getName(), id); }
    public record ControlsRequest(@NotNull Boolean accessPaused, @NotNull Boolean postingAllowed,
                                  @NotNull Boolean eventsAllowed, @NotNull Boolean applicationsAllowed) {}
    @PostMapping("/children/{id}/controls") @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void controls(Authentication auth, @PathVariable Long id, @Valid @RequestBody ControlsRequest controls) {
        service.updateControls(auth.getName(), id, new GuardianService.Controls(controls.accessPaused(),
            controls.postingAllowed(), controls.eventsAllowed(), controls.applicationsAllowed()));
    }
    @PostMapping("/requests/{id}/revoke") @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void revoke(Authentication auth, @PathVariable Long id) { service.revoke(auth.getName(), id); }
}
