package org.example.gamebe.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.Hibernate;

import java.io.Serializable;
import java.util.Objects;

@Getter
@Setter
@Embeddable
public class CharacterInInventoryId implements Serializable {
    private static final long serialVersionUID = -6418600520516611964L;
    @NotNull
    @Column(name = "character_idcharacter", nullable = false)
    private Integer characterIdcharacter;

    @NotNull
    @Column(name = "inventory_idinventory", nullable = false)
    private Integer inventoryIdinventory;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || Hibernate.getClass(this) != Hibernate.getClass(o)) return false;
        CharacterInInventoryId entity = (CharacterInInventoryId) o;
        return Objects.equals(this.inventoryIdinventory, entity.inventoryIdinventory) &&
                Objects.equals(this.characterIdcharacter, entity.characterIdcharacter);
    }

    @Override
    public int hashCode() {
        return Objects.hash(inventoryIdinventory, characterIdcharacter);
    }

}