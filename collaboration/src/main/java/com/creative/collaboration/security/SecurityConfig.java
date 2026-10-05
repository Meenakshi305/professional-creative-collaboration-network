package com.creative.collaboration.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter
    ) {
        this.jwtAuthenticationFilter =
                jwtAuthenticationFilter;
    }


    // ==========================================
    // PASSWORD ENCODER
    // ==========================================

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }


    // ==========================================
    // SECURITY CONFIGURATION
    // ==========================================

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http

                // REST API - disable CSRF
                .csrf(
                        csrf ->
                                csrf.disable()
                )


                // JWT authentication is stateless
                .sessionManagement(
                        session ->
                                session.sessionCreationPolicy(
                                        SessionCreationPolicy.STATELESS
                                )
                )


                // ==========================================
                // ENDPOINT SECURITY
                // ==========================================

                .authorizeHttpRequests(
                        auth -> auth


                                // ==================================
                                // PUBLIC AUTH ENDPOINTS
                                // ==================================

                                .requestMatchers(
                                        "/api/auth/signup",
                                        "/api/auth/login",
                                        "/api/auth/signin"
                                )
                                .permitAll()


                                // ==================================
                                // AUTHENTICATED AUTH ENDPOINTS
                                // ==================================

                                .requestMatchers(
                                        "/api/auth/me",
                                        "/api/auth/password",
                                        "/api/auth/signout"
                                )
                                .authenticated()


                                // ==================================
                                // POSTS + FEED
                                // JWT REQUIRED
                                // ==================================

                                .requestMatchers(
                                        "/api/posts/**",
                                        "/api/feed/**"
                                )
                                .authenticated()


                                // ==================================
                                // TEMPORARY
                                //
                                // Other APIs can still work without
                                // JWT while we convert them one by one.
                                // ==================================

                                .requestMatchers(
                                        "/api/**"
                                )
                                .permitAll()


                                // Everything else requires login
                                .anyRequest()
                                .authenticated()
                );


        // ==========================================
        // JWT FILTER
        // ==========================================

        http.addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
        );


        return http.build();
    }
}