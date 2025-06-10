package org.example.gamebe.repositories;

import org.example.gamebe.entities.Deck;
import org.example.gamebe.entities.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface deckRepositories extends JpaRepository<Deck, Integer> {
    List<Deck> findByInventory(Inventory inventory);
}
