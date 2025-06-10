package org.example.gamebe.dtos;

import lombok.Data;

import java.time.Instant;

@Data
public class DeckDTO {
    private Integer id;
    private String deckname;
    private Instant createOn;
    private Instant updateOn;
}
