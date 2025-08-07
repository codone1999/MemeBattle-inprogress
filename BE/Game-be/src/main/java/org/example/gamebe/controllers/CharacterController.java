package org.example.gamebe.controllers;

import lombok.RequiredArgsConstructor;
import org.example.gamebe.dtos.CharacterDTO;
import org.example.gamebe.dtos.DeckDTO.DeckResponseDto;
import org.example.gamebe.services.CharacterServices;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/character")
@RequiredArgsConstructor
public class CharacterController {
    private final CharacterServices characterServices;
    @GetMapping("/{id}")
    public ResponseEntity<?>  getCharacterById(@PathVariable Integer id) {
        try {
            CharacterDTO characterDTO = characterServices.getCharactersById(id);
            return ResponseEntity.ok(characterDTO);
        }catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
