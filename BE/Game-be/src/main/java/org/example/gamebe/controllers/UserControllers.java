package org.example.gamebe.controllers;


import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.example.gamebe.dtos.UserDetailDto;
import org.example.gamebe.dtos.UserDto;
import org.example.gamebe.dtos.UserLoginResponseDTO;
import org.example.gamebe.dtos.UserRequestDto;
import org.example.gamebe.services.UserServices;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@Component
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
