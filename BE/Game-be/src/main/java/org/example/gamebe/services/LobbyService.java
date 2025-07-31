package org.example.gamebe.services;

import lombok.RequiredArgsConstructor;
import org.example.gamebe.dtos.LobbyDTO.CreateLobbyRequest;
import org.example.gamebe.dtos.LobbyDTO.JoinLobbyRequest;
import org.example.gamebe.dtos.LobbyDTO.LobbyResponseDTO;
import org.example.gamebe.entities.Lobby;
import org.example.gamebe.entities.User;
import org.example.gamebe.repositories.LobbyRepository;
import org.example.gamebe.repositories.UserRepositories;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LobbyService {
    private final LobbyRepository lobbyRepository;
    private final UserRepositories userRepository;

    private LobbyResponseDTO mapToResponse(Lobby lobby) {
        LobbyResponseDTO dto = new LobbyResponseDTO();
        dto.setId(lobby.getId());
        dto.setLobbyName(lobby.getLobbyName());
        dto.setIsPrivate(lobby.getIsPrivate());
        dto.setStatus(lobby.getStatus());

        if (lobby.getPlayer1Uid() != null) {
            dto.setPlayer1Id(lobby.getPlayer1Uid().getId());
        }
        if (lobby.getPlayer2Uid() != null) {
            dto.setPlayer2Id(lobby.getPlayer2Uid().getId());
        }
        return dto;
    }

    public List<LobbyResponseDTO> getAllLobbies() {
        return lobbyRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public LobbyResponseDTO createLobby(CreateLobbyRequest req) {
        Lobby lobby = new Lobby();
        User player1 = userRepository.findById(req.getPlayer1Uid())
                .orElseThrow(() -> new RuntimeException("User not found"));

        lobby.setPlayer1Uid(player1);
        lobby.setLobbyName(req.getLobbyName());
        lobby.setPassword(req.getPassword());
        lobby.setIsPrivate(req.getIsPrivate() != null ? req.getIsPrivate() : false);
        lobby.setStatus("WAITING");
        Lobby savedLobby = lobbyRepository.save(lobby);

        return mapToResponse(savedLobby);
    }

   // public List<Lobby> getAllLobbies() {
   //     return lobbyRepository.findAll();
   // }
//
   @Transactional
   public LobbyResponseDTO joinLobby(JoinLobbyRequest req) {
       Lobby lobby = lobbyRepository.findById(req.getLobbyId())
               .orElseThrow(() -> new RuntimeException("Lobby not found"));

       // ✅ Check if private and verify password
       if (Boolean.TRUE.equals(lobby.getIsPrivate())) {
           if (lobby.getPassword() == null || !lobby.getPassword().equals(req.getPassword())) {
               throw new RuntimeException("Invalid password for private lobby");
           }
       }

       if (lobby.getPlayer2Uid() != null) {
           throw new RuntimeException("Lobby is already full");
       }

       User player2 = userRepository.findById(req.getPlayer2Uid())
               .orElseThrow(() -> new RuntimeException("User not found"));

       lobby.setPlayer2Uid(player2);

       Lobby saved = lobbyRepository.save(lobby);
       return mapToResponse(saved);
   }

    @Transactional
    public void deleteLobby(Integer lobbyId) {
        lobbyRepository.deleteById(lobbyId);
    }

    @Transactional
    public Lobby updateLobbySettings(Integer lobbyId, Integer deckId, Integer mapId) {
        Lobby lobby = lobbyRepository.findById(lobbyId)
                .orElseThrow(() -> new RuntimeException("Lobby not found"));
        // set deck/map later when ready
        if (deckId != null) {
            // assign deck to player1 or player2 depending on who called
        }
        return lobbyRepository.save(lobby);
    }
}
