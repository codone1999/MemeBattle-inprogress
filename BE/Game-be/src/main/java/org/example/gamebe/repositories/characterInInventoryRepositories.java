package org.example.gamebe.repositories;

import org.example.gamebe.entities.CharacterInInventory;
import org.example.gamebe.entities.CharacterInInventoryId;
import org.example.gamebe.entities.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;


public interface characterInInventoryRepositories extends JpaRepository<CharacterInInventory, CharacterInInventoryId> {
    //List<CharacterInInventory> findByIdinventory(Inventory inventory);

    List<CharacterInInventory> findByInventoryIdinventory(Inventory inventory);
}
