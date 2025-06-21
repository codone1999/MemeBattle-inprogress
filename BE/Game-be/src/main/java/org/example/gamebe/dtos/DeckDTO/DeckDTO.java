package org.example.gamebe.dtos.DeckDTO;

import lombok.Data;
import org.example.gamebe.entities.Inventory;

import java.time.Instant;

@Data
public class DeckDTO {
    private Integer id;
    private String deckname;
    //private Inventory inventory;
    private Instant createOn;
    private Instant updateOn;
}
