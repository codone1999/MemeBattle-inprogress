package org.example.gamebe.services;


import lombok.RequiredArgsConstructor;
import org.example.gamebe.repositories.InventoryRepositories;
import org.example.gamebe.repositories.UserRepositories;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class InventorySerivces {
    private final InventoryRepositories inventoryRepositories;

    
}
