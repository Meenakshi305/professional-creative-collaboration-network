package professional_creative_collaboration_network.controller;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import professional_creative_collaboration_network.dto.AuthResponse;
import professional_creative_collaboration_network.dto.SigninRequest;
import professional_creative_collaboration_network.dto.SignupRequest;
import professional_creative_collaboration_network.service.AuthService;
import professional_creative_collaboration_network.dto.ChangePasswordRequest;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(
            @Valid @RequestBody SignupRequest request) {

        AuthResponse response =
                authService.signup(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PostMapping("/signin")
    public ResponseEntity<AuthResponse> signin(
            @Valid @RequestBody SigninRequest request) {

        AuthResponse response =
                authService.signin(request);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/signout")
    public ResponseEntity<Map<String, String>> signout() {

        return ResponseEntity.ok(
                Map.of("message", "Sign out successful")
        );
    }

    @PutMapping("/password")
    public ResponseEntity<Map<String, String>> changePassword(
            @RequestHeader("Authorization") String authorizationHeader,
            @Valid @RequestBody ChangePasswordRequest request) {

        if (!authorizationHeader.startsWith("Bearer ")) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "message",
                            "Bearer token is required"
                    ));
        }

        String token = authorizationHeader.substring(7);

        authService.changePassword(
                token,
                request.currentPassword(),
                request.newPassword()
        );

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Password changed successfully"
                )
        );
    }
}