package org.example.gamebe.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Getter
@Setter
@Entity
@Table(name = "card_in_deck")
public class CardInDeck {
    @EmbeddedId
    private CardInDeckId id;

    @MapsId("deckIddeck")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "deck_iddeck", nullable = false)
    private Deck deckIddeck;

    @MapsId("cardIdcard")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "card_idcard", nullable = false)
    private Card cardIdcard;

}