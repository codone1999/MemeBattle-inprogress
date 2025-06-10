package org.example.gamebe.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "card")
public class Card {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idcard", nullable = false)
    private Integer id;

    @Size(max = 45)
    @NotNull
    @Column(name = "cardName", nullable = false, length = 45)
    private String cardName;

    @Column(name = "Ability")
    private Boolean ability;

    @Size(max = 45)
    @Column(name = "abilityType", length = 45)
    private String abilityType;

    @Size(max = 200)
    @Column(name = "cardinfo", length = 200)
    private String cardinfo;

    @NotNull
    @Column(name = "Power", nullable = false)
    private Integer power;

    @NotNull
    @Column(name = "pawnsRequired", nullable = false)
    private Integer pawnsRequired;

    @Size(max = 50)
    @Column(name = "cardRarity", length = 50)
    private String cardRarity;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idinventory", nullable = false)
    private Inventory inventory;

}