package org.example.gamebe.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "card_in_inventory")
public class CardInInventory {
    @EmbeddedId
    private CardInInventoryId id;

    @MapsId("idcard")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idcard", nullable = false)
    private Card idcard;

    @MapsId("idinventory")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idinventory", nullable = false)
    private Inventory idinventory;

    @Column(name = "createOn")
    private Instant createOn;

    @Column(name = "updateOn")
    private Instant updateOn;

}