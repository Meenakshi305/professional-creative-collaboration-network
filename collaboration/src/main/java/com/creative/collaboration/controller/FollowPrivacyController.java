package com.creative.collaboration.controller;

import com.creative.collaboration.entity.User;
import com.creative.collaboration.entity.UserFollow;
import com.creative.collaboration.repository.UserFollowRepository;
import com.creative.collaboration.service.CurrentUserService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

/** Follow lists are scoped exclusively to the authenticated user from JWT. */
@RestController
@RequestMapping("/api/users")
public class FollowPrivacyController {
    private final UserFollowRepository repository;
    private final CurrentUserService currentUser;

    public FollowPrivacyController(UserFollowRepository repository,
                                   CurrentUserService currentUser) {
        this.repository = repository;
        this.currentUser = currentUser;
    }

    public record FollowPerson(Long userId, String fullName, String username,
                               String profileImageUrl) {
        public static FollowPerson from(User user) {
            // Existing User entity has no profileImageUrl field.
            // Frontend displays initials for missing photos.
            return new FollowPerson(user.getId(), user.getFullName(),
                    user.getUsername(), null);
        }
    }

    public record FollowRelationship(Long userId, boolean iFollow, boolean followsMe) {}

    @GetMapping("/me/followers")
    @Transactional(readOnly = true)
    public List<FollowPerson> myFollowers(Authentication authentication) {
        Long myId = currentUser.getCurrentUserId(authentication);
        return repository.findByFollowing_Id(myId).stream()
                .map(UserFollow::getFollower)
                .map(FollowPerson::from).toList();
    }

    @GetMapping("/me/following")
    @Transactional(readOnly = true)
    public List<FollowPerson> myFollowing(Authentication authentication) {
        Long myId = currentUser.getCurrentUserId(authentication);
        return repository.findByFollower_Id(myId).stream()
                .map(UserFollow::getFollowing)
                .map(FollowPerson::from).toList();
    }

    @GetMapping("/{id}/follow-relationship")
    @Transactional(readOnly = true)
    public FollowRelationship followRelationship(@PathVariable Long id,
                                                 Authentication authentication) {
        Long myId = currentUser.getCurrentUserId(authentication);
        return new FollowRelationship(
                id,
                repository.existsByFollower_IdAndFollowing_Id(myId, id),
                repository.existsByFollower_IdAndFollowing_Id(id, myId)
        );
    }
}
