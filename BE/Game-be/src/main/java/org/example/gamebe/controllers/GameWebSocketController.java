package org.example.gamebe.controllers;

import lombok.RequiredArgsConstructor;
import org.example.gamebe.dtos.GameDTO.GameBoardDTO;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Controller
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class GameWebSocketController {
    private final SimpMessagingTemplate messagingTemplate;
    private final Map<Long, Map<String, Object>> lobbyTossState = new ConcurrentHashMap<>();

    @MessageMapping("/move")
    public void handleMove(GameBoardDTO boardDTO) {
        messagingTemplate.convertAndSend(
                "/topic/board-update/" + boardDTO.getLobbyId(),
                boardDTO
        );
    }


    @MessageMapping("/coin-toss/{lobbyId}")
    public void handleCoinToss(@DestinationVariable Long lobbyId, Map<String, Object> payload) {
        // Get or create the state for this lobby
        Map<String, Object> state = lobbyTossState.computeIfAbsent(lobbyId, k -> new HashMap<>());

        // Merge the incoming payload with the current state
        state.putAll(payload);

        // If the tossResult is present, the toss is complete.
        // We can broadcast and then clear the state.
        if (state.containsKey("tossResult")) {
            messagingTemplate.convertAndSend(
                    "/topic/coin-toss/" + lobbyId,
                    state
            );
            lobbyTossState.remove(lobbyId); // Clear the state after a successful toss
        } else {
            // Just a choice was made, broadcast the current state
            messagingTemplate.convertAndSend(
                    "/topic/coin-toss/" + lobbyId,
                    state
            );
        }
    }
}
