package org.example.gamebe.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Getter
@Setter
@Entity
@Table(name = "character_in_inventory")
public class CharacterInInventory {
    @EmbeddedId
    private CharacterInInventoryId id;

    @MapsId("characterIdcharacter")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "character_idcharacter", nullable = false)
    private Character characterIdcharacter;

    @MapsId("inventoryIdinventory")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "inventory_idinventory", nullable = false)
    private Inventory inventoryIdinventory;

}