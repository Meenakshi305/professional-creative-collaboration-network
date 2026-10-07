package com.creative.collaboration.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;


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
    // CORS CONFIGURATION
    // ==========================================

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();


        // React / Vite frontend
        configuration.setAllowedOrigins(
                List.of(
                        "http://localhost:5173"
                )
        );


        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS"
                )
        );


        configuration.setAllowedHeaders(
                List.of("*")
        );


        configuration.setExposedHeaders(
                List.of(
                        "Authorization"
                )
        );


        configuration.setAllowCredentials(
                true
        );


        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();


        source.registerCorsConfiguration(
                "/**",
                configuration
        );


        return source;
    }


    // ==========================================
    // SECURITY FILTER CHAIN
    // ==========================================

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {


        http


                // ======================================
                // CORS
                // ======================================

                .cors(
                        cors ->
                                cors.configurationSource(
                                        corsConfigurationSource()
                                )
                )


                // ======================================
                // CSRF
                // ======================================

                .csrf(
                        csrf ->
                                csrf.disable()
                )


                // ======================================
                // STATELESS JWT
                // ======================================

                .sessionManagement(
                        session ->
                                session.sessionCreationPolicy(
                                        SessionCreationPolicy.STATELESS
                                )
                )


                // ======================================
                // ENDPOINT SECURITY
                // ======================================

                .authorizeHttpRequests(

                        auth ->
                                auth


                                        // ==========================
                                        // PUBLIC AUTH
                                        // ==========================

                                        .requestMatchers(
                                                "/api/auth/signup",
                                                "/api/auth/login",
                                                "/api/auth/signin"
                                        )
                                        .permitAll()


                                        // ==========================
                                        // PROTECTED AUTH
                                        // ==========================

                                        .requestMatchers(
                                                "/api/auth/me",
                                                "/api/auth/password",
                                                "/api/auth/signout"
                                        )
                                        .authenticated()


                                        // ==========================
                                        // POSTS
                                        // ==========================

                                        .requestMatchers(
                                                "/api/posts/**"
                                        )
                                        .authenticated()


                                        // ==========================
                                        // FEED
                                        // ==========================

                                        .requestMatchers(
                                                "/api/feed/**"
                                        )
                                        .authenticated()


                                        // ==========================
                                        // TEMPORARY
                                        //
                                        // Other APIs can stay public
                                        // while you integrate them.
                                        // ==========================

                                        .requestMatchers(
                                                "/api/**"
                                        )
                                        .permitAll()


                                        // ==========================
                                        // EVERYTHING ELSE
                                        // ==========================

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