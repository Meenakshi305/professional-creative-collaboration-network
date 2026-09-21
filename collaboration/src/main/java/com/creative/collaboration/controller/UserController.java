package com.creative.collaboration.controller;

import com.creative.collaboration.dto.*;
import com.creative.collaboration.service.UserService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;


    public UserController(
            UserService userService
    ) {

        this.userService =
                userService;
    }


    // GET /api/users/{id}
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse>
    getUser(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                userService
                        .getUserById(id)
        );
    }


    // PUT /api/users/{id}
    @PutMapping("/{id}")
    public ResponseEntity<UserResponse>
    updateUser(
            @PathVariable Long id,
            @RequestBody
            UpdateUserRequest request
    ) {

        return ResponseEntity.ok(
                userService.updateUser(
                        id,
                        request
                )
        );
    }
    // GET /api/users/{id}/profile
    @GetMapping("/{id}/profile")
    public ResponseEntity<ProfileResponse>
    getProfile(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                userService
                        .getProfile(id)
        );
    }
