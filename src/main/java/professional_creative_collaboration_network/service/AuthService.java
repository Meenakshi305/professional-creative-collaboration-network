package professional_creative_collaboration_network.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import professional_creative_collaboration_network.dto.AuthResponse;
import professional_creative_collaboration_network.dto.SigninRequest;
import professional_creative_collaboration_network.dto.SignupRequest;
import professional_creative_collaboration_network.entity.User;
import professional_creative_collaboration_network.entity.enums.AccountStatus;
import professional_creative_collaboration_network.entity.enums.AccountType;
import professional_creative_collaboration_network.repository.UserRepository;
import professional_creative_collaboration_network.security.JwtService;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse signup(SignupRequest request) {

        String email = request.email()
                .trim()
                .toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException(
                    "Email already registered"
            );
        }

        if (request.accountType() == AccountType.PERSON
                && request.dateOfBirth() == null) {

            throw new IllegalArgumentException(
                    "Date of birth is required for PERSON accounts"
            );
        }

        if (request.accountType() == AccountType.ORGANISATION
                && request.dateOfBirth() != null) {

            throw new IllegalArgumentException(
                    "Date of birth must not be provided for ORGANISATION accounts"
            );
        }

        User user = new User();

        user.setEmail(email);

        user.setPasswordHash(
                passwordEncoder.encode(request.password())
        );

        user.setAccountType(request.accountType());
        user.setDateOfBirth(request.dateOfBirth());
        user.setAccountStatus(AccountStatus.PENDING);
        user.setEmailVerified(false);

        User savedUser = userRepository.save(user);

        return new AuthResponse(
                savedUser.getUserId(),
                savedUser.getEmail(),
                savedUser.getAccountType(),
                savedUser.getAccountStatus(),
                null,
                "User registered successfully"
        );
    }

    public AuthResponse signin(SigninRequest request) {

        String email = request.email()
                .trim()
                .toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Invalid email or password"
                        )
                );

        boolean passwordMatches =
                passwordEncoder.matches(
                        request.password(),
                        user.getPasswordHash()
                );

        if (!passwordMatches) {
            throw new IllegalArgumentException(
                    "Invalid email or password"
            );
        }

        String token =
                jwtService.generateToken(user.getEmail());

        return new AuthResponse(
                user.getUserId(),
                user.getEmail(),
                user.getAccountType(),
                user.getAccountStatus(),
                token,
                "Sign in successful"
        );
    }

    public void changePassword(
            String token,
            String currentPassword,
            String newPassword) {

        if (!jwtService.isTokenValid(token)) {
            throw new IllegalArgumentException(
                    "Invalid or expired token"
            );
        }

        String email = jwtService.extractEmail(token);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User not found"
                        )
                );

        if (!passwordEncoder.matches(
                currentPassword,
                user.getPasswordHash())) {

            throw new IllegalArgumentException(
                    "Current password is incorrect"
            );
        }

        if (passwordEncoder.matches(
                newPassword,
                user.getPasswordHash())) {

            throw new IllegalArgumentException(
                    "New password must be different from current password"
            );
        }

        user.setPasswordHash(
                passwordEncoder.encode(newPassword)
        );

        userRepository.save(user);
    }
}