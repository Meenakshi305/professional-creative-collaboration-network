
package com.creative.collaboration.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter
        extends OncePerRequestFilter {

    private static final Logger logger =
            LoggerFactory.getLogger(
                    JwtAuthenticationFilter.class
            );

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final com.creative.collaboration.guardian.GuardianService guardianService;
    private final com.creative.collaboration.repository.UserRepository users;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            CustomUserDetailsService userDetailsService,
            com.creative.collaboration.guardian.GuardianService guardianService,
            com.creative.collaboration.repository.UserRepository users
    ) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.guardianService = guardianService;
        this.users = users;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authorizationHeader =
                request.getHeader("Authorization");

        // No JWT supplied
        if (authorizationHeader == null ||
                !authorizationHeader.startsWith("Bearer ")) {

            filterChain.doFilter(request, response);
            return;
        }

        String token = authorizationHeader.substring(7).trim();

        try {

            if (SecurityContextHolder.getContext()
                    .getAuthentication() == null) {

                if (jwtService.isTokenValid(token)) {

                    String email = jwtService.extractEmail(token);

                    UserDetails userDetails =
                            userDetailsService.loadUserByUsername(email);

                    String path = request.getServletPath();
                    boolean limitedAccountEndpoint =
                        (request.getMethod().equals("GET") && (path.equals("/api/auth/me") || path.equals("/api/guardian/status")))
                        || (request.getMethod().equals("POST") && path.equals("/api/auth/signout"));
                    if (path.startsWith("/api/") && !limitedAccountEndpoint && !guardianService.canUsePlatform(email)) {
                        response.setStatus(403);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"message\":\"Guardian consent is required before you can use the platform.\",\"code\":\"GUARDIAN_CONSENT_REQUIRED\"}");
                        return;
                    }
                    if (path.startsWith("/api/") && !limitedAccountEndpoint && !guardianService.actionAllowed(email, request.getMethod(), path)) {
                        response.setStatus(403);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"message\":\"This action is disabled by your parent in Parental Controls.\",\"code\":\"PARENT_CONTROL_RESTRICTED\"}");
                        return;
                    }
                    String claimedId = request.getHeader("X-User-Id");
                    if (claimedId != null && !claimedId.equals(users.findByEmail(email).orElseThrow().getId().toString())) {
                        response.setStatus(403);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"message\":\"User identity does not match your login.\"}");
                        return;
                    }

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );

                    authentication.setDetails(
                            new WebAuthenticationDetailsSource()
                                    .buildDetails(request)
                    );

                    SecurityContextHolder.getContext()
                            .setAuthentication(authentication);

                    logger.debug(
                            "JWT authentication successful for path {}",
                            request.getRequestURI()
                    );

                } else {

                    logger.warn(
                            "JWT validation failed for path {}",
                            request.getRequestURI()
                    );
                }
            }

        } catch (Exception exception) {

            SecurityContextHolder.clearContext();

            logger.warn(
                    "JWT authentication failed for path {}: {}",
                    request.getRequestURI(),
                    exception.getClass().getSimpleName()
            );
        }

        filterChain.doFilter(request, response);
    }
}
