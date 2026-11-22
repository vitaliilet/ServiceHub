package com.servicehub.repository;

import com.servicehub.model.Specialist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SpecialistRepository extends JpaRepository<Specialist, Long> {

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select s from Specialist s where s.id = :id")
    Optional<Specialist> lockForBooking(@org.springframework.data.repository.query.Param("id") Long id);

    Optional<Specialist> findByUserId(Long userId);

}