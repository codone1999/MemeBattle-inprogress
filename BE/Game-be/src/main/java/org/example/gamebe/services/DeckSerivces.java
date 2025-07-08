package org.example.gamebe.services;


import lombok.RequiredArgsConstructor;
import org.example.gamebe.dtos.CardDto;
import org.example.gamebe.dtos.DeckDTO.DeckCreateDTO;
import org.example.gamebe.dtos.DeckDTO.DeckDTO;
import org.example.gamebe.dtos.DeckDTO.DeckEditRequestDto;
import org.example.gamebe.dtos.DeckDTO.DeckResponseDto;
import org.example.gamebe.entities.*;
import org.example.gamebe.repositories.CardInDeckRespositories;
import org.example.gamebe.repositories.CardRepositories;
import org.example.gamebe.repositories.InventoryRepositories;
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
    private final InventoryRepositories inventoryRepositories;
    private final CardRepositories cardRepositories;

    public List<DeckDTO> getAllDecks() {
        List<Deck> decks = deckRepositories.findAll();
        return listMapper.mapList(decks, DeckDTO.class,modelMapper);
    }
    public DeckResponseDto getCardsInDeck(int id) {
        Deck deck = deckRepositories.findById(id).orElseThrow(
                () -> new IllegalArgumentException("Deck with id " + id + " does not exist"));
        List<CardInDeck> cardsInDeck = cardInDeckRespositories.findCardInDeckByDeckIddeck(deck);
        List<Card> cards = cardsInDeck.stream()
                .map(CardInDeck::getCardIdcard)
                .toList();
        DeckResponseDto deckResponseDto = modelMapper.map(deck, DeckResponseDto.class);
        deckResponseDto.setCards(listMapper.mapList(cards, CardDto.class,modelMapper));
        return deckResponseDto;
    }

    public DeckDTO createDeck(DeckCreateDTO dto) {
        Inventory inventory = inventoryRepositories.findByUserId(dto.getUserid())
                .orElseThrow(() -> new IllegalArgumentException("Inventory not found for user"));

        Deck deck = new Deck();
        deck.setDeckname(dto.getDeckName());
        deck.setInventory(inventory);
        Deck savedDeck = deckRepositories.save(deck);

        // Link cards to the new deck
        List<CardInDeck> cardLinks = new ArrayList<>();
        for (Integer cardId : dto.getCardIds()) {
            Card card = cardRepositories.findById(cardId)
                    .orElseThrow(() -> new IllegalArgumentException("Card ID not found: " + cardId));

            CardInDeck link = new CardInDeck();
            CardInDeckId linkId = new CardInDeckId();
            linkId.setDeckIddeck(savedDeck.getId());
            linkId.setCardIdcard(cardId);
            link.setId(linkId);
            link.setDeckIddeck(savedDeck);
            link.setCardIdcard(card);

            cardLinks.add(link);
        }
        cardInDeckRespositories.saveAll(cardLinks);

        return modelMapper.map(savedDeck, DeckDTO.class);
    }

    public DeckDTO editDeck(DeckEditRequestDto dto) {
        Deck deck = deckRepositories.findById(dto.getDeckid())
                .orElseThrow(() -> new IllegalArgumentException("Deck not found"));

        deck.setDeckname(dto.getDeckname());
        deckRepositories.save(deck);

        // Delete old links and add new ones
        cardInDeckRespositories.deleteAll(cardInDeckRespositories.findCardInDeckByDeckIddeck(deck));

        List<CardInDeck> updatedLinks = new ArrayList<>();
        for (Integer cardId : dto.getCardIds()) {
            Card card = cardRepositories.findById(cardId)
                    .orElseThrow(() -> new IllegalArgumentException("Card ID not found: " + cardId));

            CardInDeck link = new CardInDeck();
            CardInDeckId linkId = new CardInDeckId();
            linkId.setDeckIddeck(deck.getId());
            linkId.setCardIdcard(cardId);
            link.setId(linkId);
            link.setDeckIddeck(deck);
            link.setCardIdcard(card);

            updatedLinks.add(link);
        }
        cardInDeckRespositories.saveAll(updatedLinks);

        return modelMapper.map(deck, DeckDTO.class);
    }
}
