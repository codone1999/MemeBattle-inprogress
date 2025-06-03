package org.example.gamebe.utils;

import org.modelmapper.ModelMapper;

import java.util.List;
import java.util.stream.Collectors;

public class ListMapper {
    private static ListMapper listMapper = new ListMapper();

    private ListMapper() {

    }
    public <S, T> List<T> mapList(List<S> source, Class<T> targetClass, ModelMapper modelMapper) {
        return source.stream().map(entity -> modelMapper.map(entity, targetClass)).collect(Collectors.toList());
    }

    public static ListMapper getInstance() {
        return listMapper;
    }
}
