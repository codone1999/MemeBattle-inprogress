package org.example.gamebe.controllers;

import lombok.RequiredArgsConstructor;
import org.example.gamebe.dtos.GameDTO.GameBoardDTO;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class GameWebSocketController {
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/move")
    public void handleMove(GameBoardDTO boardDTO) {
        messagingTemplate.convertAndSend(
                "/topic/board-update/" + boardDTO.getLobbyId(),
                boardDTO
        );
    }
}
