package org.example.gamebe.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.example.gamebe.dtos.LobbyDTO.LobbyResponseDTO;
import org.example.gamebe.dtos.LobbyDTO.LobbySelectionUpdateDTO;
import org.example.gamebe.dtos.LobbyDTO.MapSelectionUpdateDTO;
import org.example.gamebe.entities.Lobby;
import org.example.gamebe.services.LobbyService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class LobbyWSController {
    private final LobbyService lobbyService;
    private final SimpMessagingTemplate messagingTemplate;
    @MessageMapping("/lobby/updateSelection")
    public void updateSelection(LobbySelectionUpdateDTO update) {
        Lobby updatedLobby = lobbyService.updateLobbySelections(
                update.getLobbyId(),
                update.getUserId(),
                update.getDeckId(),
                update.getCharacterId()
        );

        LobbyResponseDTO dto = lobbyService.mapToResponse(updatedLobby);

        Map<String, Object> payload = new HashMap<>();
        payload.put("id", dto.getId());
        payload.put("lobbyName", dto.getLobbyName());
        payload.put("status", dto.getStatus());
        payload.put("player1Id", dto.getPlayer1Id());
        payload.put("player2Id", dto.getPlayer2Id());
        payload.put("player1DeckName", dto.getPlayer1DeckName());
        payload.put("player2DeckName", dto.getPlayer2DeckName());
        payload.put("player1CharacterName", dto.getPlayer1CharacterName());
        payload.put("player2CharacterName", dto.getPlayer2CharacterName());
        payload.put("mapName", dto.getMapName());

        // Include ready flag
        if (update.getReady() != null) {
            payload.put("ready", update.getReady());
        }

        messagingTemplate.convertAndSend("/topic/lobby/" + update.getLobbyId(), payload);
    }

    @MessageMapping("/lobby/updateMap")
    public void updateMap(MapSelectionUpdateDTO update) {
        Lobby updatedLobby = lobbyService.updateLobbyMap(update.getLobbyId(), update.getUserId(), update.getMapId());
        messagingTemplate.convertAndSend("/topic/lobby/" + update.getLobbyId(), lobbyService.mapToResponse(updatedLobby));
    }

}
