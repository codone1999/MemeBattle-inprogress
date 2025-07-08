package org.example.gamebe.dtos.DeckDTO;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Data
@Getter
@Setter
public class DeckCreateDTO {
    private Integer userid;
    private String deckName;
    private List<Integer> cardIds;
}
