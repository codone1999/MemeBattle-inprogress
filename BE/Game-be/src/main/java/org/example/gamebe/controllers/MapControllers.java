package org.example.gamebe.controllers;


import lombok.RequiredArgsConstructor;
import org.example.gamebe.dtos.MapDTO.MapResponseDTO;
import org.example.gamebe.services.MapService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/maps")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class MapControllers {

    private final MapService mapService;

    @GetMapping
    public List<MapResponseDTO> getAllMaps() {
        return mapService.getAllMaps();
    }
}
