package com.creative.collaboration.controller;

import com.creative.collaboration.dto.*;
import com.creative.collaboration.service.OpportunityService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/opportunities")
public class OpportunityController {

    private final OpportunityService opportunityService;

    public OpportunityController(
            OpportunityService opportunityService
    ) {
        this.opportunityService = opportunityService;
    }

    // CREATE OPPORTUNITY
    @PostMapping
    public ResponseEntity<OpportunityResponse> createOpportunity(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody CreateOpportunityRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        opportunityService.createOpportunity(
                                userId,
                                request
                        )
                );
    }

    // GET ALL OPPORTUNITIES
    @GetMapping
    public ResponseEntity<List<OpportunityResponse>>
    getAllOpportunities() {
        return ResponseEntity.ok(
                opportunityService.getAllOpportunities()
        );
    }

    // GET MY APPLICATIONS
    @GetMapping("/my-applications")
    public ResponseEntity<List<OpportunityApplicationResponse>>
    getMyApplications(
            @RequestHeader("X-User-Id") Long userId
    ) {
        return ResponseEntity.ok(
                opportunityService.getMyApplications(userId)
        );
    }

    // ACCEPT OR REJECT APPLICATION
    @PatchMapping("/applications/{applicationId}/status")
    public ResponseEntity<OpportunityApplicationResponse>
    updateApplicationStatus(
            @PathVariable("applicationId") Long applicationId,
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody UpdateApplicationStatusRequest request
    ) {
        return ResponseEntity.ok(
                opportunityService.updateApplicationStatus(
                        applicationId,
                        userId,
                        request
                )
        );
    }

    // GET SINGLE OPPORTUNITY
    @GetMapping("/{id}")
    public ResponseEntity<OpportunityResponse> getOpportunity(
            @PathVariable("id") Long id
    ) {
        return ResponseEntity.ok(
                opportunityService.getOpportunity(id)
        );
    }

    // UPDATE OPPORTUNITY
    @PutMapping("/{id}")
    public ResponseEntity<OpportunityResponse> updateOpportunity(
            @PathVariable("id") Long id,
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody UpdateOpportunityRequest request
    ) {
        return ResponseEntity.ok(
                opportunityService.updateOpportunity(
                        id,
                        userId,
                        request
                )
        );
    }

    // DELETE OPPORTUNITY
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOpportunity(
            @PathVariable("id") Long id,
            @RequestHeader("X-User-Id") Long userId
    ) {
        opportunityService.deleteOpportunity(id, userId);

        return ResponseEntity.noContent().build();
    }

    // APPLY TO OPPORTUNITY
    @PostMapping("/{id}/apply")
    public ResponseEntity<OpportunityApplicationResponse> apply(
            @PathVariable("id") Long id,
            @RequestHeader("X-User-Id") Long applicantId,
            @RequestBody(required = false)
            ApplyOpportunityRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        opportunityService.applyToOpportunity(
                                id,
                                applicantId,
                                request
                        )
                );
    }

    // VIEW APPLICANTS
    @GetMapping("/{id}/applications")
    public ResponseEntity<List<OpportunityApplicationResponse>>
    getApplications(
            @PathVariable("id") Long id,
            @RequestHeader("X-User-Id") Long userId
    ) {
        return ResponseEntity.ok(
                opportunityService.getApplications(id, userId)
        );
    }
}