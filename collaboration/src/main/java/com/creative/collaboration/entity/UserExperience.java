package com.creative.collaboration.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;


@Entity
@Table(name = "user_experiences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserExperience {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "user_id",
            nullable = false
    )
    private User user;


    @Column(
            nullable = false,
            length = 150
    )
    private String jobTitle;


    @Column(
            nullable = false,
            length = 150
    )
    private String organisation;


    @Column(nullable = false)
    private LocalDate startDate;


    private LocalDate endDate;


    @Column(nullable = false)
    private boolean currentRole;


    @Column(length = 1500)
    private String description;
}