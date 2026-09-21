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


    // DEV 1
    // POST /api/opportunities
    @PostMapping
    public ResponseEntity<OpportunityResponse> createOpportunity(

            @RequestHeader("X-User-Id")
            Long userId,

            @Valid
            @RequestBody
            CreateOpportunityRequest request
    ) {

        OpportunityResponse response =
                opportunityService.createOpportunity(
                        userId,
                        request
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // DEV 1
    // GET /api/opportunities
    @GetMapping
    public ResponseEntity<List<OpportunityResponse>>
    getAllOpportunities() {

        return ResponseEntity.ok(
                opportunityService.getAllOpportunities()
        );
    }


    // DEV 1
    // PUT /api/opportunities/{id}
    @PutMapping("/{id}")
    public ResponseEntity<OpportunityResponse>
    updateOpportunity(

            @PathVariable Long id,

            @RequestHeader("X-User-Id")
            Long userId,

            @RequestBody
            UpdateOpportunityRequest request
    ) {

        return ResponseEntity.ok(
                opportunityService.updateOpportunity(
                        id,
                        userId,
                        request
                )
        );
    }


    // DEV 1
    // POST /api/opportunities/{id}/apply
    @PostMapping("/{id}/apply")
    public ResponseEntity<OpportunityApplicationResponse>
    applyToOpportunity(

            @PathVariable Long id,

            @RequestHeader("X-User-Id")
            Long applicantId,

            @RequestBody(required = false)
            ApplyOpportunityRequest request
    ) {

        OpportunityApplicationResponse response =
                opportunityService.applyToOpportunity(
                        id,
                        applicantId,
                        request
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
}