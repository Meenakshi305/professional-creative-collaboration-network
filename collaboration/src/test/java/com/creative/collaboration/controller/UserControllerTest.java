package com.creative.collaboration.controller;

import com.creative.collaboration.dto.ProfileResponse;
import com.creative.collaboration.dto.PublicUserResponse;
import com.creative.collaboration.dto.UpdateProfileRequest;
import com.creative.collaboration.dto.UpdateUserRequest;
import com.creative.collaboration.dto.UserResponse;
import com.creative.collaboration.exception.ResourceNotFoundException;
import com.creative.collaboration.service.UserService;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;


    // =========================================================
    // GET /api/users/{id}
    // =========================================================

    @Test
    void getUser_existingUser_returns200() throws Exception {

        UserResponse response =
                new UserResponse(
                        1L,
                        "sandeep",
                        "sandeep@test.com",
                        "USER",
                        true
                );

        when(userService.getUserById(1L))
                .thenReturn(response);

        mockMvc.perform(
                        get("/api/users/1")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.username").value("sandeep"))
                .andExpect(jsonPath("$.email").value("sandeep@test.com"))
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.active").value(true));
    }


    @Test
    void getUser_userNotFound_returns404() throws Exception {

        when(userService.getUserById(99L))
                .thenThrow(
                        new ResourceNotFoundException(
                                "User not found"
                        )
                );

        mockMvc.perform(
                        get("/api/users/99")
                )
                .andExpect(status().isNotFound())
                .andExpect(
                        jsonPath("$.error")
                                .value("User not found")
                );
    }


    @Test
    void getUser_invalidId_returns400() throws Exception {

        mockMvc.perform(
                        get("/api/users/abc")
                )
                .andExpect(status().isBadRequest());
    }


    // =========================================================
    // PUT /api/users/{id}
    // =========================================================

    @Test
    void updateUser_validRequest_returns200() throws Exception {

        UserResponse response =
                new UserResponse(
                        1L,
                        "sandeep_updated",
                        "updated@test.com",
                        "USER",
                        true
                );

        when(
                userService.updateUser(
                        eq(1L),
                        any(UpdateUserRequest.class)
                )
        ).thenReturn(response);

        mockMvc.perform(
                        put("/api/users/1")
                                .contentType("application/json")
                                .content("""
                                        {
                                          "username": "sandeep_updated",
                                          "email": "updated@test.com"
                                        }
                                        """)
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.username")
                                .value("sandeep_updated")
                )
                .andExpect(
                        jsonPath("$.email")
                                .value("updated@test.com")
                );
    }


    @Test
    void updateUser_userNotFound_returns404() throws Exception {

        when(
                userService.updateUser(
                        eq(99L),
                        any(UpdateUserRequest.class)
                )
        ).thenThrow(
                new ResourceNotFoundException(
                        "User not found"
                )
        );

        mockMvc.perform(
                        put("/api/users/99")
                                .contentType("application/json")
                                .content("""
                                        {
                                          "username": "test",
                                          "email": "test@test.com"
                                        }
                                        """)
                )
                .andExpect(status().isNotFound())
                .andExpect(
                        jsonPath("$.error")
                                .value("User not found")
                );
    }


    @Test
    void updateUser_invalidJson_returns400() throws Exception {

        mockMvc.perform(
                        put("/api/users/1")
                                .contentType("application/json")
                                .content("""
                                        {
                                          "username":
                                        }
                                        """)
                )
                .andExpect(status().isBadRequest());
    }


    // =========================================================
    // DELETE /api/users/{id}
    // =========================================================

    @Test
    void deleteUser_existingUser_returns204() throws Exception {

        doNothing()
                .when(userService)
                .deleteUser(1L);

        mockMvc.perform(
                        delete("/api/users/1")
                )
                .andExpect(status().isNoContent());

        verify(userService)
                .deleteUser(1L);
    }


    // =========================================================
    // GET /api/users/{id}/profile
    // =========================================================

    @Test
    void getProfile_existingUser_returns200() throws Exception {

        ProfileResponse response =
                new ProfileResponse(
                        1L,
                        "sandeep",
                        "Software developer",
                        "Java, Spring Boot",
                        "Masters Student",
                        "profile.jpg"
                );

        when(userService.getProfile(1L))
                .thenReturn(response);

        mockMvc.perform(
                        get("/api/users/1/profile")
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.userId")
                                .value(1)
                )
                .andExpect(
                        jsonPath("$.username")
                                .value("sandeep")
                )
                .andExpect(
                        jsonPath("$.bio")
                                .value("Software developer")
                );
    }


    @Test
    void getProfile_userNotFound_returns404() throws Exception {

        when(userService.getProfile(99L))
                .thenThrow(
                        new ResourceNotFoundException(
                                "User not found"
                        )
                );

        mockMvc.perform(
                        get("/api/users/99/profile")
                )
                .andExpect(status().isNotFound());
    }


    // =========================================================
    // PUT /api/users/{id}/profile
    // =========================================================

    @Test
    void updateProfile_validRequest_returns200() throws Exception {

        ProfileResponse response =
                new ProfileResponse(
                        1L,
                        "sandeep",
                        "Updated bio",
                        "Java, Spring Boot, React",
                        "Project completed",
                        "new-profile.jpg"
                );

        when(
                userService.updateProfile(
                        eq(1L),
                        any(UpdateProfileRequest.class)
                )
        ).thenReturn(response);

        mockMvc.perform(
                        put("/api/users/1/profile")
                                .contentType("application/json")
                                .content("""
                                        {
                                          "bio": "Updated bio",
                                          "skills": "Java, Spring Boot, React",
                                          "achievements": "Project completed",
                                          "profileImageUrl": "new-profile.jpg"
                                        }
                                        """)
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.bio")
                                .value("Updated bio")
                )
                .andExpect(
                        jsonPath("$.skills")
                                .value("Java, Spring Boot, React")
                );
    }


    // =========================================================
    // POST /api/users/{id}/follow
    // =========================================================

    @Test
    void followUser_validRequest_returns201() throws Exception {

        doNothing()
                .when(userService)
                .followUser(1L, 2L);

        mockMvc.perform(
                        post("/api/users/2/follow")
                                .header(
                                        "X-User-Id",
                                        "1"
                                )
                )
                .andExpect(status().isCreated());

        verify(userService)
                .followUser(1L, 2L);
    }


    @Test
    void followUser_missingHeader_returns400() throws Exception {

        mockMvc.perform(
                        post("/api/users/2/follow")
                )
                .andExpect(status().isBadRequest());
    }


    @Test
    void followUser_sameUser_returns400() throws Exception {

        whenFollowThrows(
                1L,
                1L,
                new IllegalArgumentException(
                        "User cannot follow themselves"
                )
        );

        mockMvc.perform(
                        post("/api/users/1/follow")
                                .header(
                                        "X-User-Id",
                                        "1"
                                )
                )
                .andExpect(status().isBadRequest())
                .andExpect(
                        jsonPath("$.error")
                                .value(
                                        "User cannot follow themselves"
                                )
                );
    }


    @Test
    void followUser_alreadyFollowing_returns409() throws Exception {

        whenFollowThrows(
                1L,
                2L,
                new IllegalStateException(
                        "User is already following this user"
                )
        );

        mockMvc.perform(
                        post("/api/users/2/follow")
                                .header(
                                        "X-User-Id",
                                        "1"
                                )
                )
                .andExpect(status().isConflict())
                .andExpect(
                        jsonPath("$.error")
                                .value(
                                        "User is already following this user"
                                )
                );
    }


    // =========================================================
    // DELETE /api/users/{id}/unfollow
    // =========================================================

    @Test
    void unfollowUser_validRequest_returns204() throws Exception {

        doNothing()
                .when(userService)
                .unfollowUser(1L, 2L);

        mockMvc.perform(
                        delete("/api/users/2/unfollow")
                                .header(
                                        "X-User-Id",
                                        "1"
                                )
                )
                .andExpect(status().isNoContent());

        verify(userService)
                .unfollowUser(1L, 2L);
    }


    @Test
    void unfollowUser_missingHeader_returns400() throws Exception {

        mockMvc.perform(
                        delete("/api/users/2/unfollow")
                )
                .andExpect(status().isBadRequest());
    }


    // =========================================================
    // GET /api/users/{id}/followers
    // =========================================================

    @Test
    void getFollowers_returns200AndFollowers() throws Exception {

        List<PublicUserResponse> followers =
                List.of(
                        new PublicUserResponse(
                                2L,
                                "user2",
                                "user2.jpg"
                        ),
                        new PublicUserResponse(
                                3L,
                                "user3",
                                "user3.jpg"
                        )
                );

        when(userService.getFollowers(1L))
                .thenReturn(followers);

        mockMvc.perform(
                        get("/api/users/1/followers")
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.length()")
                                .value(2)
                )
                .andExpect(
                        jsonPath("$[0].username")
                                .value("user2")
                )
                .andExpect(
                        jsonPath("$[1].username")
                                .value("user3")
                );
    }


    @Test
    void getFollowers_noFollowers_returnsEmptyList() throws Exception {

        when(userService.getFollowers(1L))
                .thenReturn(List.of());

        mockMvc.perform(
                        get("/api/users/1/followers")
                )
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }


    // =========================================================
    // GET /api/users/{id}/following
    // =========================================================

    @Test
    void getFollowing_returns200AndFollowingUsers()
            throws Exception {

        List<PublicUserResponse> following =
                List.of(
                        new PublicUserResponse(
                                2L,
                                "artist2",
                                "artist2.jpg"
                        )
                );

        when(userService.getFollowing(1L))
                .thenReturn(following);

        mockMvc.perform(
                        get("/api/users/1/following")
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.length()")
                                .value(1)
                )
                .andExpect(
                        jsonPath("$[0].username")
                                .value("artist2")
                );
    }


    @Test
    void getFollowing_noUsers_returnsEmptyList()
            throws Exception {

        when(userService.getFollowing(1L))
                .thenReturn(List.of());

        mockMvc.perform(
                        get("/api/users/1/following")
                )
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }


    /*
     * Helper method used by follow tests.
     */
    private void whenFollowThrows(
            Long loggedInUserId,
            Long targetUserId,
            RuntimeException exception) {

        org.mockito.Mockito
                .doThrow(exception)
                .when(userService)
                .followUser(
                        loggedInUserId,
                        targetUserId
                );
    }
}