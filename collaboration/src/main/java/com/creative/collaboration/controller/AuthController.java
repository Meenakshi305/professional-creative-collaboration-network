package com.creative.collaboration.controller;

import com.creative.collaboration.dto.AuthResponse;
import com.creative.collaboration.dto.ChangePasswordRequest;
import com.creative.collaboration.dto.CurrentUserResponse;
import com.creative.collaboration.dto.SigninRequest;
import com.creative.collaboration.dto.SignupRequest;
import com.creative.collaboration.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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
            @Valid @RequestBody SignupRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(authService.signup(request));
    }

    @PostMapping({"/login", "/signin"})
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody SigninRequest request
    ) {
        return ResponseEntity.ok(authService.signin(request));
    }

    @GetMapping("/me")
    public ResponseEntity<CurrentUserResponse> getCurrentUser(
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                authService.getCurrentUser(authentication.getName())
        );
    }

    @PutMapping("/password")
    public ResponseEntity<Map<String, String>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        authService.changePassword(
                authentication.getName(),
                request.currentPassword(),
                request.newPassword()
        );

        return ResponseEntity.ok(
                Map.of("message", "Password changed successfully")
        );
    }

    @PostMapping("/signout")
    public ResponseEntity<Map<String, String>> signout() {
        return ResponseEntity.ok(
                Map.of("message", "Sign out successful")
        );
    }
}
