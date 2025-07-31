package org.example.gamebe.repositories;

import org.example.gamebe.entities.Map;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MapRepository extends JpaRepository<Map,Integer> {
}
