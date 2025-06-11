package org.example.gamebe.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "inventory")
public class Inventory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idinventory", nullable = false)
    private Integer id;
//
    //@NotNull
   //@ManyToOne(fetch = FetchType.LAZY, optional = false)
   //@JoinColumn(name = "uid", nullable = false)
   //private User uid;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uid", nullable = false)
    private User user;

    @OneToMany(mappedBy = "inventory", fetch = FetchType.LAZY)
    private List<Deck> decks;

    @OneToMany(mappedBy = "inventory", fetch = FetchType.LAZY)
    private List<Card> cards;

    @OneToMany(mappedBy = "inventory", fetch = FetchType.LAZY)
    private List<Character> characters;
}