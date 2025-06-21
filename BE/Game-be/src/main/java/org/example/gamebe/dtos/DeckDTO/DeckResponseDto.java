package org.example.gamebe.dtos.DeckDTO;

import lombok.Data;
import org.example.gamebe.dtos.CardDto;

import java.util.List;

@Data
public class DeckResponseDto {
    private Integer id;
    private String deckname;
    private List<CardDto> cards;
}
