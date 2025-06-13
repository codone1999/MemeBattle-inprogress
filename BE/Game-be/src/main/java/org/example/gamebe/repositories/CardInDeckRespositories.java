package org.example.gamebe.repositories;

import org.example.gamebe.entities.CardInDeck;
import org.example.gamebe.entities.CardInDeckId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CardInDeckRespositories extends JpaRepository<CardInDeck, CardInDeckId> {
}
