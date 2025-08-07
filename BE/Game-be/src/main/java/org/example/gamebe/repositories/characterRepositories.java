package org.example.gamebe.repositories;

import org.example.gamebe.entities.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.example.gamebe.entities.Character;
import org.springframework.stereotype.Repository;

import java.util.List;

public interface characterRepositories extends JpaRepository<Character, Integer> {
    List<Character> findByInventory(Inventory inventory);

    List<java.lang.Character> findCharacterById(Integer id);
}
