package org.example.gamebe.controllers;

import lombok.RequiredArgsConstructor;
import org.example.gamebe.dtos.DeckDTO.DeckDTO;
import org.example.gamebe.services.DeckSerivces;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
