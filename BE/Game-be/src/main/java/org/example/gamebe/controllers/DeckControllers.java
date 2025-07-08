package org.example.gamebe.controllers;

import lombok.RequiredArgsConstructor;
import org.example.gamebe.dtos.DeckDTO.DeckCreateDTO;
import org.example.gamebe.dtos.DeckDTO.DeckDTO;
import org.example.gamebe.dtos.DeckDTO.DeckEditRequestDto;
import org.example.gamebe.dtos.DeckDTO.DeckResponseDto;
import org.example.gamebe.services.DeckSerivces;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/deck")
@RequiredArgsConstructor
public class DeckControllers {
    private final DeckSerivces deckSerivces;

    @GetMapping("")
    public ResponseEntity<List<DeckDTO>> getAllDeck() {
        return ResponseEntity.ok(deckSerivces.getAllDecks());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDeckById(@PathVariable Integer id) {
      try {
          DeckResponseDto deckResponseDto = deckSerivces.getCardsInDeck(id);
          return ResponseEntity.ok(deckResponseDto);
      }catch (IllegalArgumentException e) {
          return ResponseEntity.badRequest().body(e.getMessage());
      }
    }

    @PostMapping("/create")
    public ResponseEntity<?> createDeck(@RequestBody DeckCreateDTO dto) {
        try {
            DeckDTO deck = deckSerivces.createDeck(dto);
            return ResponseEntity.ok(deck);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/edit")
    public ResponseEntity<?> editDeck(@RequestBody DeckEditRequestDto dto) {
        try {
            DeckDTO deck = deckSerivces.editDeck(dto);
            return ResponseEntity.ok(deck);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }



}
