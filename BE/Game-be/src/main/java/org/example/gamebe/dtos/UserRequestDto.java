package org.example.gamebe.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UserRequestDto {
    private String username;

    private String password;
}
