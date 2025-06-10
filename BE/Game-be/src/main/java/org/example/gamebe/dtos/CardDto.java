package org.example.gamebe.dtos;

import lombok.Data;

@Data
public class CardDto {
    private int id;
    private String cardName;
    private Boolean ability;
    private String abilityType;
    private String cardinfo;
    private Integer power;
    private Integer pawnsRequired;
    private String cardType;
}
