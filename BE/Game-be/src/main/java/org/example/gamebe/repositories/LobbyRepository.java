package org.example.gamebe.repositories;

import org.example.gamebe.entities.Lobby;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LobbyRepository extends JpaRepository<Lobby,Integer> {
    List<Lobby> findByStatus(String status);
}
