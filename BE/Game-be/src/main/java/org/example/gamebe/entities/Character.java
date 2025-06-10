package org.example.gamebe.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "`character`")
public class Character {
    @Id
    @Column(name = "idcharacter", nullable = false)
    private Integer id;

    @Size(max = 45)
    @NotNull
    @Column(name = "charactername", nullable = false, length = 45)
    private String charactername;

    @Size(max = 45)
    @Column(name = "themeColor", length = 45)
    private String themeColor;

    @Size(max = 45)
    @Column(name = "textColor", length = 45)
    private String textColor;

    @Size(max = 45)
    @Column(name = "shadow", length = 45)
    private String shadow;

    @Size(max = 45)
    @Column(name = "border", length = 45)
    private String border;

    @Size(max = 45)
    @Column(name = "skill", length = 45)
    private String skill;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idinventory", nullable = false)
    private Inventory inventory;

}