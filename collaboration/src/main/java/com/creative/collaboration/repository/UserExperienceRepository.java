package com.creative.collaboration.repository;

import com.creative.collaboration.entity.UserExperience;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;


public interface UserExperienceRepository
        extends JpaRepository<UserExperience, Long> {

    List<UserExperience>
    findByUserIdOrderByStartDateDesc(
            Long userId
    );


    Optional<UserExperience>
    findByIdAndUserId(
            Long id,
            Long userId
    );
}