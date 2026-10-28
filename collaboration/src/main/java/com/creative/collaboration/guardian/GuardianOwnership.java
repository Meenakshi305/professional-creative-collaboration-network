package com.creative.collaboration.guardian;
import com.creative.collaboration.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
@Component("guardianOwnership")
public class GuardianOwnership {
    private final UserRepository users;
    public GuardianOwnership(UserRepository users) { this.users = users; }
    public boolean owns(Long id, Authentication auth) {
        return auth != null && users.findByEmail(auth.getName()).filter(u -> u.getId().equals(id)).isPresent();
    }
}
