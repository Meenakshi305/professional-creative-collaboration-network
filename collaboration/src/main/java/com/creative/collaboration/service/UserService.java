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

import org.springframework.web.multipart.MultipartFile;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;


@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;

    private final UserProfileRepository userProfileRepository;

    private final UserFollowRepository userFollowRepository;

    private final MegaStorageService megaStorageService;


    // ==========================================
    // PROFILE IMAGE CACHE
    // ==========================================

    /*
     * userId -> image bytes
     *
     * First request:
     * MEGA -> Spring Boot -> cache
     *
     * Next requests:
     * cache -> browser
     */
    private final Map<Long, byte[]> profileImageCache =
            new ConcurrentHashMap<>();


    /*
     * userId -> image MIME type
     */
    private final Map<Long, String> profileImageContentTypeCache =
            new ConcurrentHashMap<>();


    // ==========================================
    // CONSTRUCTOR
    // ==========================================

    public UserService(

            UserRepository userRepository,

            UserProfileRepository userProfileRepository,

            UserFollowRepository userFollowRepository,

            MegaStorageService megaStorageService

    ) {

        this.userRepository =
                userRepository;

        this.userProfileRepository =
                userProfileRepository;

        this.userFollowRepository =
                userFollowRepository;

        this.megaStorageService =
                megaStorageService;
    }


    // ==========================================
    // GET USER
    // ==========================================

    public UserResponse getUserById(
            Long id
    ) {

        User user =
                findUser(id);


        return convertToUserResponse(
                user
        );
    }


    // ==========================================
    // UPDATE USER
    // ==========================================

    public UserResponse updateUser(

            Long id,

            UpdateUserRequest request

    ) {

        User user =
                findUser(id);


        // ======================================
        // USERNAME
        // ======================================

        if (
                request.username() != null
                        &&
                        !request.username().isBlank()
        ) {

            boolean usernameExists =
                    userRepository
                            .existsByUsername(
                                    request.username()
                            );


            if (
                    usernameExists
                            &&
                            !user.getUsername()
                                    .equals(
                                            request.username()
                                    )
            ) {

                throw new IllegalStateException(
                        "Username already exists"
                );
            }


            user.setUsername(
                    request.username()
            );
        }


        // ======================================
        // EMAIL
        // ======================================

        if (
                request.email() != null
                        &&
                        !request.email().isBlank()
        ) {

            boolean emailExists =
                    userRepository
                            .existsByEmail(
                                    request.email()
                            );


            if (
                    emailExists
                            &&
                            !user.getEmail()
                                    .equals(
                                            request.email()
                                    )
            ) {

                throw new IllegalStateException(
                        "Email already exists"
                );
            }


            user.setEmail(
                    request.email()
            );
        }


        User updatedUser =
                userRepository.save(
                        user
                );


        return convertToUserResponse(
                updatedUser
        );
    }


    // ==========================================
    // DELETE USER
    // ==========================================

    public void deleteUser(
            Long id
    ) {

        User user =
                findUser(id);


        user.setActive(
                false
        );


        userRepository.save(
                user
        );


        /*
         * Remove cached profile image
         * when user is deactivated.
         */
        clearProfileImageCache(
                id
        );
    }


    // ==========================================
    // GET PROFILE
    // ==========================================

    public ProfileResponse getProfile(
            Long id
    ) {

        User user =
                findUser(id);


        UserProfile profile =
                userProfileRepository
                        .findByUserId(
                                id
                        )
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


    // ==========================================
    // UPDATE PROFILE
    // ==========================================

    public ProfileResponse updateProfile(

            Long id,

            UpdateProfileRequest request

    ) {

        User user =
                findUser(id);


        UserProfile profile =
                userProfileRepository
                        .findByUserId(
                                id
                        )
                        .orElseGet(
                                () -> {

                                    UserProfile newProfile =
                                            new UserProfile();


                                    newProfile.setUser(
                                            user
                                    );


                                    return newProfile;
                                }
                        );


        // ======================================
        // BIO
        // ======================================

        if (
                request.bio() != null
        ) {

            profile.setBio(
                    request.bio()
            );
        }


        // ======================================
        // SKILLS
        // ======================================

        if (
                request.skills() != null
        ) {

            profile.setSkills(
                    request.skills()
            );
        }


        // ======================================
        // ACHIEVEMENTS
        // ======================================

        if (
                request.achievements() != null
        ) {

            profile.setAchievements(
                    request.achievements()
            );
        }


        /*
         * IMPORTANT:
         *
         * Do not set profileImageUrl here.
         *
         * profileImageUrl stores the
         * private MEGA storage key.
         *
         * Image updates must go through:
         *
         * uploadProfileImage(...)
         */


        UserProfile savedProfile =
                userProfileRepository.save(
                        profile
                );


        return convertToProfileResponse(

                user,

                savedProfile
        );
    }


    // ==========================================
    // UPLOAD PROFILE IMAGE TO MEGA
    // ==========================================

    public String uploadProfileImage(

            Long userId,

            MultipartFile file

    ) {

        // ======================================
        // EMPTY FILE
        // ======================================

        if (
                file == null
                        ||
                        file.isEmpty()
        ) {

            throw new IllegalArgumentException(
                    "Profile image cannot be empty"
            );
        }


        // ======================================
        // MAXIMUM SIZE = 5 MB
        // ======================================

        long maximumSize =
                5L
                        *
                        1024
                        *
                        1024;


        if (
                file.getSize()
                        >
                        maximumSize
        ) {

            throw new IllegalArgumentException(
                    "Profile image must be smaller than 5 MB"
            );
        }


        // ======================================
        // IMAGE MIME TYPE
        // ======================================

        String contentType =
                file.getContentType();


        if (
                contentType == null
                        ||
                        !contentType.startsWith(
                                "image/"
                        )
        ) {

            throw new IllegalArgumentException(
                    "Only image files are allowed"
            );
        }


        // ======================================
        // USER
        // ======================================

        User user =
                findUser(
                        userId
                );


        // ======================================
        // PROFILE
        // ======================================

        UserProfile profile =
                userProfileRepository
                        .findByUserId(
                                userId
                        )
                        .orElseGet(
                                () -> {

                                    UserProfile newProfile =
                                            new UserProfile();


                                    newProfile.setUser(
                                            user
                                    );


                                    return newProfile;
                                }
                        );


        // ======================================
        // OLD IMAGE KEY
        // ======================================

        String oldStorageKey =
                profile.getProfileImageUrl();


        // ======================================
        // UPLOAD NEW IMAGE FIRST
        //
        // Safer than deleting old image first.
        // If new upload fails, old image remains.
        // ======================================

        MegaStorageService.StoredFile storedFile =
                megaStorageService.upload(
                        file
                );


        String newStorageKey =
                storedFile.storageKey();


        // ======================================
        // SAVE NEW KEY IN MYSQL
        // ======================================

        profile.setProfileImageUrl(
                newStorageKey
        );


        userProfileRepository.save(
                profile
        );


        // ======================================
        // CLEAR OLD CACHE
        // ======================================

        clearProfileImageCache(
                userId
        );


        /*
         * We already have the uploaded
         * bytes available from MultipartFile.
         *
         * Put them straight into cache so
         * the next browser request DOES NOT
         * immediately download from MEGA.
         */

        try {

            profileImageCache.put(
                    userId,
                    file.getBytes()
            );


            profileImageContentTypeCache.put(
                    userId,
                    contentType
            );

        } catch (Exception exception) {

            /*
             * Cache failure should not make
             * the MEGA upload fail.
             */
            System.err.println(
                    "Unable to cache uploaded profile image: "
                            +
                            exception.getMessage()
            );
        }


        // ======================================
        // DELETE OLD MEGA IMAGE
        // ======================================

        if (
                oldStorageKey != null
                        &&
                        !oldStorageKey.isBlank()
                        &&
                        !oldStorageKey.equals(
                                newStorageKey
                        )
        ) {

            try {

                megaStorageService.delete(
                        oldStorageKey
                );

            } catch (Exception exception) {

                /*
                 * New image has already been saved.
                 * Old-image cleanup failure should
                 * not break the user update.
                 */

                System.err.println(
                        "Unable to delete old profile image from MEGA: "
                                +
                                exception.getMessage()
                );
            }
        }


        // ======================================
        // RETURN BROWSER URL
        // ======================================

        return buildProfileImageUrl(
                userId
        );
    }


    // ==========================================
    // GET PROFILE IMAGE
    //
    // CACHE FIRST
    // MEGA SECOND
    // ==========================================

    @Transactional(
            readOnly = true
    )
    public byte[] getProfileImage(
            Long userId
    ) {

        // ======================================
        // 1. CHECK MEMORY CACHE
        // ======================================

        byte[] cachedImage =
                profileImageCache.get(
                        userId
                );


        if (
                cachedImage != null
        ) {

            return cachedImage;
        }


        // ======================================
        // 2. VERIFY USER
        // ======================================

        findUser(
                userId
        );


        // ======================================
        // 3. GET PROFILE
        // ======================================

        UserProfile profile =
                userProfileRepository
                        .findByUserId(
                                userId
                        )
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Profile not found"
                                        )
                        );


        // ======================================
        // 4. GET PRIVATE MEGA KEY
        // ======================================

        String storageKey =
                profile.getProfileImageUrl();


        if (
                storageKey == null
                        ||
                        storageKey.isBlank()
        ) {

            throw new ResourceNotFoundException(
                    "Profile image not found"
            );
        }


        // ======================================
        // 5. DOWNLOAD FROM MEGA
        // ======================================

        byte[] image =
                megaStorageService.retrieve(
                        storageKey
                );


        // ======================================
        // 6. CACHE RESULT
        // ======================================

        profileImageCache.put(
                userId,
                image
        );


        /*
         * If MIME type is not cached,
         * derive it from storage key.
         */

        profileImageContentTypeCache.putIfAbsent(

                userId,

                detectContentType(
                        storageKey
                )
        );


        return image;
    }


    // ==========================================
    // PROFILE IMAGE CONTENT TYPE
    // ==========================================

    @Transactional(
            readOnly = true
    )
    public String getProfileImageContentType(
            Long userId
    ) {

        // ======================================
        // CACHE FIRST
        // ======================================

        String cachedType =
                profileImageContentTypeCache.get(
                        userId
                );


        if (
                cachedType != null
        ) {

            return cachedType;
        }


        // ======================================
        // DATABASE
        // ======================================

        UserProfile profile =
                userProfileRepository
                        .findByUserId(
                                userId
                        )
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Profile not found"
                                        )
                        );


        String storageKey =
                profile.getProfileImageUrl();


        if (
                storageKey == null
                        ||
                        storageKey.isBlank()
        ) {

            throw new ResourceNotFoundException(
                    "Profile image not found"
            );
        }


        String contentType =
                detectContentType(
                        storageKey
                );


        profileImageContentTypeCache.put(
                userId,
                contentType
        );


        return contentType;
    }


    // ==========================================
    // DETECT CONTENT TYPE
    // ==========================================

    private String detectContentType(
            String storageKey
    ) {

        String lower =
                storageKey
                        .toLowerCase();


        if (
                lower.endsWith(
                        ".png"
                )
        ) {

            return "image/png";
        }


        if (
                lower.endsWith(
                        ".webp"
                )
        ) {

            return "image/webp";
        }


        if (
                lower.endsWith(
                        ".gif"
                )
        ) {

            return "image/gif";
        }


        if (
                lower.endsWith(
                        ".jpg"
                )
                        ||
                        lower.endsWith(
                                ".jpeg"
                        )
        ) {

            return "image/jpeg";
        }


        return "application/octet-stream";
    }


    // ==========================================
    // CLEAR PROFILE IMAGE CACHE
    // ==========================================

    private void clearProfileImageCache(
            Long userId
    ) {

        profileImageCache.remove(
                userId
        );


        profileImageContentTypeCache.remove(
                userId
        );
    }


    // ==========================================
