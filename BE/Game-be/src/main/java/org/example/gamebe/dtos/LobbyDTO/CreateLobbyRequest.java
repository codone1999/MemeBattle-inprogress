package org.example.gamebe.dtos.LobbyDTO;

import lombok.Data;

@Data
public class CreateLobbyRequest {
    private String lobbyName;
    private String password;
    private Boolean isPrivate;
    private Integer player1Uid;
}
