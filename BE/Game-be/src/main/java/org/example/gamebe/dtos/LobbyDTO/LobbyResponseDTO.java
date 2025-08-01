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
    private String player1DeckName;
    private String player2DeckName;
    private String player1CharacterName;
    private String player2CharacterName;
    private String mapName;
}