// FOLLOW USER
// ==========================================

    public void followUser(

            Long loggedInUserId,

            Long targetUserId

    ) {

        if (
                loggedInUserId == null
        ) {

            throw new IllegalArgumentException(
                    "Logged-in user ID is required"
            );
        }


        if (
                targetUserId == null
        ) {

            throw new IllegalArgumentException(
                    "Target user ID is required"
            );
        }


        if (
                loggedInUserId.equals(
                        targetUserId
                )
        ) {

            throw new IllegalArgumentException(
                    "You cannot follow yourself"
            );
        }


        User follower =
                findUser(
                        loggedInUserId
                );


        User following =
                findUser(
                        targetUserId
                );


        boolean alreadyFollowing =
                userFollowRepository
                        .existsByFollower_IdAndFollowing_Id(

                                loggedInUserId,

                                targetUserId
                        );


        /*
         * If already following,
         * simply return.
         *
         * Do not throw an error.
         */
        if (
                alreadyFollowing
        ) {

            return;
        }


        UserFollow follow =
                UserFollow
                        .builder()

                        .follower(
                                follower
                        )

                        .following(
                                following
                        )

                        .build();


        userFollowRepository.save(
                follow
        );
    }


// ==========================================
// UNFOLLOW USER
// ==========================================

    public void unfollowUser(

            Long loggedInUserId,

            Long targetUserId

    ) {

        if (
                loggedInUserId == null
        ) {

            throw new IllegalArgumentException(
                    "Logged-in user ID is required"
            );
        }


        if (
                targetUserId == null
        ) {

            throw new IllegalArgumentException(
                    "Target user ID is required"
            );
        }


        /*
         * If relationship exists,
         * delete it.
         *
         * If it doesn't exist,
         * simply do nothing.
         */
        userFollowRepository
                .findByFollower_IdAndFollowing_Id(

                        loggedInUserId,

                        targetUserId
                )

                .ifPresent(
                        userFollowRepository::delete
                );
    }


