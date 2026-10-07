package com.creative.collaboration.service;

import com.creative.collaboration.dto.ExperienceRequest;
import com.creative.collaboration.dto.ExperienceResponse;

import com.creative.collaboration.entity.User;
import com.creative.collaboration.entity.UserExperience;

import com.creative.collaboration.exception.ResourceNotFoundException;

import com.creative.collaboration.repository.UserExperienceRepository;
import com.creative.collaboration.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;


@Service
@Transactional
public class ExperienceService {

    private final UserRepository userRepository;

    private final UserExperienceRepository
            experienceRepository;


    public ExperienceService(

            UserRepository userRepository,

            UserExperienceRepository experienceRepository

    ) {

        this.userRepository =
                userRepository;

        this.experienceRepository =
                experienceRepository;
    }


    // ==========================================
    // GET EXPERIENCES
    // ==========================================

    @Transactional(readOnly = true)
    public List<ExperienceResponse>
    getExperiences(
            Long userId
    ) {

        findUser(
                userId
        );


        return experienceRepository
                .findByUserIdOrderByStartDateDesc(
                        userId
                )

                .stream()

                .map(
                        this::convertToResponse
                )

                .toList();
    }


    // ==========================================
    // ADD EXPERIENCE
    // ==========================================

    public ExperienceResponse
    addExperience(

            Long userId,

            String loggedInEmail,

            ExperienceRequest request

    ) {

        User user =
                verifyOwnership(

                        userId,

                        loggedInEmail
                );


        validateDates(
                request
        );


        UserExperience experience =
                UserExperience
                        .builder()

                        .user(
                                user
                        )

                        .jobTitle(
                                request
                                        .jobTitle()
                                        .trim()
                        )

                        .organisation(
                                request
                                        .organisation()
                                        .trim()
                        )

                        .startDate(
                                request
                                        .startDate()
                        )

                        .endDate(
                                request
                                        .currentRole()
                                        ? null
                                        : request
                                        .endDate()
                        )

                        .currentRole(
                                request
                                        .currentRole()
                        )

                        .description(
                                cleanText(
                                        request
                                                .description()
                                )
                        )

                        .build();


        UserExperience saved =
                experienceRepository
                        .save(
                                experience
                        );


        return convertToResponse(
                saved
        );
    }


    // ==========================================
    // UPDATE EXPERIENCE
    // ==========================================

    public ExperienceResponse
    updateExperience(

            Long userId,

            Long experienceId,

            String loggedInEmail,

            ExperienceRequest request

    ) {

        verifyOwnership(

                userId,

                loggedInEmail
        );


        validateDates(
                request
        );


        UserExperience experience =
                experienceRepository
                        .findByIdAndUserId(

                                experienceId,

                                userId
                        )

                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Experience not found"
                                        )
                        );


        experience.setJobTitle(
                request
                        .jobTitle()
                        .trim()
        );


        experience.setOrganisation(
                request
                        .organisation()
                        .trim()
        );


        experience.setStartDate(
                request.startDate()
        );


        experience.setCurrentRole(
                request.currentRole()
        );


        if (
                request.currentRole()
        ) {

            experience.setEndDate(
                    null
            );

        } else {

            experience.setEndDate(
                    request.endDate()
            );
        }


        experience.setDescription(
                cleanText(
                        request.description()
                )
        );


        UserExperience saved =
                experienceRepository
                        .save(
                                experience
                        );


        return convertToResponse(
                saved
        );
    }


    // ==========================================
    // DELETE EXPERIENCE
    // ==========================================

    public void deleteExperience(

            Long userId,

            Long experienceId,

            String loggedInEmail

    ) {

        verifyOwnership(

                userId,

                loggedInEmail
        );


        UserExperience experience =
                experienceRepository
                        .findByIdAndUserId(

                                experienceId,

                                userId
                        )

                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Experience not found"
                                        )
                        );


        experienceRepository
                .delete(
                        experience
                );
    }


    // ==========================================
    // OWNERSHIP CHECK
    // ==========================================

    private User verifyOwnership(

            Long requestedUserId,

            String loggedInEmail

    ) {

        if (
                loggedInEmail == null
                        ||
                        loggedInEmail.isBlank()
        ) {

            throw new IllegalStateException(
                    "Authentication required"
            );
        }


        User loggedInUser =
                userRepository
                        .findByEmail(
                                loggedInEmail
                        )

                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Logged-in user not found"
                                        )
                        );


        if (
                !loggedInUser
                        .getId()
                        .equals(
                                requestedUserId
                        )
        ) {

            throw new SecurityException(
                    "You are not allowed to modify another user's experience"
            );
        }


        return loggedInUser;
    }


    // ==========================================
    // VALIDATE DATES
    // ==========================================

    private void validateDates(
            ExperienceRequest request
    ) {

        if (
                request.startDate() == null
        ) {

            throw new IllegalArgumentException(
                    "Start date is required"
            );
        }


        if (
                !request.currentRole()
                        &&
                        request.endDate() == null
        ) {

            throw new IllegalArgumentException(
                    "End date is required unless this is your current role"
            );
        }


        if (
                request.endDate() != null
                        &&
                        request
                                .endDate()
                                .isBefore(
                                        request.startDate()
                                )
        ) {

            throw new IllegalArgumentException(
                    "End date cannot be before start date"
            );
        }
    }


    // ==========================================
    // FIND USER
    // ==========================================

    private User findUser(
            Long userId
    ) {

        return userRepository
                .findById(
                        userId
                )

                .orElseThrow(
                        () ->
                                new ResourceNotFoundException(
                                        "User not found with ID: "
                                                +
                                                userId
                                )
                );
    }


    // ==========================================
    // CLEAN TEXT
    // ==========================================

    private String cleanText(
            String value
    ) {

        if (
                value == null
        ) {

            return null;
        }


        String cleaned =
                value.trim();


        if (
                cleaned.isEmpty()
        ) {

            return null;
        }


        return cleaned;
    }


    // ==========================================
    // RESPONSE
    // ==========================================

    private ExperienceResponse
    convertToResponse(
            UserExperience experience
    ) {

        return new ExperienceResponse(

                experience.getId(),

                experience
                        .getUser()
                        .getId(),

                experience.getJobTitle(),

                experience.getOrganisation(),

                experience.getStartDate(),

                experience.getEndDate(),

                experience.isCurrentRole(),

                experience.getDescription()
        );
    }
}