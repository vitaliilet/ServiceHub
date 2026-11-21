package com.servicehub.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "specialist_days_off")
public class SpecialistDayOff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "specialist_id", nullable = false)
    private Long specialistId;

    @Column(name = "day_off", nullable = false)
    private LocalDate dayOff;

    public Long getId() {
        return id;
    }

    public Long getSpecialistId() {
        return specialistId;
    }

    public void setSpecialistId(Long specialistId) {
        this.specialistId = specialistId;
    }

    public LocalDate getDayOff() {
        return dayOff;
    }

    public void setDayOff(LocalDate dayOff) {
        this.dayOff = dayOff;
    }
}
