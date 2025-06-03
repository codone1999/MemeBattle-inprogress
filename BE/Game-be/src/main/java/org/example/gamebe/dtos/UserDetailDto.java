package org.example.gamebe.dtos;

import lombok.Data;

import java.time.Instant;

@Data
public class UserDetailDto {
    private int id;
    private String username;
    private String password;
    private int coin;
    private Instant createOn;
    private Instant updateOn;

}
