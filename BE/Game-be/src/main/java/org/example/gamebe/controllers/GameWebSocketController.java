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
        Map<String, Object> state = lobbyTossState.computeIfAbsent(lobbyId, k -> new HashMap<>());
        state.putAll(payload);

        @SuppressWarnings("unchecked")
        Map<String, String> choices = (Map<String, String>) state.get("choices");

        if (choices == null) {
            state.put("choices", payload.get("choices"));
            messagingTemplate.convertAndSend("/topic/coin-toss/" + lobbyId, state);
            return;
        }

        // Merge choices properly
        Map<String, String> newChoices = (Map<String, String>) payload.get("choices");
        if (newChoices != null) {
            choices.putAll(newChoices);
            state.put("choices", choices);
        }

        // Check if both players have picked
        if (choices.size() == 2) {
            // Randomize toss result
            String toss = Math.random() < 0.5 ? "head" : "tail";

            // Find which player picked the winning side
            Long starterPlayer = null;
            for (Map.Entry<String, String> entry : choices.entrySet()) {
                if (entry.getValue().equals(toss)) {
                    starterPlayer = Long.parseLong(entry.getKey());
                    break;
                }
            }

            state.put("tossResult", toss);
            state.put("starterPlayer", starterPlayer);

            // Broadcast final result
            messagingTemplate.convertAndSend("/topic/coin-toss/" + lobbyId, state);

            // Clear stored state for this lobby
            lobbyTossState.remove(lobbyId);
        } else {
            // Still waiting for the second player
            messagingTemplate.convertAndSend("/topic/coin-toss/" + lobbyId, state);
        }
    }
}
