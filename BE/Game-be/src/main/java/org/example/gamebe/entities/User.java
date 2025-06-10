package org.example.gamebe.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "uid", nullable = false)
    private Integer id;

    @Size(max = 144)
    @NotNull
    @Column(name = "username", nullable = false, length = 144)
    private String username;

    @Size(max = 144)
    @NotNull
    @Column(name = "password", nullable = false, length = 144)
    private String password;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "coin", nullable = false)
    private Integer coin;

    @Size(max = 45)
    @Column(name = "userscol", length = 45)
    private String userscol;

    @Column(name = "createOn")
    @CreationTimestamp
    private Instant createOn;

    @Column(name = "updateOn")
    @UpdateTimestamp
    private Instant updateOn;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Inventory inventory;

}