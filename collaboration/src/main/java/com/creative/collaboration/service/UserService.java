package com.creative.collaboration.service;

import com.creative.collaboration.dto.*;
import com.creative.collaboration.entity.User;
import com.creative.collaboration.exception.ResourceNotFoundException;
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
            UserRepository userRepository
    ) {
        this.userRepository = userRepository;
    }

   
}