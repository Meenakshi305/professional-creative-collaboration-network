package com.creative.collaboration.service;

import com.creative.collaboration.dto.AuthResponse;
import com.creative.collaboration.dto.CurrentUserResponse;
import com.creative.collaboration.dto.SigninRequest;
import com.creative.collaboration.dto.SignupRequest;

import com.creative.collaboration.entity.User;
import com.creative.collaboration.entity.UserProfile;
import com.creative.collaboration.entity.enums.AccountType;

import com.creative.collaboration.repository.UserProfileRepository;
import com.creative.collaboration.repository.UserRepository;

import com.creative.collaboration.security.JwtService;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;


    public AuthService(
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {

        this.userRepository =
                userRepository;

        this.userProfileRepository =
                userProfileRepository;

        this.passwordEncoder =
                passwordEncoder;

        this.jwtService =
                jwtService;
    }


    // ==========================================
    // SIGNUP
    // ==========================================

    public AuthResponse signup(
            SignupRequest request
    ) {

        String email =
                request
                        .email()
                        .trim()
                        .toLowerCase();


        String username =
                request
                        .username()
                        .trim();


        if (
                userRepository
                        .existsByEmail(
                                email
                        )
        ) {

            throw new IllegalStateException(
                    "Email already registered"
            );
        }


        if (
                userRepository
                        .existsByUsername(
                                username
                        )
        ) {

            throw new IllegalStateException(
                    "Username already exists"
            );
        }


        User user =
                User
                        .builder()

                        .fullName(
                                request
                                        .fullName()
                                        .trim()
                        )

                        .username(
                                username
                        )

                        .email(
                                email
                        )

                        .passwordHash(
                                passwordEncoder
                                        .encode(
                                                request
                                                        .password()
                                        )
                        )

                        // Account type no longer comes
                        // from the frontend.
                        .accountType(
                                AccountType.PERSON
                        )

                        .dateOfBirth(
                                request
                                        .dateOfBirth()
                        )

                        .role(
                                "USER"
                        )

                        .active(
                                true
                        )

                        .build();


        User savedUser =
                userRepository.save(
                        user
                );


        UserProfile profile =
                UserProfile
                        .builder()

                        .user(
                                savedUser
                        )

                        .build();


        userProfileRepository.save(
                profile
        );


        /*
         * Signup creates the account,
         * but the frontend will still
         * direct the user to login.
         *
         * Returning token here is okay
         * if your existing controller/API
         * expects AuthResponse.
         */

        String token =
                jwtService
                        .generateToken(
                                savedUser
                        );


        return createAuthResponse(
                savedUser,
                token,
                "Signup successful"
        );
    }


    // ==========================================
    // LOGIN
    // ==========================================

    @Transactional(readOnly = true)
    public AuthResponse signin(
            SigninRequest request
    ) {

        String email =
                request
                        .email()
                        .trim()
                        .toLowerCase();


        User user =
                userRepository
                        .findByEmail(
                                email
                        )
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Invalid email or password"
                                        )
                        );


        if (!user.isActive()) {

            throw new IllegalStateException(
                    "Account is inactive"
            );
        }


        boolean correctPassword =
                passwordEncoder
                        .matches(
                                request.password(),
                                user.getPasswordHash()
                        );


        if (!correctPassword) {

            throw new IllegalArgumentException(
                    "Invalid email or password"
            );
        }


        String token =
                jwtService
                        .generateToken(
                                user
                        );


        return createAuthResponse(
                user,
                token,
                "Login successful"
        );
    }


    // ==========================================
    // CURRENT USER
    // ==========================================

    @Transactional(readOnly = true)
    public CurrentUserResponse getCurrentUser(
            String email
    ) {

        User user =
                userRepository
                        .findByEmail(
                                email
                        )
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "User not found"
                                        )
                        );


        return new CurrentUserResponse(

                user.getId(),

                user.getFullName(),

                user.getUsername(),

                user.getEmail(),

                user.getDateOfBirth(),

                user.getRole(),

                user.isActive()
        );
    }


    // ==========================================
    // CHANGE PASSWORD
    // ==========================================

    public void changePassword(
            String email,
            String currentPassword,
            String newPassword
    ) {

        User user =
                userRepository
                        .findByEmail(
                                email
                        )
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "User not found"
                                        )
                        );


        if (
                !passwordEncoder
                        .matches(
                                currentPassword,
                                user.getPasswordHash()
                        )
        ) {

            throw new IllegalArgumentException(
                    "Current password is incorrect"
            );
        }


        if (
                passwordEncoder
                        .matches(
                                newPassword,
                                user.getPasswordHash()
                        )
        ) {

            throw new IllegalArgumentException(
                    "New password must be different from current password"
            );
        }


        user.setPasswordHash(
                passwordEncoder
                        .encode(
                                newPassword
                        )
        );


        userRepository.save(
                user
        );
    }


    // ==========================================
    // AUTH RESPONSE
    // ==========================================

    private AuthResponse createAuthResponse(
            User user,
            String token,
            String message
    ) {

        return new AuthResponse(

                user.getId(),

                user.getFullName(),

                user.getUsername(),

                user.getEmail(),

                user.getRole(),

                token,

                message
        );
    }
}