package org.example.gamebe.repositories;

import org.example.gamebe.entities.CardInInventory;
import org.example.gamebe.entities.CardInInventoryId;
import org.example.gamebe.entities.CharacterInInventoryId;
import org.example.gamebe.entities.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface cardInInventoryRepositories extends JpaRepository<CardInInventory, CardInInventoryId> {
    //List<CardInInventory> findCardInInventoriesById(CardInInventoryId id);

    List<CardInInventory> findByIdinventory(Inventory inventory);
}
