package com.creative.collaboration.service;

import com.creative.collaboration.dto.*;
import com.creative.collaboration.entity.User;
import com.creative.collaboration.entity.UserFollow;
import com.creative.collaboration.entity.UserProfile;
import com.creative.collaboration.exception.ResourceNotFoundException;
import com.creative.collaboration.repository.UserFollowRepository;
import com.creative.collaboration.repository.UserProfileRepository;
import com.creative.collaboration.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserFollowRepository userFollowRepository;

    public UserService(
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            UserFollowRepository userFollowRepository
    ) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.userFollowRepository = userFollowRepository;
    }

    // GET /api/users/{id}
    public UserResponse getUserById(Long id) {

        User user = findUser(id);

        return convertToUserResponse(user);
    }

    // PUT /api/users/{id}
    public UserResponse updateUser(
            Long id,
            UpdateUserRequest request
    ) {

        User user = findUser(id);

        if (request.username() != null
                && !request.username().isBlank()) {

            boolean usernameExists =
                    userRepository.existsByUsername(
                            request.username()
                    );

            if (usernameExists
                    && !user.getUsername()
                    .equals(request.username())) {

                throw new IllegalStateException(
                        "Username already exists"
                );
            }

            user.setUsername(request.username());
        }

        if (request.email() != null
                && !request.email().isBlank()) {

            boolean emailExists =
                    userRepository.existsByEmail(
                            request.email()
                    );

            if (emailExists
                    && !user.getEmail()
                    .equals(request.email())) {

                throw new IllegalStateException(
                        "Email already exists"
                );
            }

            user.setEmail(request.email());
        }

        User updatedUser =
                userRepository.save(user);

        return convertToUserResponse(
                updatedUser
        );
    }

    // DELETE /api/users/{id}
    public void deleteUser(Long id) {

        User user = findUser(id);

        // Soft delete
        user.setActive(false);

        userRepository.save(user);
    }

    // GET /api/users/{id}/profile
    public ProfileResponse getProfile(Long id) {

        User user = findUser(id);

        UserProfile profile =
                userProfileRepository
                        .findByUserId(id)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Profile not found"
                                        )
                        );

        return convertToProfileResponse(
                user,
                profile
        );
    }

    // PUT /api/users/{id}/profile
    public ProfileResponse updateProfile(
            Long id,
            UpdateProfileRequest request
    ) {

        User user = findUser(id);

        UserProfile profile =
                userProfileRepository
                        .findByUserId(id)
                        .orElseGet(() -> {

                            UserProfile newProfile =
                                    new UserProfile();

                            newProfile.setUser(user);

                            return newProfile;
                        });

        if (request.bio() != null) {
            profile.setBio(
                    request.bio()
            );
        }

        if (request.skills() != null) {
            profile.setSkills(
                    request.skills()
            );
        }

        if (request.achievements() != null) {
            profile.setAchievements(
                    request.achievements()
            );
        }

        if (request.profileImageUrl() != null) {
            profile.setProfileImageUrl(
                    request.profileImageUrl()
            );
        }

        UserProfile savedProfile =
                userProfileRepository.save(
                        profile
                );

        return convertToProfileResponse(
                user,
                savedProfile
        );
    }

    // POST /api/users/{id}/follow
    public void followUser(
            Long loggedInUserId,
            Long targetUserId
    ) {

        if (loggedInUserId.equals(targetUserId)) {

            throw new IllegalArgumentException(
                    "You cannot follow yourself"
            );
        }

        User follower =
                findUser(loggedInUserId);

        User following =
                findUser(targetUserId);

        boolean alreadyFollowing =
                userFollowRepository
                        .existsByFollower_IdAndFollowing_Id(
                                loggedInUserId,
                                targetUserId
                        );

        if (alreadyFollowing) {

            throw new IllegalStateException(
                    "You already follow this user"
            );
        }

        UserFollow follow =
                UserFollow.builder()
                        .follower(follower)
                        .following(following)
                        .build();

        userFollowRepository.save(follow);
    }

    // DELETE /api/users/{id}/unfollow
    public void unfollowUser(
            Long loggedInUserId,
            Long targetUserId
    ) {

        UserFollow follow =
                userFollowRepository
                        .findByFollower_IdAndFollowing_Id(
                                loggedInUserId,
                                targetUserId
                        )
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Follow relationship not found"
                                        )
                        );

        userFollowRepository.delete(follow);
    }

    // GET /api/users/{id}/followers
    public List<PublicUserResponse>
    getFollowers(Long id) {

        findUser(id);

        return userFollowRepository
                .findByFollowing_Id(id)
                .stream()
                .map(
                        follow ->
                                convertToPublicUserResponse(
                                        follow.getFollower()
                                )
                )
                .toList();
    }

    // GET /api/users/{id}/following
    public List<PublicUserResponse>
    getFollowing(Long id) {

        findUser(id);

        return userFollowRepository
                .findByFollower_Id(id)
                .stream()
                .map(
                        follow ->
                                convertToPublicUserResponse(
                                        follow.getFollowing()
                                )
                )
                .toList();
    }

    // Find user helper
    private User findUser(Long id) {

        return userRepository
                .findById(id)
                .orElseThrow(
                        () ->
                                new ResourceNotFoundException(
                                        "User not found with ID: "
                                                + id
                                )
                );
    }

    // Convert User -> UserResponse
    private UserResponse
    convertToUserResponse(User user) {

        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                user.isActive()
        );
    }

    // Convert Profile -> ProfileResponse
    private ProfileResponse
    convertToProfileResponse(
            User user,
            UserProfile profile
    ) {

        return new ProfileResponse(
                user.getId(),
                user.getUsername(),
                profile.getBio(),
                profile.getSkills(),
                profile.getAchievements(),
                profile.getProfileImageUrl()
        );
    }

    // Public follower/following response
    private PublicUserResponse
    convertToPublicUserResponse(
            User user
    ) {

        String profileImageUrl =
                userProfileRepository
                        .findByUserId(
                                user.getId()
                        )
                        .map(
                                UserProfile::getProfileImageUrl
                        )
                        .orElse(null);

        return new PublicUserResponse(
                user.getId(),
                user.getUsername(),
                profileImageUrl
        );
    }
}