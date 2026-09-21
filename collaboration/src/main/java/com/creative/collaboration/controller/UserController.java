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


    // DELETE /api/users/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void>
    deleteUser(
            @PathVariable Long id
    ) {

        userService.deleteUser(id);

        return ResponseEntity
                .noContent()
                .build();
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


    // PUT /api/users/{id}/profile
    @PutMapping("/{id}/profile")
    public ResponseEntity<ProfileResponse>
    updateProfile(
            @PathVariable Long id,
            @RequestBody
            UpdateProfileRequest request
    ) {

        return ResponseEntity.ok(
                userService.updateProfile(
                        id,
                        request
                )
        );
    }


    // POST /api/users/{id}/follow
    @PostMapping("/{id}/follow")
    public ResponseEntity<Void>
    followUser(
            @PathVariable Long id,

            @RequestHeader(
                    "X-User-Id"
            )
            Long loggedInUserId
    ) {

        userService.followUser(
                loggedInUserId,
                id
        );


        return ResponseEntity
                .status(
                        HttpStatus.CREATED
                )
                .build();
    }


    // DELETE /api/users/{id}/unfollow
    @DeleteMapping("/{id}/unfollow")
    public ResponseEntity<Void>
    unfollowUser(
            @PathVariable Long id,

            @RequestHeader(
                    "X-User-Id"
            )
            Long loggedInUserId
    ) {

        userService.unfollowUser(
                loggedInUserId,
                id
        );


        return ResponseEntity
                .noContent()
                .build();
    }


    // GET /api/users/{id}/followers
    @GetMapping("/{id}/followers")
    public ResponseEntity<
            List<PublicUserResponse>
            >
    getFollowers(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                userService
                        .getFollowers(id)
        );
    }


}
// GET /api/users/{id}/following
    @GetMapping("/{id}/following")
    public ResponseEntity<
            List<PublicUserResponse>
            >
    getFollowing(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                userService
                        .getFollowing(id)
        );
    }
