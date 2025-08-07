package org.example.gamebe.services;

import lombok.RequiredArgsConstructor;
import org.example.gamebe.dtos.CharacterDTO;
import org.example.gamebe.entities.Character;
import org.example.gamebe.repositories.characterRepositories;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CharacterServices {
    private final characterRepositories characterRepositories;
    private final ModelMapper modelMapper;

    public CharacterDTO getCharactersById(Integer id) {
        Character character = characterRepositories.findById(id)
                .orElseThrow(() -> new RuntimeException("Character not found"));

        return modelMapper.map(character, CharacterDTO.class);
    }
}
