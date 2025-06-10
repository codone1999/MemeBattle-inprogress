package org.example.gamebe.repositories;

import org.example.gamebe.entities.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InventoryRepositories extends JpaRepository<Inventory, Integer> {
    Optional<Inventory> findByUserId(Integer id);
}
