package com.creative.collaboration.service;

import com.creative.collaboration.dto.ProfileResponse;
import com.creative.collaboration.dto.PublicUserResponse;
import com.creative.collaboration.dto.UpdateProfileRequest;
import com.creative.collaboration.dto.UpdateUserRequest;
import com.creative.collaboration.dto.UserResponse;
import com.creative.collaboration.entity.User;
import com.creative.collaboration.entity.UserFollow;
import com.creative.collaboration.entity.UserProfile;
import com.creative.collaboration.exception.ResourceNotFoundException;
import com.creative.collaboration.repository.UserFollowRepository;
import com.creative.collaboration.repository.UserProfileRepository;
import com.creative.collaboration.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private UserFollowRepository userFollowRepository;

    @InjectMocks
    private UserService userService;

    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {

        user1 = new User();
        user1.setId(1L);
        user1.setUsername("sandeep");
        user1.setEmail("sandeep@test.com");
        user1.setPasswordHash("password");
        user1.setRole("USER");
        user1.setActive(true);

        user2 = new User();
        user2.setId(2L);
        user2.setUsername("artist");
        user2.setEmail("artist@test.com");
        user2.setPasswordHash("password");
        user2.setRole("USER");
        user2.setActive(true);
    }

    // ---------------------------------------------------------
    // GET USER
    // ---------------------------------------------------------

    @Test
    void getUserById_existingUser_returnsUserResponse() {

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(user1));

        UserResponse response =
                userService.getUserById(1L);

        assertNotNull(response);
        assertEquals(1L, response.id());
        assertEquals("sandeep", response.username());
        assertEquals("sandeep@test.com", response.email());
        assertEquals("USER", response.role());
        assertTrue(response.active());

        verify(userRepository).findById(1L);
    }

    @Test
    void getUserById_userNotFound_throwsException() {

        when(userRepository.findById(99L))
                .thenReturn(Optional.empty());

        ResourceNotFoundException exception =
                assertThrows(
                        ResourceNotFoundException.class,
                        () -> userService.getUserById(99L)
                );

        assertEquals(
                "User not found with ID: 99",
                exception.getMessage()
        );
    }

    // ---------------------------------------------------------
    // UPDATE USER
    // ---------------------------------------------------------

    @Test
    void updateUser_validUsernameAndEmail_updatesUser() {

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(user1));

        when(userRepository.existsByUsername("sandeep_updated"))
                .thenReturn(false);

        when(userRepository.existsByEmail("updated@test.com"))
                .thenReturn(false);

        when(userRepository.save(any(User.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0)
                );

        UpdateUserRequest request =
                new UpdateUserRequest(
                        "sandeep_updated",
                        "updated@test.com"
                );

        UserResponse response =
                userService.updateUser(
                        1L,
                        request
                );

        assertEquals(
                "sandeep_updated",
                response.username()
        );

        assertEquals(
                "updated@test.com",
                response.email()
        );

        verify(userRepository)
                .save(user1);
    }

    @Test
    void updateUser_duplicateUsername_throwsException() {

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(user1));

        when(userRepository.existsByUsername("artist"))
                .thenReturn(true);

        UpdateUserRequest request =
                new UpdateUserRequest(
                        "artist",
                        null
                );

        IllegalStateException exception =
                assertThrows(
                        IllegalStateException.class,
                        () ->
                                userService.updateUser(
                                        1L,
                                        request
                                )
                );

        assertEquals(
                "Username already exists",
                exception.getMessage()
        );

        verify(userRepository, never())
                .save(any(User.class));
    }

    @Test
    void updateUser_duplicateEmail_throwsException() {

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(user1));

        when(userRepository.existsByEmail("artist@test.com"))
                .thenReturn(true);

        UpdateUserRequest request =
                new UpdateUserRequest(
                        null,
                        "artist@test.com"
                );

        IllegalStateException exception =
                assertThrows(
                        IllegalStateException.class,
                        () ->
                                userService.updateUser(
                                        1L,
                                        request
                                )
                );

        assertEquals(
                "Email already exists",
                exception.getMessage()
        );

        verify(userRepository, never())
                .save(any(User.class));
    }

    @Test
    void updateUser_sameUsername_allowed() {

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(user1));

        when(userRepository.existsByUsername("sandeep"))
                .thenReturn(true);

        when(userRepository.save(any(User.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0)
                );

        UpdateUserRequest request =
                new UpdateUserRequest(
                        "sandeep",
                        null
                );

        UserResponse response =
                userService.updateUser(
                        1L,
                        request
                );

        assertEquals(
                "sandeep",
                response.username()
        );

        verify(userRepository)
                .save(user1);
    }

    @Test
    void updateUser_sameEmail_allowed() {

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(user1));

        when(userRepository.existsByEmail("sandeep@test.com"))
                .thenReturn(true);

        when(userRepository.save(any(User.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0)
                );

        UpdateUserRequest request =
                new UpdateUserRequest(
                        null,
                        "sandeep@test.com"
                );

        UserResponse response =
                userService.updateUser(
                        1L,
                        request
                );

        assertEquals(
                "sandeep@test.com",
                response.email()
        );

        verify(userRepository)
                .save(user1);
    }

    @Test
    void updateUser_blankValues_doesNotChangeExistingValues() {

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(user1));

        when(userRepository.save(any(User.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0)
                );

        UpdateUserRequest request =
                new UpdateUserRequest(
                        "   ",
                        ""
                );

        UserResponse response =
                userService.updateUser(
                        1L,
                        request
                );

        assertEquals(
                "sandeep",
                response.username()
        );

        assertEquals(
                "sandeep@test.com",
                response.email()
        );

        verify(userRepository, never())
                .existsByUsername(anyString());

        verify(userRepository, never())
                .existsByEmail(anyString());
    }

    // ---------------------------------------------------------
    // DELETE USER
    // ---------------------------------------------------------

    @Test
    void deleteUser_existingUser_softDeletesUser() {

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(user1));

        userService.deleteUser(1L);

        assertFalse(user1.isActive());

        verify(userRepository)
                .save(user1);
    }

    @Test
    void deleteUser_userNotFound_throwsException() {

        when(userRepository.findById(99L))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> userService.deleteUser(99L)
        );

        verify(userRepository, never())
                .save(any(User.class));
    }

    // ---------------------------------------------------------
    // GET PROFILE
    // ---------------------------------------------------------

    @Test
    void getProfile_existingProfile_returnsProfile() {

        UserProfile profile =
                createProfile(user1);

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(user1));

        when(userProfileRepository.findByUserId(1L))
                .thenReturn(Optional.of(profile));

        ProfileResponse response =
                userService.getProfile(1L);

        assertNotNull(response);
        assertEquals(1L, response.userId());
        assertEquals("sandeep", response.username());
        assertEquals(
                "Software developer",
                response.bio()
        );
        assertEquals(
                "Java, Spring Boot",
                response.skills()
        );
    }

    @Test
    void getProfile_profileNotFound_throwsException() {

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(user1));

        when(userProfileRepository.findByUserId(1L))
                .thenReturn(Optional.empty());

        ResourceNotFoundException exception =
                assertThrows(
                        ResourceNotFoundException.class,
                        () ->
                                userService.getProfile(1L)
                );

        assertEquals(
                "Profile not found",
                exception.getMessage()
        );
    }

    @Test
    void getProfile_userNotFound_throwsException() {

        when(userRepository.findById(99L))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () ->
                        userService.getProfile(99L)
        );

        verify(
                userProfileRepository,
                never()
        ).findByUserId(anyLong());
    }

    // ---------------------------------------------------------
    // UPDATE PROFILE
    // ---------------------------------------------------------

    @Test
    void updateProfile_existingProfile_updatesFields() {

        UserProfile profile =
                createProfile(user1);

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(user1));

        when(userProfileRepository.findByUserId(1L))
                .thenReturn(Optional.of(profile));

        when(userProfileRepository.save(any(UserProfile.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0)
                );

        UpdateProfileRequest request =
                new UpdateProfileRequest(
                        "Updated bio",
                        "Java, Spring Boot, React",
                        "Completed project",
                        "new-profile.jpg"
                );

        ProfileResponse response =
                userService.updateProfile(
                        1L,
                        request
                );

        assertEquals(
                "Updated bio",
                response.bio()
        );

        assertEquals(
                "Java, Spring Boot, React",
                response.skills()
        );

        assertEquals(
                "Completed project",
                response.achievements()
        );

        assertEquals(
                "new-profile.jpg",
                response.profileImageUrl()
        );

        verify(userProfileRepository)
                .save(profile);
    }

    @Test
    void updateProfile_profileDoesNotExist_createsProfile() {

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(user1));

        when(userProfileRepository.findByUserId(1L))
                .thenReturn(Optional.empty());

        when(userProfileRepository.save(any(UserProfile.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0)
                );

        UpdateProfileRequest request =
                new UpdateProfileRequest(
                        "New profile",
                        "Java",
                        "Masters Student",
                        "profile.jpg"
                );

        ProfileResponse response =
                userService.updateProfile(
                        1L,
                        request
                );

        assertEquals(
                "New profile",
                response.bio()
        );

        assertEquals(
                "Java",
                response.skills()
        );

        ArgumentCaptor<UserProfile> captor =
                ArgumentCaptor.forClass(
                        UserProfile.class
                );

        verify(userProfileRepository)
                .save(captor.capture());

        UserProfile savedProfile =
                captor.getValue();

        assertSame(
                user1,
                savedProfile.getUser()
        );
    }

    @Test
    void updateProfile_nullFields_keepExistingValues() {

        UserProfile profile =
                createProfile(user1);

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(user1));

        when(userProfileRepository.findByUserId(1L))
                .thenReturn(Optional.of(profile));

        when(userProfileRepository.save(any(UserProfile.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0)
                );

        UpdateProfileRequest request =
                new UpdateProfileRequest(
                        null,
                        null,
                        null,
                        null
                );

        ProfileResponse response =
                userService.updateProfile(
                        1L,
                        request
                );

        assertEquals(
                "Software developer",
                response.bio()
        );

        assertEquals(
                "Java, Spring Boot",
                response.skills()
        );

        assertEquals(
                "Masters Student",
                response.achievements()
        );

        assertEquals(
                "profile.jpg",
                response.profileImageUrl()
        );
    }

    // ---------------------------------------------------------
    // FOLLOW USER
    // ---------------------------------------------------------

    @Test
    void followUser_validUsers_createsFollowRelationship() {

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(user1));

        when(userRepository.findById(2L))
                .thenReturn(Optional.of(user2));

        when(
                userFollowRepository
                        .existsByFollower_IdAndFollowing_Id(
                                1L,
                                2L
                        )
        ).thenReturn(false);

        userService.followUser(
                1L,
                2L
        );

        ArgumentCaptor<UserFollow> captor =
                ArgumentCaptor.forClass(
                        UserFollow.class
                );

        verify(userFollowRepository)
                .save(captor.capture());

        UserFollow savedFollow =
                captor.getValue();

        assertSame(
                user1,
                savedFollow.getFollower()
        );

        assertSame(
                user2,
                savedFollow.getFollowing()
        );
    }

    @Test
    void followUser_sameUser_throwsException() {

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () ->
                                userService.followUser(
                                        1L,
                                        1L
                                )
                );

        assertEquals(
                "You cannot follow yourself",
                exception.getMessage()
        );

        verifyNoInteractions(
                userRepository,
                userFollowRepository
        );
    }

    @Test
    void followUser_alreadyFollowing_throwsException() {

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(user1));

        when(userRepository.findById(2L))
                .thenReturn(Optional.of(user2));

        when(
                userFollowRepository
                        .existsByFollower_IdAndFollowing_Id(
                                1L,
                                2L
                        )
        ).thenReturn(true);

        IllegalStateException exception =
                assertThrows(
                        IllegalStateException.class,
                        () ->
                                userService.followUser(
                                        1L,
                                        2L
                                )
                );

        assertEquals(
                "You already follow this user",
                exception.getMessage()
        );

        verify(userFollowRepository, never())
                .save(any(UserFollow.class));
    }

    @Test
    void followUser_followerNotFound_throwsException() {

        when(userRepository.findById(99L))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () ->
                        userService.followUser(
                                99L,
                                2L
                        )
        );

        verify(userFollowRepository, never())
                .save(any(UserFollow.class));
    }

    @Test
    void followUser_targetUserNotFound_throwsException() {

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(user1));

        when(userRepository.findById(99L))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () ->
                        userService.followUser(
                                1L,
                                99L
                        )
        );

        verify(userFollowRepository, never())
                .save(any(UserFollow.class));
    }

    // ---------------------------------------------------------
    // UNFOLLOW USER
    // ---------------------------------------------------------

    @Test
    void unfollowUser_existingRelationship_deletesFollow() {

        UserFollow follow =
                UserFollow.builder()
                        .follower(user1)
                        .following(user2)
                        .build();

        when(
                userFollowRepository
                        .findByFollower_IdAndFollowing_Id(
                                1L,
                                2L
                        )
        ).thenReturn(Optional.of(follow));

        userService.unfollowUser(
                1L,
                2L
        );

        verify(userFollowRepository)
                .delete(follow);
    }

    @Test
    void unfollowUser_relationshipNotFound_throwsException() {

        when(
                userFollowRepository
                        .findByFollower_IdAndFollowing_Id(
                                1L,
                                2L
                        )
        ).thenReturn(Optional.empty());

        ResourceNotFoundException exception =
                assertThrows(
                        ResourceNotFoundException.class,
                        () ->
                                userService.unfollowUser(
                                        1L,
                                        2L
                                )
                );

        assertEquals(
                "Follow relationship not found",
                exception.getMessage()
        );

        verify(userFollowRepository, never())
                .delete(any(UserFollow.class));
    }

    // ---------------------------------------------------------
    // FOLLOWERS
    // ---------------------------------------------------------

    @Test
    void getFollowers_existingFollowers_returnsFollowers() {

        UserFollow follow =
                UserFollow.builder()
                        .follower(user2)
                        .following(user1)
                        .build();

        UserProfile profile =
                createProfile(user2);

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(user1));

        when(userFollowRepository.findByFollowing_Id(1L))
                .thenReturn(List.of(follow));

        when(userProfileRepository.findByUserId(2L))
                .thenReturn(Optional.of(profile));

        List<PublicUserResponse> result =
                userService.getFollowers(1L);

        assertEquals(1, result.size());

        assertEquals(
                2L,
                result.get(0).id()
        );

        assertEquals(
                "artist",
                result.get(0).username()
        );

        assertEquals(
                "profile.jpg",
                result.get(0).profileImageUrl()
        );
    }

    @Test
    void getFollowers_noFollowers_returnsEmptyList() {

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(user1));

        when(userFollowRepository.findByFollowing_Id(1L))
                .thenReturn(List.of());

        List<PublicUserResponse> result =
                userService.getFollowers(1L);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void getFollowers_userNotFound_throwsException() {

        when(userRepository.findById(99L))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () ->
                        userService.getFollowers(99L)
        );

        verify(userFollowRepository, never())
                .findByFollowing_Id(anyLong());
    }

    // ---------------------------------------------------------
    // FOLLOWING
    // ---------------------------------------------------------

    @Test
    void getFollowing_existingFollowing_returnsUsers() {

        UserFollow follow =
                UserFollow.builder()
                        .follower(user1)
                        .following(user2)
                        .build();

        UserProfile profile =
                createProfile(user2);

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(user1));

        when(userFollowRepository.findByFollower_Id(1L))
                .thenReturn(List.of(follow));

        when(userProfileRepository.findByUserId(2L))
                .thenReturn(Optional.of(profile));

        List<PublicUserResponse> result =
                userService.getFollowing(1L);

        assertEquals(1, result.size());

        assertEquals(
                2L,
                result.get(0).id()
        );

        assertEquals(
                "artist",
                result.get(0).username()
        );

        assertEquals(
                "profile.jpg",
                result.get(0).profileImageUrl()
        );
    }

    @Test
    void getFollowing_noUsers_returnsEmptyList() {

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(user1));

        when(userFollowRepository.findByFollower_Id(1L))
                .thenReturn(List.of());

        List<PublicUserResponse> result =
                userService.getFollowing(1L);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void getFollowing_userWithoutProfile_returnsNullImage() {

        UserFollow follow =
                UserFollow.builder()
                        .follower(user1)
                        .following(user2)
                        .build();

        when(userRepository.findById(1L))
                .thenReturn(Optional.of(user1));

        when(userFollowRepository.findByFollower_Id(1L))
                .thenReturn(List.of(follow));

        when(userProfileRepository.findByUserId(2L))
                .thenReturn(Optional.empty());

        List<PublicUserResponse> result =
                userService.getFollowing(1L);

        assertEquals(1, result.size());
        assertNull(
                result.get(0).profileImageUrl()
        );
    }

    // ---------------------------------------------------------
    // HELPER
    // ---------------------------------------------------------

    private UserProfile createProfile(User user) {

        UserProfile profile =
                new UserProfile();

        profile.setUser(user);
        profile.setBio(
                "Software developer"
        );
        profile.setSkills(
                "Java, Spring Boot"
        );
        profile.setAchievements(
                "Masters Student"
        );
        profile.setProfileImageUrl(
                "profile.jpg"
        );

        return profile;
    }
}