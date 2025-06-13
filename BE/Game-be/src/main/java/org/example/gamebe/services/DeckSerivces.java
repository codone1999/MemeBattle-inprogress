package org.example.gamebe.services;


import lombok.RequiredArgsConstructor;
import org.example.gamebe.dtos.DeckDTO.DeckDTO;
import org.example.gamebe.entities.Deck;
import org.example.gamebe.repositories.CardInDeckRespositories;
import org.example.gamebe.repositories.deckRepositories;
import org.example.gamebe.utils.ListMapper;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;


@Service
@RequiredArgsConstructor
public class DeckSerivces {
    private final deckRepositories deckRepositories;
    private final CardInDeckRespositories cardInDeckRespositories;
    private final ModelMapper modelMapper;
    private final ListMapper listMapper;

    public List<DeckDTO> getAllDecks() {
        List<Deck> decks = deckRepositories.findAll();
        return listMapper.mapList(decks, DeckDTO.class,modelMapper);
    }


    
}
