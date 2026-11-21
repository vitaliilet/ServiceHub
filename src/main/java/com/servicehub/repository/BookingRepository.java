
package com.servicehub.repository;

import com.servicehub.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.time.LocalDate;
import java.time.LocalTime;

public interface BookingRepository
        extends JpaRepository<Booking, Long> {
    List<Booking> findBySpecialistIdAndBookingDate(
            Long specialistId,
            LocalDate bookingDate
    );
    List<Booking> findBySpecialistIdAndBookingDateAndStatus(
            Long specialistId,
            LocalDate bookingDate,
            String status
    );
    boolean existsBySpecialistIdAndBookingDateAndBookingTimeAndStatus(
            Long specialistId,
            LocalDate bookingDate,
            LocalTime bookingTime,
            String status
    );

    List<Booking> findByUserId(Long userId);
    List<Booking> findBySpecialistIdOrderByBookingDateAscBookingTimeAsc(
            Long specialistId
    );
}
