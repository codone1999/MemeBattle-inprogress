package org.example.gamebe.dtos.GameDTO;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Setter
@Getter
public class CellDTO {
    private Integer scoreP1;
    private Integer pawn1;
    private Integer pawn2;
    private Integer scoreP2;
    private Boolean isBlank;

}
