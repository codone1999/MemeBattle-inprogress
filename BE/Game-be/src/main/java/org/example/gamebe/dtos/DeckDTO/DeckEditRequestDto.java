package org.example.gamebe.dtos.DeckDTO;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Data
@Setter
@Getter
public class DeckEditRequestDto {
    private Integer deckid;
    private String deckname;
    private List<Integer> cardIds;
}
