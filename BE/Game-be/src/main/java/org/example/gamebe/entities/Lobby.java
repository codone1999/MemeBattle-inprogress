package org.example.gamebe.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Getter
@Setter
@Entity
@Table(name = "lobby")
public class Lobby {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idlobby", nullable = false)
    private Integer id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "player1_uid", nullable = false)
    private User player1Uid;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.SET_NULL)
    @JoinColumn(name = "player2_uid")
    private User player2Uid;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "player1_deckid")
    private Deck player1Deckid;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.SET_NULL)
    @JoinColumn(name = "player2_deckid")
    private Deck player2Deckid;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "player1_characterid")
    private Character player1Characterid;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.SET_NULL)
    @JoinColumn(name = "player2_characterid")
    private Character player2Characterid;

    @Size(max = 45)
    @Column(name = "lobbycol", length = 45)
    private String lobbycol;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "map_idmap")
    private Map mapIdmap;

    @Size(max = 100)
    @NotNull
    @ColumnDefault("'New Lobby'")
    @Column(name = "lobby_name", nullable = false, length = 100)
    private String lobbyName;

    @Size(max = 100)
    @Column(name = "password", length = 100)
    private String password;

    @ColumnDefault("0")
    @Column(name = "is_private")
    private Boolean isPrivate;

    @ColumnDefault("'WAITING'")
    @Lob
    @Column(name = "status")
    private String status;

}