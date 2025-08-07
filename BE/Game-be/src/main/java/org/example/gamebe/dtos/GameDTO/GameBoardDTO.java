package org.example.gamebe.dtos.GameDTO;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Data
@Getter
@Setter
public class GameBoardDTO {
    private Integer lobbyId;
    private List<List<CellDTO>> board;
    private Integer currentTurn;
}
