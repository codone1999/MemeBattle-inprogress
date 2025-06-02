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
public class CardInInventoryId implements Serializable {
    private static final long serialVersionUID = -5404385155677596937L;
    @NotNull
    @Column(name = "idcard", nullable = false)
    private Integer idcard;

    @NotNull
    @Column(name = "idinventory", nullable = false)
    private Integer idinventory;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || Hibernate.getClass(this) != Hibernate.getClass(o)) return false;
        CardInInventoryId entity = (CardInInventoryId) o;
        return Objects.equals(this.idcard, entity.idcard) &&
                Objects.equals(this.idinventory, entity.idinventory);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idcard, idinventory);
    }

}