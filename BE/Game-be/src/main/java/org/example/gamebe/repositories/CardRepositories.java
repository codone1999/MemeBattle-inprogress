package org.example.gamebe.repositories;

import org.example.gamebe.entities.Card;
import org.example.gamebe.entities.Character;
import org.example.gamebe.entities.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

public interface CardRepositories extends JpaRepository<Card, Integer> {
  List<Card> findByInventory(Inventory inventory);

  List<Card> findByIdBetween(Integer idAfter, Integer idBefore);
}