package org.example.gamebe.repositories;

import org.example.gamebe.entities.CharacterInInventory;
import org.example.gamebe.entities.CharacterInInventoryId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


public interface characterInInventoryRepositories extends JpaRepository<CharacterInInventory, CharacterInInventoryId> {
}
