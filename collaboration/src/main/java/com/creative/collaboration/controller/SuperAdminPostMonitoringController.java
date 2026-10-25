package com.creative.collaboration.controller;

import com.creative.collaboration.service.SuperAdminPostMonitoringService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/superadmin/analytics/posts", "/api/admin/analytics/posts"})
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class SuperAdminPostMonitoringController {
    private final SuperAdminPostMonitoringService monitoringService;

    public SuperAdminPostMonitoringController(SuperAdminPostMonitoringService monitoringService) {
        this.monitoringService = monitoringService;
    }

    /** 7 consecutive local server dates including today; one consistent snapshot. */
    @GetMapping("/monitor")
    public SuperAdminPostMonitoringService.Summary monitor(@RequestParam(defaultValue = "7") int days) {
        return monitoringService.monitor(days);
    }
}