// ==========================================
// FOLLOW STATUS
// ==========================================

    @Transactional(
            readOnly = true
    )
    public boolean isFollowing(

            Long loggedInUserId,

            Long targetUserId

    ) {

        if (
                loggedInUserId == null
                        ||
                        targetUserId == null
        ) {

            return false;
        }


        findUser(
                loggedInUserId
        );


        findUser(
                targetUserId
        );


        return userFollowRepository
                .existsByFollower_IdAndFollowing_Id(

                        loggedInUserId,

                        targetUserId
                );
    }


// ==========================================
// FOLLOWERS COUNT
//
// Example:
//
// User 1 follows User 2
//
// User 2 followers = 1
// ==========================================

    @Transactional(
            readOnly = true
    )
    public long getFollowersCount(
            Long userId
    ) {

        findUser(
                userId
        );


        return userFollowRepository
                .countByFollowing_Id(
                        userId
                );
    }


// ==========================================
// FOLLOWING COUNT
//
// Example:
//
// User 1 follows User 2
//
// User 1 following = 1
// ==========================================

    @Transactional(
            readOnly = true
    )
    public long getFollowingCount(
            Long userId
    ) {

        findUser(
                userId
        );


        return userFollowRepository
                .countByFollower_Id(
                        userId
                );
    }


