package org.example.gamebe.dtos.UserDTO;

import lombok.Data;
import org.example.gamebe.dtos.CardDto;
import org.example.gamebe.dtos.CharacterDTO;
import org.example.gamebe.dtos.DeckDTO.DeckDTO;

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
