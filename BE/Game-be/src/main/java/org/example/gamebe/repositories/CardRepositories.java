package org.example.gamebe.repositories;

import org.example.gamebe.entities.Card;
import org.example.gamebe.entities.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CardRepositories extends JpaRepository<Card, Integer> {
  List<Card> findByInventory(Inventory inventory);
}