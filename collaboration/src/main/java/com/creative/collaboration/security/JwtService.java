package com.creative.collaboration.security;

import com.creative.collaboration.entity.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;

import java.nio.charset.StandardCharsets;
import java.util.Date;


@Service
public class JwtService {


    @Value("${jwt.secret}")
    private String jwtSecret;


    @Value("${jwt.expiration}")
    private long jwtExpiration;


    // ==========================================
    // SIGNING KEY
    // ==========================================

    private SecretKey getSigningKey() {

        return Keys.hmacShaKeyFor(
                jwtSecret.getBytes(
                        StandardCharsets.UTF_8
                )
        );
    }


    // ==========================================
    // GENERATE NEW JWT
    //
    // Called every time login succeeds.
    // ==========================================

    public String generateToken(
            User user
    ) {


        Date issuedAt =
                new Date();


        Date expiresAt =
                new Date(
                        issuedAt.getTime()
                                +
                                jwtExpiration
                );


        return Jwts
                .builder()

                // User identity
                .subject(
                        user.getEmail()
                )

                // Custom claims
                .claim(
                        "userId",
                        user.getId()
                )

                .claim(
                        "username",
                        user.getUsername()
                )

                .claim(
                        "role",
                        user.getRole()
                )

                // Token creation time
                .issuedAt(
                        issuedAt
                )

                // Expiry
                .expiration(
                        expiresAt
                )

                // Sign token
                .signWith(
                        getSigningKey()
                )

                .compact();
    }


    // ==========================================
    // EXTRACT ALL CLAIMS
    // ==========================================

    private Claims extractAllClaims(
            String token
    ) {


        return Jwts
                .parser()

                .verifyWith(
                        getSigningKey()
                )

                .build()

                .parseSignedClaims(
                        token
                )

                .getPayload();
    }


    // ==========================================
    // EXTRACT EMAIL
    // ==========================================

    public String extractEmail(
            String token
    ) {


        return extractAllClaims(
                token
        ).getSubject();
    }


    // ==========================================
    // VALIDATE TOKEN
    // ==========================================

    public boolean isTokenValid(
            String token
    ) {


        try {


            Claims claims =
                    extractAllClaims(
                            token
                    );


            Date expiration =
                    claims.getExpiration();


            return expiration != null
                    &&
                    expiration.after(
                            new Date()
                    );


        } catch (
                JwtException
                |
                IllegalArgumentException exception
        ) {


            return false;
        }
    }
}