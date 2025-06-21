package org.example.gamebe.repositories;

import org.example.gamebe.entities.Card;
import org.example.gamebe.entities.CardInDeck;
import org.example.gamebe.entities.CardInDeckId;
import org.example.gamebe.entities.Deck;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CardInDeckRespositories extends JpaRepository<CardInDeck, CardInDeckId> {
    List<CardInDeck> findCardInDeckByDeckIddeck(Deck deck);
}
