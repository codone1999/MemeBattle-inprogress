package org.example.gamebe.dtos.LobbyDTO;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class LobbyResponseDTO {
    private Integer id;
    private Integer player1Id;
    private Integer player2Id;
    private String lobbyName;
    private Boolean isPrivate;
    private String status;
}
