package org.example.gamebe.dtos.LobbyDTO;

import lombok.Data;

@Data
public class LobbySelectionUpdateDTO {
    private Integer lobbyId;
    private Integer userId;
    private Integer deckId;
    private Integer characterId;

    private Boolean ready;
}
