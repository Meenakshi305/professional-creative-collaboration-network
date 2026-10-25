package com.creative.collaboration.controller;

import com.creative.collaboration.dto.*;
import com.creative.collaboration.service.UserService;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;


@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;


    public UserController(
            UserService userService
    ) {
        this.userService = userService;
    }


    // ==========================================
    // GET USER
    // ==========================================

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                userService.getUserById(id)
        );
    }


    // ==========================================
    // UPDATE USER
    // ==========================================

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest request
    ) {

        return ResponseEntity.ok(
                userService.updateUser(
                        id,
                        request
                )
        );
    }


    // ==========================================
    // DELETE USER
    // ==========================================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable Long id
    ) {

        userService.deleteUser(id);

        return ResponseEntity
                .noContent()
                .build();
    }


    // ==========================================
    // GET PROFILE
    // ==========================================

    @GetMapping("/{id}/profile")
    public ResponseEntity<ProfileResponse> getProfile(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                userService.getProfile(id)
        );
    }


    // ==========================================
    // UPDATE PROFILE
    // ==========================================

    @PutMapping("/{id}/profile")
    public ResponseEntity<ProfileResponse> updateProfile(
            @PathVariable Long id,
            @RequestBody UpdateProfileRequest request
    ) {

        return ResponseEntity.ok(
                userService.updateProfile(
                        id,
                        request
                )
        );
    }


    // ==========================================
    // UPLOAD PROFILE IMAGE
    //
    // React
    // -> MultipartFile
    // -> UserService
    // -> MegaStorageService
    // -> MEGA
    // ==========================================

    @PostMapping(
            value = "/{id}/profile/image",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<Map<String, String>>
    uploadProfileImage(

            @PathVariable Long id,

            @RequestParam("file")
            MultipartFile file

    ) {

        String profileImageUrl =
                userService.uploadProfileImage(
                        id,
                        file
                );


        return ResponseEntity.ok(
                Map.of(
                        "profileImageUrl",
                        profileImageUrl
                )
        );
    }


    // ==========================================
    // GET PROFILE IMAGE
    //
    // Browser <img>
    // -> Spring Boot
    // -> MEGA
    // -> bytes returned
    // ==========================================

    @GetMapping("/{id}/profile/image")
    public ResponseEntity<byte[]> getProfileImage(
            @PathVariable Long id
    ) {

        byte[] image =
                userService.getProfileImage(
                        id
                );


        String contentType =
                userService
                        .getProfileImageContentType(
                                id
                        );


        return ResponseEntity
                .ok()

                .contentType(
                        MediaType.parseMediaType(
                                contentType
                        )
                )

                .cacheControl(
                        CacheControl
                                .maxAge(
                                        1,
                                        TimeUnit.HOURS
                                )
                                .cachePublic()
                )

                .body(
                        image
                );
    }


    // ==========================================
    // FOLLOW USER
    //
    // Example:
    //
    // POST /api/users/2/follow
    //
    // Header:
    // X-User-Id: 1
    //
    // Means:
    // User 1 follows User 2
    // ==========================================

    @PostMapping("/{id}/follow")
    public ResponseEntity<Void> followUser(

            @PathVariable Long id,

            @RequestHeader("X-User-Id")
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


    // ==========================================
    // UNFOLLOW USER
    // ==========================================

    @DeleteMapping("/{id}/unfollow")
    public ResponseEntity<Void> unfollowUser(

            @PathVariable Long id,

            @RequestHeader("X-User-Id")
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


    // ==========================================
    // FOLLOW STATUS
    //
    // GET /api/users/2/follow-status
    //
    // Header:
    // X-User-Id: 1
    //
    // Response:
    //
    // {
    //     "following": true
    // }
    // ==========================================

    @GetMapping("/{id}/follow-status")
    public ResponseEntity<Map<String, Boolean>>
    getFollowStatus(

            @PathVariable Long id,

            @RequestHeader("X-User-Id")
            Long loggedInUserId

    ) {

        boolean following =
                userService.isFollowing(
                        loggedInUserId,
                        id
                );


        return ResponseEntity.ok(
                Map.of(
                        "following",
                        following
                )
        );
    }


    // ==========================================
    // FOLLOWERS COUNT
    //
    // GET /api/users/2/followers/count
    //
    // Response:
    //
    // {
    //     "count": 5
    // }
    // ==========================================

    @GetMapping("/{id}/followers/count")
    public ResponseEntity<Map<String, Long>>
    getFollowersCount(
            @PathVariable Long id
    ) {

        long count =
                userService.getFollowersCount(
                        id
                );


        return ResponseEntity.ok(
                Map.of(
                        "count",
                        count
                )
        );
    }


    // ==========================================
    // FOLLOWING COUNT
    //
    // GET /api/users/1/following/count
    //
    // Response:
    //
    // {
    //     "count": 3
    // }
    // ==========================================

    @GetMapping("/{id}/following/count")
    public ResponseEntity<Map<String, Long>>
    getFollowingCount(
            @PathVariable Long id
    ) {

        long count =
                userService.getFollowingCount(
                        id
                );


        return ResponseEntity.ok(
                Map.of(
                        "count",
                        count
                )
        );
    }


    // ==========================================
    // FOLLOWERS
    // ==========================================

    @GetMapping("/{id}/followers")
    public ResponseEntity<List<PublicUserResponse>>
    getFollowers(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                userService.getFollowers(id)
        );
    }


    // ==========================================
    // FOLLOWING
    // ==========================================

    @GetMapping("/{id}/following")
    public ResponseEntity<List<PublicUserResponse>>
    getFollowing(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                userService.getFollowing(id)
        );
    }
// ==========================================
// SUGGESTED CREATIVES
//
// GET /api/users/suggestions
//
// Header:
// X-User-Id: logged-in user
// ==========================================

    @GetMapping("/suggestions")
    public ResponseEntity<
            List<SuggestedProfileResponse>
            >
    getSuggestedProfiles(

            @RequestHeader("X-User-Id")
            Long loggedInUserId

    ) {

        return ResponseEntity.ok(
                userService
                        .getSuggestedProfiles(
                                loggedInUserId
                        )
        );
    }

    // ==========================================
    // SEARCH USERS
    // ==========================================

    @GetMapping("/search")
    public ResponseEntity<List<ProfileSearchResponse>>
    searchProfiles(
            @RequestParam String query
    ) {

        return ResponseEntity.ok(
                userService.searchProfiles(
                        query
                )
        );
    }
}