package org.example.gamebe.dtos.LobbyDTO;

import lombok.Data;

@Data
public class JoinLobbyRequest {
    private Integer lobbyId;
    private Integer player2Uid;
    private String password;
}
