package org.example.gamebe.repositories;

import org.example.gamebe.entities.Spectator;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpectatorRepository extends JpaRepository<Spectator,Integer> {
    List<Spectator> findByLobby_Id(Integer lobbyId);
}