// ==========================================
// FOLLOWERS
// ==========================================

    @Transactional(
            readOnly = true
    )
    public List<PublicUserResponse>
    getFollowers(
            Long id
    ) {

        findUser(
                id
        );


        return userFollowRepository
                .findByFollowing_Id(
                        id
                )

                .stream()

                .map(
                        follow ->
                                convertToPublicUserResponse(
                                        follow.getFollower()
                                )
                )

                .toList();
    }


// ==========================================
// FOLLOWING
// ==========================================

    @Transactional(
            readOnly = true
    )
    public List<PublicUserResponse>
    getFollowing(
            Long id
    ) {

        findUser(
                id
        );


        return userFollowRepository
                .findByFollower_Id(
                        id
                )

                .stream()

                .map(
                        follow ->
                                convertToPublicUserResponse(
                                        follow.getFollowing()
                                )
                )

                .toList();
    }

    // ==========================================
    // SUGGESTED CREATIVES
    //
    // Excludes:
    // 1. logged-in user
    // 2. users already followed
    //
    // Prioritises users with matching skills.
    // Returns maximum 3 users.
    // ==========================================

    @Transactional(
            readOnly = true
    )
    public List<SuggestedProfileResponse>
    getSuggestedProfiles(
            Long loggedInUserId
    ) {

        User loggedInUser =
                findUser(
                        loggedInUserId
                );


        // ======================================
        // USERS ALREADY FOLLOWED
        // ======================================

        Set<Long> alreadyFollowingIds =
                new HashSet<>(
                        userFollowRepository
                                .findByFollower_Id(
                                        loggedInUserId
                                )
                                .stream()
                                .map(
                                        follow ->
                                                follow
                                                        .getFollowing()
                                                        .getId()
                                )
                                .toList()
                );


        // ======================================
        // LOGGED-IN USER SKILLS
        // ======================================

        Set<String> loggedInSkills =
                userProfileRepository
                        .findByUserId(
                                loggedInUser
                                        .getId()
                        )
                        .map(
                                profile ->
                                        normaliseSkills(
                                                profile.getSkills()
                                        )
                        )
                        .orElseGet(
                                HashSet::new
                        );


        // ======================================
        // BUILD + RANK SUGGESTIONS
        // ======================================

        return userRepository
                .findAll()

                .stream()

                // Exclude myself
                .filter(
                        user ->
                                !user.getId()
                                        .equals(
                                                loggedInUserId
                                        )
                )

                // Exclude users already followed
                .filter(
                        user ->
                                !alreadyFollowingIds
                                        .contains(
                                                user.getId()
                                        )
                )

                .map(
                        user -> {

                            UserProfile profile =
                                    userProfileRepository
                                            .findByUserId(
                                                    user.getId()
                                            )
                                            .orElse(
                                                    null
                                            );


                            Set<String> candidateSkills =
                                    profile != null
                                            ?
                                            normaliseSkills(
                                                    profile.getSkills()
                                            )
                                            :
                                            new HashSet<>();


                            List<String> matchedSkills =
                                    candidateSkills
                                            .stream()

                                            .filter(
                                                    loggedInSkills::contains
                                            )

                                            .sorted()

                                            .toList();


                            int matchScore =
                                    matchedSkills.size();


                            String imageUrl =
                                    null;


                            if (
                                    profile != null
                                            &&
                                            profile
                                                    .getProfileImageUrl()
                                                    != null
                                            &&
                                            !profile
                                                    .getProfileImageUrl()
                                                    .isBlank()
                            ) {

                                imageUrl =
                                        buildProfileImageUrl(
                                                user.getId()
                                        );
                            }


                            return new SuggestedProfileResponse(

                                    user.getId(),

                                    user.getFullName(),

                                    user.getUsername(),

                                    profile != null
                                            ?
                                            profile.getSkills()
                                            :
                                            null,

                                    profile != null
                                            ?
                                            profile.getBio()
                                            :
                                            null,

                                    imageUrl,

                                    matchedSkills,

                                    matchScore
                            );
                        }
                )

                .sorted(
                        (
                                first,
                                second
                        ) -> {

                            int scoreComparison =
                                    Integer.compare(
                                            second.matchScore(),
                                            first.matchScore()
                                    );


                            if (
                                    scoreComparison != 0
                            ) {

                                return scoreComparison;
                            }


                            return Long.compare(
                                    first.userId(),
                                    second.userId()
                            );
                        }
                )

                .limit(
                        3
                )

                .toList();
    }


    // ==========================================
    // NORMALISE SKILLS
    // ==========================================

    private Set<String> normaliseSkills(
            String skills
    ) {

        Set<String> normalisedSkills =
                new HashSet<>();


        if (
                skills == null
                        ||
                        skills.isBlank()
        ) {

            return normalisedSkills;
        }


        String[] skillArray =
                skills.split(
                        ","
                );


        for (
                String skill :
                skillArray
        ) {

            String normalisedSkill =
                    skill
                            .trim()
                            .toLowerCase();


            if (
                    !normalisedSkill.isBlank()
            ) {

                normalisedSkills.add(
                        normalisedSkill
                );
            }
        }


        return normalisedSkills;
    }


    // ==========================================
    // SEARCH USERS
    // ==========================================

    public List<ProfileSearchResponse>
    searchProfiles(
            String query
    ) {

        if (
                query == null
                        ||
                        query.isBlank()
        ) {

            return List.of();
        }


        return userRepository
                .searchUsers(
                        query.trim()
                )

                .stream()

                .map(
                        user -> {

                            UserProfile profile =
                                    userProfileRepository
                                            .findByUserId(
                                                    user.getId()
                                            )
                                            .orElse(
                                                    null
                                            );


                            String imageUrl =
                                    null;


                            if (
                                    profile != null
                                            &&
                                            profile
                                                    .getProfileImageUrl()
                                                    != null
                                            &&
                                            !profile
                                                    .getProfileImageUrl()
                                                    .isBlank()
                            ) {

                                imageUrl =
                                        buildProfileImageUrl(
                                                user.getId()
                                        );
                            }


                            return new ProfileSearchResponse(

                                    user.getId(),

                                    user.getFullName(),

                                    user.getUsername(),

                                    profile != null
                                            ?
                                            profile.getSkills()
                                            :
                                            null,

                                    profile != null
                                            ?
                                            profile.getBio()
                                            :
                                            null,

                                    imageUrl
                            );
                        }
                )

                .toList();
    }


    // ==========================================
    // FIND USER
    // ==========================================

    private User findUser(
            Long id
    ) {

        return userRepository
                .findById(
                        id
                )

                .orElseThrow(
                        () ->
                                new ResourceNotFoundException(
                                        "User not found with ID: "
                                                +
                                                id
                                )
                );
    }


    // ==========================================
    // USER RESPONSE
    // ==========================================

    private UserResponse
    convertToUserResponse(
            User user
    ) {

        return new UserResponse(

                user.getId(),

                user.getUsername(),

                user.getEmail(),

                user.getRole(),

                user.isActive()
        );
    }


    // ==========================================
    // PROFILE RESPONSE
    // ==========================================

    private ProfileResponse
    convertToProfileResponse(

            User user,

            UserProfile profile

    ) {

        String imageUrl =
                null;


        if (
                profile
                        .getProfileImageUrl()
                        != null
                        &&
                        !profile
                                .getProfileImageUrl()
                                .isBlank()
        ) {

            imageUrl =
                    buildProfileImageUrl(
                            user.getId()
                    );
        }


        return new ProfileResponse(

                user.getId(),

                user.getUsername(),

                profile.getBio(),

                profile.getSkills(),

                profile.getAchievements(),

                imageUrl
        );
    }


    // ==========================================
    // PUBLIC USER RESPONSE
    // ==========================================

    private PublicUserResponse
    convertToPublicUserResponse(
            User user
    ) {

        String profileImageUrl =
                userProfileRepository
                        .findByUserId(
                                user.getId()
                        )

                        .filter(
                                profile ->
                                        profile
                                                .getProfileImageUrl()
                                                != null
                                                &&
                                                !profile
                                                        .getProfileImageUrl()
                                                        .isBlank()
                        )

                        .map(
                                profile ->
                                        buildProfileImageUrl(
                                                user.getId()
                                        )
                        )

                        .orElse(
                                null
                        );


        return new PublicUserResponse(

                user.getId(),

                user.getUsername(),

                profileImageUrl
        );
    }


    // ==========================================
    // BUILD PROFILE IMAGE URL
    // ==========================================

    private String buildProfileImageUrl(
            Long userId
    ) {

        return "http://localhost:8080/api/users/"
                +
                userId
                +
                "/profile/image";
    }
}
