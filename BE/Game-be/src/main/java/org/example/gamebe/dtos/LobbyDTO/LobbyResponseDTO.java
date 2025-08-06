package org.example.gamebe.dtos.LobbyDTO;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class LobbyResponseDTO {
    private Integer id;
    private String lobbyName;
    private Boolean isPrivate;
    private String status;

    private Integer player1Id;
    private Integer player2Id;
    private Integer player1DeckId;
    private Integer player2DeckId;
    private Integer player1CharacterId;
    private Integer player2CharacterId;
    private String mapName;
}
