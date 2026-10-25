package com.creative.collaboration.service;

import com.creative.collaboration.entity.User;
import com.creative.collaboration.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class AdminIdentityService {
  private final UserRepository users;
  public AdminIdentityService(UserRepository users){this.users=users;}
  public User current(Authentication auth){
    if(auth == null || !auth.isAuthenticated())
      throw new ResponseStatusException(UNAUTHORIZED,"Authentication required");
    return users.findByEmail(auth.getName())
      .orElseThrow(()->new ResponseStatusException(UNAUTHORIZED,"User not found"));
  }
  public boolean isSuperAdmin(Authentication auth){
    return auth.getAuthorities().stream().anyMatch(a -> "ROLE_SUPER_ADMIN".equals(a.getAuthority()));
  }
}
