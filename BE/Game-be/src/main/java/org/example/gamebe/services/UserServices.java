package org.example.gamebe.services;

import lombok.RequiredArgsConstructor;
import org.example.gamebe.dtos.*;
import org.example.gamebe.dtos.DeckDTO.DeckDTO;
import org.example.gamebe.dtos.UserDTO.UserDetailDto;
import org.example.gamebe.dtos.UserDTO.UserLoginResponseDTO;
import org.example.gamebe.dtos.UserDTO.UserRequestDto;
import org.example.gamebe.entities.*;
import org.example.gamebe.entities.Character;
import org.example.gamebe.repositories.*;
import org.example.gamebe.utils.ListMapper;
import org.example.gamebe.utils.UserUtil;
import org.modelmapper.ModelMapper;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserServices {
    private final UserRepositories userRepositories;

    private final ModelMapper modelMapper;

    private final UserUtil userUtil;
    private final ListMapper listMapper;
    private final InventoryRepositories inventoryRepositories;
    private final CardRepositories cardRepositories;
    private final deckRepositories deckRepositories;
    private final characterRepositories characterRepositories;
    private final characterInInventoryRepositories characterInInventoryRepositories;
    private final cardInInventoryRepositories cardInInventoryRepositories;

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public List<UserDetailDto> getAllUsers() {
        List<User> users = userRepositories.findAll();
        return listMapper.mapList(users, UserDetailDto.class,modelMapper);
    }

    public UserDetailDto createUser(UserRequestDto userRequestDto) {
        userUtil.validateAndSanitizeUserRequest(userRequestDto,userRepositories);

        User user = new User();
        user.setUsername(userRequestDto.getUsername());
        user.setPassword(passwordEncoder.encode(userRequestDto.getPassword()));
        user.setCoin(0);

        userRepositories.save(user);

        Inventory inventory = new Inventory();
        inventory.setUser(user);
        inventoryRepositories.save(inventory);

        user.setInventory(inventory);
        userRepositories.save(user);

        Optional<Character> character = characterRepositories.findById(111);
        if (character.isEmpty()) {
            throw new IllegalArgumentException("Default character not found");
        }

        CharacterInInventoryId characterInInventoryId = new CharacterInInventoryId();
        characterInInventoryId.setCharacterIdcharacter(111);
        characterInInventoryId.setInventoryIdinventory(inventory.getId());

        CharacterInInventory characterInInventory = new CharacterInInventory();
        characterInInventory.setId(characterInInventoryId);
        characterInInventory.setCharacterIdcharacter(character.get());
        characterInInventory.setInventoryIdinventory(inventory);
        characterInInventoryRepositories.save(characterInInventory);

        List<Card> defaultcards = cardRepositories.findByIdBetween(101,115);
        for (Card card : defaultcards) {
            CardInInventory cardInInventory =  new CardInInventory();
            CardInInventoryId cardInInventoryId = new CardInInventoryId();
            cardInInventoryId.setIdcard(card.getId());
            cardInInventoryId.setIdinventory(inventory.getId());

            cardInInventory.setId(cardInInventoryId);
            cardInInventory.setIdcard(card);
            cardInInventory.setIdinventory(inventory);

            cardInInventoryRepositories.save(cardInInventory);
        }

        return modelMapper.map(user, UserDetailDto.class);
    }

    public UserLoginResponseDTO loginUser(UserRequestDto userRequestDto) {
        userUtil.validateForLogin(userRequestDto);

        User user = userRepositories.findByUsername(userRequestDto.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!passwordEncoder.matches(userRequestDto.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid password");
        }

        Inventory inventory = (Inventory) inventoryRepositories.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException("Inventory not found"));

        List<CardInInventory> cardInInventories = cardInInventoryRepositories.findByIdinventory(inventory);
        List<Card> cards = cardInInventories.stream()
                .map(CardInInventory::getIdcard)
                .toList();

        List<CharacterInInventory> characterInInventories = characterInInventoryRepositories.findByInventoryIdinventory(inventory);
        List<Character> characters = characterInInventories.stream()
                .map(CharacterInInventory::getCharacterIdcharacter)
                .toList();

        List<Deck> decks = deckRepositories.findByInventory(inventory);
        UserLoginResponseDTO userLoginResponseDTO = modelMapper.map(user, UserLoginResponseDTO.class);
        userLoginResponseDTO.setCards(listMapper.mapList(cards, CardDto.class, modelMapper));
        userLoginResponseDTO.setCharacters(listMapper.mapList(characters, CharacterDTO.class, modelMapper));
        userLoginResponseDTO.setDeck(listMapper.mapList(decks, DeckDTO.class, modelMapper));

        return userLoginResponseDTO;
    }

}
