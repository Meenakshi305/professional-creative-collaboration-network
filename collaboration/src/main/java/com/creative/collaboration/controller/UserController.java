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


}