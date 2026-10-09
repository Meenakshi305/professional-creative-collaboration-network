package com.creative.collaboration.controller;

import com.creative.collaboration.dto.ExperienceRequest;
import com.creative.collaboration.dto.ExperienceResponse;
import com.creative.collaboration.service.ExperienceService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/users/{userId}/experiences")
public class ExperienceController {

    private final ExperienceService experienceService;


    public ExperienceController(
            ExperienceService experienceService
    ) {

        this.experienceService =
                experienceService;
    }


    // ==========================================
    // GET EXPERIENCES
    // Public profile data
    // ==========================================

    @GetMapping
    public ResponseEntity<List<ExperienceResponse>>
    getExperiences(
            @PathVariable Long userId
    ) {

        return ResponseEntity.ok(
                experienceService
                        .getExperiences(
                                userId
                        )
        );
    }


    // ==========================================
    // ADD EXPERIENCE
    // Only logged-in owner
    // ==========================================

    @PostMapping
    public ResponseEntity<ExperienceResponse>
    addExperience(

            @PathVariable Long userId,

            @Valid
            @RequestBody
            ExperienceRequest request,

            Authentication authentication

    ) {

        String loggedInEmail =
                authentication.getName();


        ExperienceResponse response =
                experienceService
                        .addExperience(

                                userId,

                                loggedInEmail,

                                request
                        );


        return ResponseEntity.ok(
                response
        );
    }


    // ==========================================
    // UPDATE EXPERIENCE
    // Only logged-in owner
    // ==========================================

    @PutMapping("/{experienceId}")
    public ResponseEntity<ExperienceResponse>
    updateExperience(

            @PathVariable Long userId,

            @PathVariable Long experienceId,

            @Valid
            @RequestBody
            ExperienceRequest request,

            Authentication authentication

    ) {

        String loggedInEmail =
                authentication.getName();


        ExperienceResponse response =
                experienceService
                        .updateExperience(

                                userId,

                                experienceId,

                                loggedInEmail,

                                request
                        );


        return ResponseEntity.ok(
                response
        );
    }


    // ==========================================
    // DELETE EXPERIENCE
    // Only logged-in owner
    // ==========================================

    @DeleteMapping("/{experienceId}")
    public ResponseEntity<Void>
    deleteExperience(

            @PathVariable Long userId,

            @PathVariable Long experienceId,

            Authentication authentication

    ) {

        String loggedInEmail =
                authentication.getName();


        experienceService
                .deleteExperience(

                        userId,

                        experienceId,

                        loggedInEmail
                );


        return ResponseEntity
                .noContent()
                .build();
    }
}