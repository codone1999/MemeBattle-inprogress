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
public class CardInDeckId implements Serializable {
    private static final long serialVersionUID = -4125447813509151335L;
    @NotNull
    @Column(name = "deck_iddeck", nullable = false)
    private Integer deckIddeck;

    @NotNull
    @Column(name = "card_idcard", nullable = false)
    private Integer cardIdcard;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || Hibernate.getClass(this) != Hibernate.getClass(o)) return false;
        CardInDeckId entity = (CardInDeckId) o;
        return Objects.equals(this.cardIdcard, entity.cardIdcard) &&
                Objects.equals(this.deckIddeck, entity.deckIddeck);
    }

    @Override
    public int hashCode() {
        return Objects.hash(cardIdcard, deckIddeck);
    }

}