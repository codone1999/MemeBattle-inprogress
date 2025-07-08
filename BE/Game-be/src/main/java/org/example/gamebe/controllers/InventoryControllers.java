package org.example.gamebe.controllers;

import lombok.RequiredArgsConstructor;
import org.example.gamebe.dtos.UserDTO.UserLoginResponseDTO;
import org.example.gamebe.services.UserServices;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryControllers {
    private final UserServices userServices;

    @GetMapping("/{userId}")
    public ResponseEntity<UserLoginResponseDTO> getUserInventoryById(@PathVariable int userId) {
        UserLoginResponseDTO dto = userServices.getUserInventoryById(userId);
        return ResponseEntity.ok(dto);
    }

}
