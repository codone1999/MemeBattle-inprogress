package org.example.gamebe.controllers;

import lombok.RequiredArgsConstructor;
import org.example.gamebe.dtos.LobbyDTO.LobbySelectionUpdateDTO;
import org.example.gamebe.dtos.LobbyDTO.MapSelectionUpdateDTO;
import org.example.gamebe.entities.Lobby;
import org.example.gamebe.repositories.LobbyRepository;
import org.example.gamebe.services.LobbyService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;

@Controller
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class LobbyWSController {
    private final LobbyService lobbyService;
    private final SimpMessagingTemplate messagingTemplate;
    @MessageMapping("/lobby/updateSelection")
    public void updateSelection(LobbySelectionUpdateDTO update) {
        // Your service updates lobby entity with selection changes
        Lobby updatedLobby = lobbyService.updateLobbySelections(
                update.getLobbyId(),
                update.getUserId(),
                update.getDeckId(),
                update.getCharacterId()
        );

        // Notify all clients in the lobby
        messagingTemplate.convertAndSend("/topic/lobby/" + update.getLobbyId(), lobbyService.mapToResponse(updatedLobby));
    }

    @MessageMapping("/lobby/updateMap")
    public void updateMap(MapSelectionUpdateDTO update) {
        Lobby updatedLobby = lobbyService.updateLobbyMap(update.getLobbyId(), update.getMapId());
        messagingTemplate.convertAndSend("/topic/lobby/" + update.getLobbyId(), lobbyService.mapToResponse(updatedLobby));
    }
}
