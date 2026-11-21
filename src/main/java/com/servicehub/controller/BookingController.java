
package com.servicehub.controller;
import com.servicehub.model.Booking;
import com.servicehub.repository.BookingRepository;
import com.servicehub.repository.SpecialistRepository;
import com.servicehub.repository.SpecialistDayOffRepository;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import com.servicehub.model.User;
import com.servicehub.repository.UserRepository;
import org.springframework.security.core.Authentication;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/bookings")
public class BookingController {
    private final SpecialistDayOffRepository dayOffRepository;
    private final BookingRepository bookingRepository;
    private final SpecialistRepository specialistRepository;
    private final UserRepository userRepository;

    public BookingController(
            SpecialistDayOffRepository dayOffRepository,
            BookingRepository bookingRepository,
            SpecialistRepository specialistRepository,
            UserRepository userRepository
    ) {
        this.dayOffRepository = dayOffRepository;
        this.bookingRepository = bookingRepository;
        this.specialistRepository = specialistRepository;
        this.userRepository = userRepository;
    }



    @GetMapping("/availability")
    public List<String> getBookedTimes(
            @RequestParam Long specialistId,
            @RequestParam LocalDate date
    ) {
        return bookingRepository
                .findBySpecialistIdAndBookingDateAndStatus(
                        specialistId,
                        date,
                        "CONFIRMED"
                )
                .stream()
                .map(booking -> booking.getBookingTime().toString())
                .toList();
    }

    @GetMapping("/days-off")
    public List<LocalDate> getSpecialistDaysOff(
            @RequestParam Long specialistId
    ) {
        return dayOffRepository
                .findBySpecialistId(specialistId)
                .stream()
                .map(dayOff -> dayOff.getDayOff())
                .toList();
    }
    @PostMapping
    public ResponseEntity<?> createBooking(
            @RequestBody Booking booking,
            Authentication authentication
    ) {
        if (authentication == null ||
                !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Please sign in to book.");
        }

        User user = userRepository
                .findByEmail(authentication.getName())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("User not found.");
        }

        booking.setUserId(user.getId());
        booking.setCustomerName(user.getName());
        booking.setCustomerEmail(user.getEmail());

        if (booking.getSpecialistId() == null ||
                !specialistRepository.existsById(
                        booking.getSpecialistId())) {
            return ResponseEntity.badRequest()
                    .body("Invalid specialist.");
        }

        if (booking.getCustomerName() == null ||
                booking.getCustomerName().isBlank() ||
                booking.getCustomerEmail() == null ||
                booking.getCustomerEmail().isBlank()) {
            return ResponseEntity.badRequest()
                    .body("Name and email are required.");
        }

        LocalDate date = booking.getBookingDate();
        LocalTime time = booking.getBookingTime();

        if (date == null || time == null ||
                date.isBefore(LocalDate.now())) {
            return ResponseEntity.badRequest()
                    .body("Invalid booking date or time.");
        }
        if (date.equals(LocalDate.now()) &&
                !time.isAfter(LocalTime.now())) {
            return ResponseEntity.badRequest()
                    .body("Cannot book a time in the past.");
        }
        var specialist = specialistRepository
                .findById(booking.getSpecialistId())
                .orElse(null);

        if (specialist == null) {
            return ResponseEntity.badRequest()
                    .body("Invalid specialist.");
        }

        int startHour = specialist.getWorkStartHour();
        int endHour = specialist.getWorkEndHour();

        if (time.getHour() < startHour ||
                time.getHour() >= endHour ||
                time.getMinute() != 0 ||
                time.getSecond() != 0 ||
                time.getNano() != 0) {

            return ResponseEntity.badRequest()
                    .body("Selected time is outside specialist working hours.");
        }

        if (date.getDayOfWeek().getValue() > 5) {
            return ResponseEntity.badRequest()
                    .body("Bookings are available Monday to Friday.");
        }
        if (dayOffRepository.existsBySpecialistIdAndDayOff(
                booking.getSpecialistId(), date)) {

            return ResponseEntity.badRequest()
                    .body("The specialist is unavailable on this date.");
        }
        boolean alreadyBooked =
                bookingRepository
                        .existsBySpecialistIdAndBookingDateAndBookingTimeAndStatus(
                                booking.getSpecialistId(),
                                date,
                                time,
                                "CONFIRMED"
                        );

        if (alreadyBooked) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("This time slot is already booked.");
        }

        booking.setStatus("CONFIRMED");

        try {
            Booking saved = bookingRepository.saveAndFlush(booking);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(saved);

        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("This time slot is already booked.");
        }
    }


    @GetMapping("/my")
    public ResponseEntity<?> getMyBookings(
            Authentication authentication
    ) {
        if (authentication == null ||
                !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Please sign in.");
        }

        User user = userRepository
                .findByEmail(authentication.getName())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("User not found.");
        }

        List<Booking> bookings =
                bookingRepository.findByUserId(user.getId());

        return ResponseEntity.ok(bookings);
    }
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(
            @PathVariable Long id,
            Authentication authentication
    ) {
        if (authentication == null ||
                !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Please sign in.");
        }

        User user = userRepository
                .findByEmail(authentication.getName())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("User not found.");
        }

        Booking booking = bookingRepository.findById(id)
                .orElse(null);

        if (booking == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Booking not found.");
        }

        if (!user.getId().equals(booking.getUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("You cannot cancel this booking.");
        }

        if (!"CONFIRMED".equals(booking.getStatus())) {
            return ResponseEntity.badRequest()
                    .body("Booking is not confirmed.");
        }

        booking.setStatus("CANCELLED");
        bookingRepository.save(booking);

        return ResponseEntity.ok(booking);
    }
}
