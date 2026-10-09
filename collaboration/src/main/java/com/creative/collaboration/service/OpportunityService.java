package com.creative.collaboration.service;

import com.creative.collaboration.dto.*;
import com.creative.collaboration.entity.Opportunity;
import com.creative.collaboration.entity.OpportunityApplication;
import com.creative.collaboration.entity.User;
import com.creative.collaboration.exception.ResourceNotFoundException;
import com.creative.collaboration.repository.OpportunityApplicationRepository;
import com.creative.collaboration.repository.OpportunityRepository;
import com.creative.collaboration.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class OpportunityService {

    private final OpportunityRepository opportunityRepository;

    private final OpportunityApplicationRepository
            applicationRepository;

    private final UserRepository userRepository;


    public OpportunityService(
            OpportunityRepository opportunityRepository,
            OpportunityApplicationRepository applicationRepository,
            UserRepository userRepository
    ) {

        this.opportunityRepository =
                opportunityRepository;

        this.applicationRepository =
                applicationRepository;

        this.userRepository =
                userRepository;
    }


    // POST /api/opportunities
    public OpportunityResponse createOpportunity(
            Long userId,
            CreateOpportunityRequest request
    ) {

        User creator = findUser(userId);

        Opportunity opportunity =
                new Opportunity();

        opportunity.setTitle(
                request.title()
        );

        opportunity.setDescription(
                request.description()
        );

        opportunity.setRequirements(
                request.requirements()
        );

        opportunity.setLocation(
                request.location()
        );

        opportunity.setApplicationDeadline(
                request.applicationDeadline()
        );

        opportunity.setCreatedBy(
                creator
        );

        Opportunity saved =
                opportunityRepository.save(
                        opportunity
                );

        return convertToResponse(saved);
    }


    // GET /api/opportunities
    @Transactional(readOnly = true)
    public List<OpportunityResponse>
    getAllOpportunities() {

        return opportunityRepository
                .findAll()
                .stream()
                .map(this::convertToResponse)
                .toList();
    }


    // GET /api/opportunities/{id}
    @Transactional(readOnly = true)
    public OpportunityResponse getOpportunity(
            Long id
    ) {

        Opportunity opportunity =
                findOpportunity(id);

        return convertToResponse(
                opportunity
        );
    }


    // PUT /api/opportunities/{id}
    public OpportunityResponse updateOpportunity(
            Long id,
            Long userId,
            UpdateOpportunityRequest request
    ) {

        Opportunity opportunity =
                findOpportunity(id);

        verifyOwner(
                opportunity,
                userId
        );

        if (request.title() != null
                && !request.title().isBlank()) {

            opportunity.setTitle(
                    request.title()
            );
        }

        if (request.description() != null
                && !request.description().isBlank()) {

            opportunity.setDescription(
                    request.description()
            );
        }

        if (request.requirements() != null) {

            opportunity.setRequirements(
                    request.requirements()
            );
        }

        if (request.location() != null) {

            opportunity.setLocation(
                    request.location()
            );
        }

        if (request.applicationDeadline()
                != null) {

            opportunity.setApplicationDeadline(
                    request.applicationDeadline()
            );
        }

        Opportunity updated =
                opportunityRepository.save(
                        opportunity
                );

        return convertToResponse(updated);
    }


    // DELETE /api/opportunities/{id}
    public void deleteOpportunity(
            Long id,
            Long userId
    ) {

        Opportunity opportunity =
                findOpportunity(id);

        verifyOwner(
                opportunity,
                userId
        );

        /*
         * Delete applications first because
         * they reference the opportunity.
         */
        applicationRepository
                .deleteByOpportunity_Id(id);

        opportunityRepository.delete(
                opportunity
        );
    }


    // POST /api/opportunities/{id}/apply
    public OpportunityApplicationResponse
    applyToOpportunity(
            Long opportunityId,
            Long applicantId,
            ApplyOpportunityRequest request
    ) {

        Opportunity opportunity =
                findOpportunity(
                        opportunityId
                );

        User applicant =
                findUser(
                        applicantId
                );

        /*
         * Opportunity creator should not
         * apply to their own opportunity.
         */
        if (opportunity
                .getCreatedBy()
                .getId()
                .equals(applicantId)) {

            throw new IllegalArgumentException(
                    "You cannot apply to your own opportunity"
            );
        }


        if (
                opportunity
                        .getApplicationDeadline()
                        != null
                        &&
                        opportunity
                                .getApplicationDeadline()
                                .isBefore(
                                        LocalDate.now()
                                )
        ) {

            throw new IllegalStateException(
                    "Application deadline has passed"
            );
        }


        boolean alreadyApplied =
                applicationRepository
                        .existsByOpportunity_IdAndApplicant_Id(
                                opportunityId,
                                applicantId
                        );


        if (alreadyApplied) {

            throw new IllegalStateException(
                    "You have already applied for this opportunity"
            );
        }


        OpportunityApplication application =
                new OpportunityApplication();

        application.setOpportunity(
                opportunity
        );

        application.setApplicant(
                applicant
        );

        if (request != null) {
            application.setMessage(
                    request.message()
            );
        }

        application.setStatus(
                "PENDING"
        );


        OpportunityApplication saved =
                applicationRepository.save(
                        application
                );


        return convertApplicationResponse(
                saved
        );
    }


    // GET /api/opportunities/{id}/applications
    @Transactional(readOnly = true)
    public List<OpportunityApplicationResponse>
    getApplications(
            Long opportunityId,
            Long userId
    ) {

        Opportunity opportunity =
                findOpportunity(
                        opportunityId
                );

        /*
         * Only opportunity owner can view
         * its applications for now.
         */
        verifyOwner(
                opportunity,
                userId
        );


        return applicationRepository
                .findByOpportunity_Id(
                        opportunityId
                )
                .stream()
                .map(
                        this::
                                convertApplicationResponse
                )
                .toList();
    }


    private User findUser(
            Long id
    ) {

        return userRepository
                .findById(id)
                .orElseThrow(
                        () ->
                                new ResourceNotFoundException(
                                        "User not found with ID: "
                                                + id
                                )
                );
    }


    private Opportunity findOpportunity(
            Long id
    ) {

        return opportunityRepository
                .findById(id)
                .orElseThrow(
                        () ->
                                new ResourceNotFoundException(
                                        "Opportunity not found with ID: "
                                                + id
                                )
                );
    }


    private void verifyOwner(
            Opportunity opportunity,
            Long userId
    ) {

        if (!opportunity
                .getCreatedBy()
                .getId()
                .equals(userId)) {

            throw new IllegalArgumentException(
                    "Only the opportunity owner can perform this action"
            );
        }
    }


    private OpportunityResponse
    convertToResponse(
            Opportunity opportunity
    ) {

        return new OpportunityResponse(

                opportunity.getId(),

                opportunity.getTitle(),

                opportunity.getDescription(),

                opportunity.getRequirements(),

                opportunity.getLocation(),

                opportunity
                        .getApplicationDeadline(),

                opportunity
                        .getCreatedBy()
                        .getId(),

                opportunity
                        .getCreatedBy()
                        .getUsername(),

                opportunity.getCreatedAt(),

                opportunity.getUpdatedAt()
        );
    }


    private OpportunityApplicationResponse
    convertApplicationResponse(
            OpportunityApplication application
    ) {

        return new OpportunityApplicationResponse(

                application.getId(),

                application
                        .getOpportunity()
                        .getId(),

                application
                        .getApplicant()
                        .getId(),

                application
                        .getApplicant()
                        .getUsername(),

                application.getMessage(),

                application.getStatus(),

                application.getAppliedAt()
        );
    }
}
