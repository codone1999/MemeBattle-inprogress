package org.example.gamebe.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "deck")
public class Deck {
    @Id
    @Column(name = "iddeck", nullable = false)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idinventory", nullable = false)
    private Inventory inventory;

    @Size(max = 45)
    @NotNull
    @Column(name = "deckname", nullable = false, length = 45)
    private String deckname;

    @Column(name = "createOn")
    @CreationTimestamp
    private Instant createOn;

    @Column(name = "updateOn")
    @UpdateTimestamp
    private Instant updateOn;

}