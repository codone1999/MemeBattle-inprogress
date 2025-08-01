package org.example.gamebe.controllers;

import lombok.RequiredArgsConstructor;
import org.example.gamebe.dtos.LobbyDTO.CreateLobbyRequest;
import org.example.gamebe.dtos.LobbyDTO.JoinLobbyRequest;
import org.example.gamebe.dtos.LobbyDTO.LobbyResponseDTO;
import org.example.gamebe.entities.Lobby;
import org.example.gamebe.services.LobbyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lobby")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class LobbyController {
    private final LobbyService lobbyService;

    @GetMapping("/{id}")
    public ResponseEntity<LobbyResponseDTO> getLobbyById(@PathVariable Integer id) {
        return ResponseEntity.ok(lobbyService.getLobbyById(id));
    }

    @PostMapping("/create")
    public ResponseEntity<LobbyResponseDTO> createLobby(@RequestBody CreateLobbyRequest dto) {
        return ResponseEntity.ok(lobbyService.createLobby(dto));
    }

    @GetMapping("/list")
    public List<LobbyResponseDTO> getAllLobbies() {
        return lobbyService.getAllLobbies();
    }

    @PostMapping("/join")
    public ResponseEntity<LobbyResponseDTO> joinLobby(@RequestBody JoinLobbyRequest req) {
        LobbyResponseDTO response = lobbyService.joinLobby(req);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/delete/{id}")
    public void deleteLobby(@PathVariable Integer id) {
        lobbyService.deleteLobby(id);
    }

    @PatchMapping("/update/{id}")
    public Lobby updateLobbySettings(@PathVariable Integer id,
                                     @RequestParam(required = false) Integer deckId,
                                     @RequestParam(required = false) Integer mapId) {
        return lobbyService.updateLobbySettings(id, deckId, mapId);
    }
    @PostMapping("/leave/{id}")
    public void leaveLobby(@PathVariable Integer id, @RequestParam Integer userId) {
        lobbyService.leaveLobby(id, userId);
    }
}
