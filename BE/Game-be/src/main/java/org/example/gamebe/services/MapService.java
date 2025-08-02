package org.example.gamebe.services;

import lombok.RequiredArgsConstructor;
import org.example.gamebe.dtos.MapDTO.MapResponseDTO;
import org.example.gamebe.dtos.UserDTO.UserDetailDto;
import org.example.gamebe.entities.Map;
import org.example.gamebe.repositories.MapRepository;
import org.example.gamebe.utils.ListMapper;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;


@Service
@RequiredArgsConstructor
public class MapService {
    private final MapRepository mapRepository;
    private final ModelMapper modelMapper;
    private final ListMapper listMapper;

    public List<MapResponseDTO> getAllMaps() {
        List<Map>  maps = mapRepository.findAll();
        return listMapper.mapList(maps, MapResponseDTO.class,modelMapper);
    }

}
