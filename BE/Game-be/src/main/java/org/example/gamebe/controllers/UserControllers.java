package org.example.gamebe.controllers;


import lombok.RequiredArgsConstructor;
import org.example.gamebe.dtos.UserDTO.UserDetailDto;
import org.example.gamebe.dtos.UserDTO.UserLoginResponseDTO;
import org.example.gamebe.dtos.UserDTO.UserRequestDto;
import org.example.gamebe.services.UserServices;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserControllers {

    private final UserServices userServices;

    @GetMapping("")
    public ResponseEntity<List<UserDetailDto>> getAllUsers() {
        return ResponseEntity.ok(userServices.getAllUsers());
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserRequestDto userRequestDto) {
        try {
            UserDetailDto userDetailDto = userServices.createUser(userRequestDto);
            return ResponseEntity.ok(userDetailDto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserRequestDto userRequestDto) {
        try {
            UserLoginResponseDTO userDto = userServices.loginUser(userRequestDto);
            return ResponseEntity.ok(userDto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

}
