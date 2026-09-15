package professional_creative_collaboration_network.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import professional_creative_collaboration_network.dto.AuthResponse;
import professional_creative_collaboration_network.dto.SignupRequest;
import professional_creative_collaboration_network.entity.User;
import professional_creative_collaboration_network.entity.enums.AccountStatus;
import professional_creative_collaboration_network.entity.enums.AccountType;
import professional_creative_collaboration_network.repository.UserRepository;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse signup(SignupRequest request) {

        String email = request.email().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already registered");
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
}