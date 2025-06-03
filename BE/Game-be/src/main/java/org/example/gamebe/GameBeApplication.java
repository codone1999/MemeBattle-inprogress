package org.example.gamebe;

import org.example.gamebe.utils.ListMapper;
import org.modelmapper.ModelMapper;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class GameBeApplication {

    public static void main(String[] args) {
        SpringApplication.run(GameBeApplication.class, args);
    }

    @Bean
    public ModelMapper modelMapper() {
        return new ModelMapper();
    }

    @Bean
    public ListMapper listMapper() {
        return ListMapper.getInstance();
    }

}
