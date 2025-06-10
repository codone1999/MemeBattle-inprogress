package org.example.gamebe.dtos;

import lombok.Data;

@Data
public class CharacterDTO {
    private Integer id;
    private String charactername;
    private String themeColor;
    private String textColor;
    private String shadow;
    private String border;
    private String skill;
}
