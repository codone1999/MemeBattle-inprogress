package org.example.gamebe.services;

import lombok.RequiredArgsConstructor;
import org.example.gamebe.entities.*;
import org.example.gamebe.dtos.LobbyDTO.CreateLobbyRequest;
import org.example.gamebe.dtos.LobbyDTO.JoinLobbyRequest;
import org.example.gamebe.dtos.LobbyDTO.LobbyResponseDTO;
import org.example.gamebe.entities.Character;
import org.example.gamebe.repositories.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LobbyService {
    private final LobbyRepository lobbyRepository;
    private final UserRepositories userRepository;
    private final deckRepositories deckRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final characterRepositories characterRepository;
    private final MapRepository mapRepository;


    public LobbyResponseDTO mapToResponse(Lobby lobby) {
        LobbyResponseDTO dto = new LobbyResponseDTO();
        dto.setId(lobby.getId());
        dto.setLobbyName(lobby.getLobbyName());
        dto.setIsPrivate(lobby.getIsPrivate());
        dto.setStatus(lobby.getStatus());

        if (lobby.getPlayer1Uid() != null) dto.setPlayer1Id(lobby.getPlayer1Uid().getId());
        if (lobby.getPlayer2Uid() != null) dto.setPlayer2Id(lobby.getPlayer2Uid().getId());

        if (lobby.getPlayer1Deckid() != null) dto.setPlayer1DeckName(lobby.getPlayer1Deckid().getDeckname());
        if (lobby.getPlayer2Deckid() != null) dto.setPlayer2DeckName(lobby.getPlayer2Deckid().getDeckname());

        if (lobby.getPlayer1Characterid() != null) dto.setPlayer1CharacterName(lobby.getPlayer1Characterid().getCharactername());
        if (lobby.getPlayer2Characterid() != null) dto.setPlayer2CharacterName(lobby.getPlayer2Characterid().getCharactername());

        if (lobby.getMapIdmap() != null) dto.setMapName(lobby.getMapIdmap().getName());

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
        messagingTemplate.convertAndSend("/topic/lobbies", getAllLobbies());

        return mapToResponse(savedLobby);
    }
   @Transactional
   public LobbyResponseDTO joinLobby(JoinLobbyRequest req) {
       Lobby lobby = lobbyRepository.findById(req.getLobbyId())
               .orElseThrow(() -> new RuntimeException("Lobby not found"));

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
       messagingTemplate.convertAndSend("/topic/lobbies", getAllLobbies());
       messagingTemplate.convertAndSend("/topic/lobby/" + req.getLobbyId(), mapToResponse(saved));
       return mapToResponse(saved);
   }

    @Transactional
    public void deleteLobby(Integer lobbyId) {
        lobbyRepository.deleteById(lobbyId);
        messagingTemplate.convertAndSend("/topic/lobbies", getAllLobbies());
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

    @Transactional
    public Lobby updateLobbySelections(Integer lobbyId, Integer userId, Integer deckId, Integer characterId) {
        Lobby lobby = lobbyRepository.findById(lobbyId)
                .orElseThrow(() -> new RuntimeException("Lobby not found"));

        if (lobby.getPlayer1Uid().getId().equals(userId)) {
            if (deckId != null) {
                Deck deck = deckRepository.findById(deckId)
                        .orElseThrow(() -> new RuntimeException("Deck not found"));
                lobby.setPlayer1Deckid(deck);
            }
            if (characterId != null) {
                Character character = characterRepository.findById(characterId)
                        .orElseThrow(() -> new RuntimeException("Character not found"));
                lobby.setPlayer1Characterid(character);
            }
        } else if (lobby.getPlayer2Uid() != null && lobby.getPlayer2Uid().getId().equals(userId)) {
            if (deckId != null) {
                Deck deck = deckRepository.findById(deckId)
                        .orElseThrow(() -> new RuntimeException("Deck not found"));
                lobby.setPlayer2Deckid(deck);
            }
            if (characterId != null) {
                Character character = characterRepository.findById(characterId)
                        .orElseThrow(() -> new RuntimeException("Character not found"));
                lobby.setPlayer2Characterid(character);
            }
        }

        Lobby saved = lobbyRepository.save(lobby);
        messagingTemplate.convertAndSend("/topic/lobby/" + lobbyId, mapToResponse(saved));
        return saved;
    }
    @Transactional
    public Lobby updateLobbyMap(Integer lobbyId, Integer userId, Integer mapId) {
        Lobby lobby = lobbyRepository.findById(lobbyId)
                .orElseThrow(() -> new RuntimeException("Lobby not found"));

        if (!lobby.getPlayer1Uid().getId().equals(userId)) {
            throw new RuntimeException("Only the host can change map");
        }

        Map map = mapRepository.findById(mapId)
                .orElseThrow(() -> new RuntimeException("Map not found"));

        lobby.setMapIdmap(map);
        return lobbyRepository.save(lobby);
    }


    @Transactional(readOnly = true)
    public LobbyResponseDTO getLobbyById(Integer id) {
        Lobby lobby = lobbyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lobby not found"));
        return mapToResponse(lobby);
    }
    @Transactional
    public void leaveLobby(Integer lobbyId, Integer userId) {
        Lobby lobby = lobbyRepository.findById(lobbyId)
                .orElseThrow(() -> new RuntimeException("Lobby not found"));
        // Player 1 leaves
        if (lobby.getPlayer1Uid() != null && lobby.getPlayer1Uid().getId().equals(userId)) {
            if (lobby.getPlayer2Uid() != null) {
                // Promote Player 2 to host
                lobby.setPlayer1Uid(lobby.getPlayer2Uid());
                lobby.setPlayer2Uid(null);
            } else {
                // No player2 → delete lobby
                lobbyRepository.delete(lobby);
                messagingTemplate.convertAndSend("/topic/lobbies", getAllLobbies());
                messagingTemplate.convertAndSend("/topic/lobby/" + getAllLobbies(), lobby);
                return;
            }
        }

        // Player 2 leaves
        if (lobby.getPlayer2Uid() != null && lobby.getPlayer2Uid().getId().equals(userId)) {
            lobby.setPlayer2Uid(null);
        }

        // If both left → delete
        if (lobby.getPlayer1Uid() == null && lobby.getPlayer2Uid() == null) {
            lobbyRepository.delete(lobby);
            messagingTemplate.convertAndSend("/topic/lobbies", getAllLobbies());
            messagingTemplate.convertAndSend("/topic/lobby/" + getAllLobbies());
            return;
        }

        Lobby saved = lobbyRepository.save(lobby);
        messagingTemplate.convertAndSend("/topic/lobbies", getAllLobbies());
        messagingTemplate.convertAndSend("/topic/lobby/" + lobbyId, mapToResponse(saved));
    }

    public void startGame(Integer lobbyId) {
        Lobby lobby = lobbyRepository.findById(lobbyId)
                .orElseThrow(() -> new RuntimeException("Lobby not found"));
        lobby.setStatus("STARTED");
        lobbyRepository.save(lobby);
    }



}
