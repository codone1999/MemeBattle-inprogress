package org.example.gamebe.dtos;

import lombok.Data;
import org.example.gamebe.entities.Character;

import java.time.Instant;
import java.util.List;

@Data
public class UserLoginResponseDTO {
    private int id;
    private String username;
    private int coin;
    private List<CardDto> cards;
    private List<CharacterDTO> characters;
    private List<DeckDTO> deck;
}
