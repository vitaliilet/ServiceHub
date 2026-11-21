package com.servicehub.repository;

import com.servicehub.model.SpecialistDayOff;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SpecialistDayOffRepository
        extends JpaRepository<SpecialistDayOff, Long> {

    List<SpecialistDayOff> findBySpecialistId(Long specialistId);

    boolean existsBySpecialistIdAndDayOff(
            Long specialistId,
            LocalDate dayOff
    );

    Optional<SpecialistDayOff> findByIdAndSpecialistId(
            Long id,
            Long specialistId
    );
}