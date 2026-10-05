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

import java.time.LocalDate;

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
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse signup(SignupRequest request) {
        String email = request.email().trim().toLowerCase();
        String username = request.username().trim();

        if (userRepository.existsByEmail(email)) {
            throw new IllegalStateException("Email already registered");
        }

        if (userRepository.existsByUsername(username)) {
            throw new IllegalStateException("Username already exists");
        }

        validateAccountType(request);

        User user = User.builder()
                .fullName(request.fullName().trim())
                .username(username)
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .accountType(request.accountType())
                .dateOfBirth(request.dateOfBirth())
                .role("USER")
                .active(true)
                .build();

        User savedUser = userRepository.save(user);

        UserProfile profile = UserProfile.builder()
                .user(savedUser)
                .build();

        userProfileRepository.save(profile);

        String token = jwtService.generateToken(savedUser);

        return createAuthResponse(savedUser, token, "Signup successful");
    }

    @Transactional(readOnly = true)
    public AuthResponse signin(SigninRequest request) {
        String email = request.email().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!user.isActive()) {
            throw new IllegalStateException("Account is inactive");
        }

        boolean passwordCorrect = passwordEncoder.matches(
                request.password(),
                user.getPasswordHash()
        );

        if (!passwordCorrect) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        String token = jwtService.generateToken(user);
        return createAuthResponse(user, token, "Login successful");
    }

    @Transactional(readOnly = true)
    public CurrentUserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return new CurrentUserResponse(
                user.getId(),
                user.getFullName(),
                user.getUsername(),
                user.getEmail(),
                user.getDateOfBirth(),
                user.getAccountType(),
                user.getRole(),
                user.isActive()
        );
    }

    public void changePassword(
            String email,
            String currentPassword,
            String newPassword
    ) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException(
                    "New password must be different from current password"
            );
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    private void validateAccountType(SignupRequest request) {
        if (request.accountType() == AccountType.PERSON) {
            if (request.dateOfBirth() == null) {
                throw new IllegalArgumentException(
                        "Date of birth is required for PERSON accounts"
                );
            }

            if (request.dateOfBirth().isAfter(LocalDate.now())) {
                throw new IllegalArgumentException(
                        "Date of birth cannot be in the future"
                );
            }
        }

        if (request.accountType() == AccountType.ORGANISATION
                && request.dateOfBirth() != null) {
            throw new IllegalArgumentException(
                    "Organisation accounts should not provide date of birth"
            );
        }
    }

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
                user.getAccountType(),
                user.getRole(),
                token,
                message
        );
    }
}
