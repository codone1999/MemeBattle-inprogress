package org.example.gamebe.services;

import lombok.RequiredArgsConstructor;
import org.example.gamebe.dtos.UserDetailDto;
import org.example.gamebe.dtos.UserDto;
import org.example.gamebe.dtos.UserRequestDto;
import org.example.gamebe.entities.User;
import org.example.gamebe.repositories.UserRepositories;
import org.example.gamebe.utils.ListMapper;
import org.example.gamebe.utils.UserUtil;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServices {
    private final UserRepositories userRepositories;

    private final ModelMapper modelMapper;

    private final UserUtil userUtil;
    private final ListMapper listMapper;

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public List<UserDetailDto> getAllUsers() {
        List<User> users = userRepositories.findAll();
        return listMapper.mapList(users, UserDetailDto.class,modelMapper);
    }

    public UserDetailDto createUser(UserRequestDto userRequestDto) {
        userUtil.validateAndSanitizeUserRequest(userRequestDto,userRepositories);

        User user = new User();
        user.setUsername(userRequestDto.getUsername());
        user.setPassword(passwordEncoder.encode(userRequestDto.getPassword()));
        user.setCoin(0);

        userRepositories.save(user);
        return modelMapper.map(user, UserDetailDto.class);
    }

    public UserDetailDto loginUser(UserRequestDto userRequestDto) {
        userUtil.validateForLogin(userRequestDto);

        User user = userRepositories.findByUsername(userRequestDto.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if(!passwordEncoder.matches(userRequestDto.getPassword(),user.getPassword())){
            throw new IllegalArgumentException("Invalid password");
        }
        return modelMapper.map(user, UserDetailDto.class);
    }

}
