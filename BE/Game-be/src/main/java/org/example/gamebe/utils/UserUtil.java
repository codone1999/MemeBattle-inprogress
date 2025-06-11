package org.example.gamebe.utils;

import org.springframework.stereotype.Component;
import org.example.gamebe.repositories.UserRepositories;
import org.example.gamebe.dtos.UserDTO.UserRequestDto;

@Component
public class UserUtil {
    public void validateAndSanitizeUserRequest(UserRequestDto userRequestDto,
                                               UserRepositories userRepositories) {
        if(userRequestDto ==null || userRequestDto.getUsername() == null || userRequestDto.getPassword() == null){
            throw new IllegalArgumentException("UserRequestDto is null or empty");
        }
        String username = userRequestDto.getUsername().trim();
        String password = userRequestDto.getPassword().trim();

        if (username.isEmpty() || password.isEmpty()){
            throw new IllegalArgumentException("UserRequestDto cannot be blank");
        }
        if (userRepositories.existsByUsername(username)){
            throw new IllegalArgumentException("Username is already in use");
        }

        userRequestDto.setUsername(username);
        userRequestDto.setPassword(password);
    }

    public void validateForLogin(UserRequestDto userRequestDto) {
        if (userRequestDto == null || userRequestDto.getUsername() == null || userRequestDto.getPassword() == null) {
            throw new IllegalArgumentException("UserRequestDto is null or empty");
        }

        String username = userRequestDto.getUsername().trim();
        String password = userRequestDto.getPassword().trim();

        if (username.isEmpty() || password.isEmpty()) {
            throw new IllegalArgumentException("Username or password cannot be blank");
        }

        userRequestDto.setUsername(username);
        userRequestDto.setPassword(password);
    }
}
