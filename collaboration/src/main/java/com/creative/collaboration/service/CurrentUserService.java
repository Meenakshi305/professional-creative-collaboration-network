package com.creative.collaboration.service;

import com.creative.collaboration.entity.User;
import com.creative.collaboration.repository.UserRepository;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

    private final UserRepository userRepository;

    public CurrentUserService(
            UserRepository userRepository
    ) {
        this.userRepository = userRepository;
    }

    public User getCurrentUser(
            Authentication authentication
    ) {

        if (
                authentication == null
                        ||
                        !authentication.isAuthenticated()
        ) {
            throw new IllegalStateException(
                    "User is not authenticated"
            );
        }

        String email =
                authentication.getName();

        return userRepository
                .findByEmail(email)
                .orElseThrow(
                        () ->
                                new IllegalStateException(
                                        "Logged-in user not found"
                                )
                );
    }

    public Long getCurrentUserId(
            Authentication authentication
    ) {

        return getCurrentUser(authentication)
                .getId();
    }
}