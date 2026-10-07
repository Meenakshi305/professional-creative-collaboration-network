package com.creative.collaboration.controller;

import com.creative.collaboration.dto.AuthResponse;
import com.creative.collaboration.dto.CurrentUserResponse;
import com.creative.collaboration.dto.SigninRequest;
import com.creative.collaboration.dto.SignupRequest;

import com.creative.collaboration.service.AuthService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;

import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;


    public AuthController(
            AuthService authService
    ) {

        this.authService =
                authService;
    }


    // ==========================================
    // SIGNUP
    // ==========================================

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(
            @Valid
            @RequestBody
            SignupRequest request
    ) {

        AuthResponse response =
                authService.signup(
                        request
                );


        return ResponseEntity.ok(
                response
        );
    }


    // ==========================================
    // LOGIN
    // ==========================================

    @PostMapping({
            "/login",
            "/signin"
    })
    public ResponseEntity<AuthResponse> login(
            @Valid
            @RequestBody
            SigninRequest request
    ) {

        AuthResponse response =
                authService.signin(
                        request
                );


        return ResponseEntity.ok(
                response
        );
    }


    // ==========================================
    // CURRENT USER
    // ==========================================

    @GetMapping("/me")
    public ResponseEntity<CurrentUserResponse>
    getCurrentUser(
            Authentication authentication
    ) {

        String email =
                authentication.getName();


        CurrentUserResponse response =
                authService
                        .getCurrentUser(
                                email
                        );


        return ResponseEntity.ok(
                response
        );
    }


    // ==========================================
    // LOGOUT
    // ==========================================

    @PostMapping("/signout")
    public ResponseEntity<String> signout() {

        /*
         * JWT authentication is stateless.
         * Frontend removes token from
         * sessionStorage on logout.
         */

        return ResponseEntity.ok(
                "Logged out successfully"
        );
    }
}