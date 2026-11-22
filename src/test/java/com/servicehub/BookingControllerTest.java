package com.servicehub;

import com.servicehub.controller.BookingController;
import com.servicehub.model.Booking;
import com.servicehub.dto.CreateBookingRequest;
import com.servicehub.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import com.servicehub.model.User;
import com.servicehub.model.Specialist;
import com.servicehub.repository.BookingRepository;
import com.servicehub.repository.SpecialistRepository;
import com.servicehub.repository.SpecialistDayOffRepository;
import com.servicehub.repository.UserRepository;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class BookingControllerTest {

    @Test
    void shouldRejectBookingWithoutAuthentication() {

        BookingController controller = new BookingController(
                mock(com.servicehub.repository.SpecialistDayOffRepository.class),
                mock(com.servicehub.repository.BookingRepository.class),
                mock(com.servicehub.repository.SpecialistRepository.class),
                mock(com.servicehub.repository.UserRepository.class),
                mock(NotificationRepository.class)
        );

        var response = controller.createBooking(new CreateBookingRequest(null, null, null, null), null);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("Please sign in to book.", response.getBody());
    }

    @Test
    void shouldRejectAlreadyBookedTime() {

        var dayOffRepository = mock(SpecialistDayOffRepository.class);
        var bookingRepository = mock(BookingRepository.class);
        var specialistRepository = mock(SpecialistRepository.class);
        var userRepository = mock(UserRepository.class);

        BookingController controller = new BookingController(
                dayOffRepository,
                bookingRepository,
                specialistRepository,
                userRepository,
                mock(NotificationRepository.class)
        );

        User user = mock(User.class);
        when(user.getId()).thenReturn(1L);
        when(user.getName()).thenReturn("Test Client");
        when(user.getEmail()).thenReturn("client@test.com");

        when(userRepository.findByEmail("client@test.com"))
                .thenReturn(Optional.of(user));

        Specialist specialist = mock(Specialist.class);
        when(specialist.getWorkStartHour()).thenReturn(8);
        when(specialist.getWorkEndHour()).thenReturn(17);

        when(specialistRepository.existsById(10L)).thenReturn(true);
        when(specialistRepository.lockForBooking(10L)).thenReturn(Optional.of(specialist));
        when(specialistRepository.findById(10L))
                .thenReturn(Optional.of(specialist));

        LocalDate date = LocalDate.now().plusDays(7);
        while (date.getDayOfWeek().getValue() > 5) {
            date = date.plusDays(1);
        }

        LocalTime time = LocalTime.of(10, 0);

        when(bookingRepository
                .existsBySpecialistIdAndBookingDateAndBookingTimeAndStatus(
                        10L, date, time, "CONFIRMED"
                )).thenReturn(true);

        Booking booking = new Booking();
        booking.setSpecialistId(10L);
        booking.setBookingDate(date);
        booking.setBookingTime(time);

        var authentication = new UsernamePasswordAuthenticationToken(
                "client@test.com",
                null,
                java.util.List.of(
                        new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                "ROLE_CLIENT"
                        )
                )
        );

        var response = controller.createBooking(new CreateBookingRequest(booking.getSpecialistId(), booking.getBookingDate(), booking.getBookingTime(), booking.getDescription()), authentication);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("This time slot is already booked.", response.getBody());

        verify(bookingRepository, never()).saveAndFlush(any(Booking.class));
    }

    @Test
    void shouldRejectBookingInThePast() {
        var dayOffRepository = mock(SpecialistDayOffRepository.class);
        var bookingRepository = mock(BookingRepository.class);
        var specialistRepository = mock(SpecialistRepository.class);
        var userRepository = mock(UserRepository.class);

        BookingController controller = new BookingController(
                dayOffRepository,
                bookingRepository,
                specialistRepository,
                userRepository,
                mock(NotificationRepository.class)
        );

        User user = mock(User.class);
        when(user.getId()).thenReturn(1L);
        when(user.getName()).thenReturn("Test Client");
        when(user.getEmail()).thenReturn("client@test.com");

        when(userRepository.findByEmail("client@test.com"))
                .thenReturn(Optional.of(user));

        when(specialistRepository.existsById(10L))
                .thenReturn(true);

        Booking booking = new Booking();
        booking.setSpecialistId(10L);
        booking.setBookingDate(LocalDate.now().minusDays(1));
        booking.setBookingTime(LocalTime.of(10, 0));

        var authentication = new UsernamePasswordAuthenticationToken(
                "client@test.com",
                null,
                java.util.List.of(
                        new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                "ROLE_CLIENT"
                        )
                )
        );

        var response = controller.createBooking(new CreateBookingRequest(booking.getSpecialistId(), booking.getBookingDate(), booking.getBookingTime(), booking.getDescription()), authentication);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Invalid booking date or time.", response.getBody());

        verify(bookingRepository, never()).saveAndFlush(any(Booking.class));
    }

    @Test
    void shouldRejectBookingOnSpecialistDayOff() {
        var dayOffRepository = mock(SpecialistDayOffRepository.class);
        var bookingRepository = mock(BookingRepository.class);
        var specialistRepository = mock(SpecialistRepository.class);
        var userRepository = mock(UserRepository.class);

        var controller = new BookingController(
                dayOffRepository,
                bookingRepository,
                specialistRepository,
                userRepository,
                mock(NotificationRepository.class)
        );

        User user = mock(User.class);
        when(user.getId()).thenReturn(1L);
        when(user.getName()).thenReturn("Test Client");
        when(user.getEmail()).thenReturn("client@test.com");

        when(userRepository.findByEmail("client@test.com"))
                .thenReturn(Optional.of(user));

        Specialist specialist = mock(Specialist.class);
        when(specialist.getWorkStartHour()).thenReturn(8);
        when(specialist.getWorkEndHour()).thenReturn(17);

        when(specialistRepository.existsById(10L)).thenReturn(true);
        when(specialistRepository.lockForBooking(10L)).thenReturn(Optional.of(specialist));
        when(specialistRepository.findById(10L))
                .thenReturn(Optional.of(specialist));

        LocalDate date = LocalDate.now().plusDays(7);
        while (date.getDayOfWeek().getValue() > 5) {
            date = date.plusDays(1);
        }

        when(dayOffRepository.existsBySpecialistIdAndDayOff(10L, date))
                .thenReturn(true);

        Booking booking = new Booking();
        booking.setSpecialistId(10L);
        booking.setBookingDate(date);
        booking.setBookingTime(LocalTime.of(10, 0));

        var authentication = new UsernamePasswordAuthenticationToken(
                "client@test.com",
                null,
                java.util.List.of(
                        new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                "ROLE_CLIENT"
                        )
                )
        );

        var response = controller.createBooking(new CreateBookingRequest(booking.getSpecialistId(), booking.getBookingDate(), booking.getBookingTime(), booking.getDescription()), authentication);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals(
                "The specialist is unavailable on this date.",
                response.getBody()
        );

        verify(bookingRepository, never()).saveAndFlush(any(Booking.class));
    }

    @Test
    void shouldRejectBookingOutsideWorkingHours() {
        var dayOffRepository = mock(SpecialistDayOffRepository.class);
        var bookingRepository = mock(BookingRepository.class);
        var specialistRepository = mock(SpecialistRepository.class);
        var userRepository = mock(UserRepository.class);

        var controller = new BookingController(
                dayOffRepository,
                bookingRepository,
                specialistRepository,
                userRepository,
                mock(NotificationRepository.class)
        );

        User user = mock(User.class);
        when(user.getId()).thenReturn(1L);
        when(user.getName()).thenReturn("Test Client");
        when(user.getEmail()).thenReturn("client@test.com");

        when(userRepository.findByEmail("client@test.com"))
                .thenReturn(Optional.of(user));

        Specialist specialist = mock(Specialist.class);
        when(specialist.getWorkStartHour()).thenReturn(8);
        when(specialist.getWorkEndHour()).thenReturn(17);

        when(specialistRepository.existsById(10L)).thenReturn(true);
        when(specialistRepository.lockForBooking(10L)).thenReturn(Optional.of(specialist));
        when(specialistRepository.findById(10L))
                .thenReturn(Optional.of(specialist));

        LocalDate date = LocalDate.now().plusDays(7);
        while (date.getDayOfWeek().getValue() > 5) {
            date = date.plusDays(1);
        }

        Booking booking = new Booking();
        booking.setSpecialistId(10L);
        booking.setBookingDate(date);
        booking.setBookingTime(LocalTime.of(19, 0));

        var authentication = new UsernamePasswordAuthenticationToken(
                "client@test.com",
                null,
                java.util.List.of(
                        new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                "ROLE_CLIENT"
                        )
                )
        );

        var response = controller.createBooking(new CreateBookingRequest(booking.getSpecialistId(), booking.getBookingDate(), booking.getBookingTime(), booking.getDescription()), authentication);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals(
                "Selected time is outside specialist working hours.",
                response.getBody()
        );

        verify(bookingRepository, never()).saveAndFlush(any(Booking.class));
    }

    @Test
    void shouldCreateValidBooking() {
        var dayOffRepository = mock(SpecialistDayOffRepository.class);
        var bookingRepository = mock(BookingRepository.class);
        var specialistRepository = mock(SpecialistRepository.class);
        var userRepository = mock(UserRepository.class);

        var controller = new BookingController(
                dayOffRepository,
                bookingRepository,
                specialistRepository,
                userRepository,
                mock(NotificationRepository.class)
        );

        User user = mock(User.class);
        when(user.getId()).thenReturn(1L);
        when(user.getName()).thenReturn("Test Client");
        when(user.getEmail()).thenReturn("client@test.com");

        when(userRepository.findByEmail("client@test.com"))
                .thenReturn(Optional.of(user));

        Specialist specialist = mock(Specialist.class);
        when(specialist.getWorkStartHour()).thenReturn(8);
        when(specialist.getWorkEndHour()).thenReturn(17);

        when(specialistRepository.existsById(10L)).thenReturn(true);
        when(specialistRepository.lockForBooking(10L)).thenReturn(Optional.of(specialist));
        when(specialistRepository.findById(10L))
                .thenReturn(Optional.of(specialist));

        LocalDate date = LocalDate.now().plusDays(7);
        while (date.getDayOfWeek().getValue() > 5) {
            date = date.plusDays(1);
        }

        Booking booking = new Booking();
        booking.setSpecialistId(10L);
        booking.setBookingDate(date);
        booking.setBookingTime(LocalTime.of(10, 0));

        when(bookingRepository.saveAndFlush(any(Booking.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var authentication = new UsernamePasswordAuthenticationToken(
                "client@test.com",
                null,
                java.util.List.of(
                        new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                "ROLE_CLIENT"
                        )
                )
        );

        var response = controller.createBooking(new CreateBookingRequest(booking.getSpecialistId(), booking.getBookingDate(), booking.getBookingTime(), booking.getDescription()), authentication);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        var savedBooking = (Booking) response.getBody();
        assertEquals("CONFIRMED", savedBooking.getStatus());
        assertEquals(1L, savedBooking.getUserId());
        assertEquals("Test Client", savedBooking.getCustomerName());

        verify(bookingRepository).saveAndFlush(any(Booking.class));
    }

    @Test
    void shouldNotCancelAnotherUsersBooking() {
        var dayOffRepository = mock(SpecialistDayOffRepository.class);
        var bookingRepository = mock(BookingRepository.class);
        var specialistRepository = mock(SpecialistRepository.class);
        var userRepository = mock(UserRepository.class);

        var controller = new BookingController(
                dayOffRepository,
                bookingRepository,
                specialistRepository,
                userRepository,
                mock(NotificationRepository.class)
        );

        User user = mock(User.class);
        when(user.getId()).thenReturn(1L);

        when(userRepository.findByEmail("client@test.com"))
                .thenReturn(Optional.of(user));

        Booking booking = mock(Booking.class);
        when(booking.getUserId()).thenReturn(2L);

        when(bookingRepository.findById(100L))
                .thenReturn(Optional.of(booking));

        var authentication = new UsernamePasswordAuthenticationToken(
                "client@test.com",
                null,
                java.util.List.of(
                        new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                "ROLE_CLIENT"
                        )
                )
        );

        var response = controller.cancelBooking(100L, authentication);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertEquals("You cannot cancel this booking.", response.getBody());

        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    void shouldCancelOwnBooking() {
        var dayOffRepository = mock(SpecialistDayOffRepository.class);
        var bookingRepository = mock(BookingRepository.class);
        var specialistRepository = mock(SpecialistRepository.class);
        var userRepository = mock(UserRepository.class);

        var controller = new BookingController(
                dayOffRepository,
                bookingRepository,
                specialistRepository,
                userRepository,
                mock(NotificationRepository.class)
        );

        User user = mock(User.class);
        when(user.getId()).thenReturn(1L);

        when(userRepository.findByEmail("client@test.com"))
                .thenReturn(Optional.of(user));

        Booking booking = new Booking();
        booking.setUserId(1L);
        booking.setStatus("CONFIRMED");

        when(bookingRepository.findById(100L))
                .thenReturn(Optional.of(booking));

        var authentication = new UsernamePasswordAuthenticationToken(
                "client@test.com",
                null,
                java.util.List.of(
                        new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                "ROLE_CLIENT"
                        )
                )
        );

        var response = controller.cancelBooking(100L, authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("CANCELLED", booking.getStatus());

        verify(bookingRepository).save(booking);
    }

    @Test
    void shouldNotCancelAlreadyCancelledBooking() {
        var bookingRepository = mock(BookingRepository.class);
        var userRepository = mock(UserRepository.class);

        var controller = new BookingController(
                mock(SpecialistDayOffRepository.class),
                bookingRepository,
                mock(SpecialistRepository.class),
                userRepository,
                mock(NotificationRepository.class)
        );

        User user = mock(User.class);
        when(user.getId()).thenReturn(1L);
        when(userRepository.findByEmail("client@test.com"))
                .thenReturn(Optional.of(user));

        Booking booking = new Booking();
        booking.setUserId(1L);
        booking.setStatus("CANCELLED");

        when(bookingRepository.findById(100L))
                .thenReturn(Optional.of(booking));

        var authentication = new UsernamePasswordAuthenticationToken(
                "client@test.com",
                null,
                java.util.List.of(
                        new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                "ROLE_CLIENT"
                        )
                )
        );

        var response = controller.cancelBooking(100L, authentication);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Booking is not confirmed.", response.getBody());

        verify(bookingRepository, never()).save(any(Booking.class));
    }
    @Test
    void shouldNotCancelNonexistentBooking() {
        var bookingRepository = mock(BookingRepository.class);
        var userRepository = mock(UserRepository.class);

        var controller = new BookingController(
                mock(SpecialistDayOffRepository.class),
                bookingRepository,
                mock(SpecialistRepository.class),
                userRepository,
                mock(NotificationRepository.class)
        );

        User user = mock(User.class);
        when(userRepository.findByEmail("client@test.com"))
                .thenReturn(Optional.of(user));

        when(bookingRepository.findById(999L))
                .thenReturn(Optional.empty());

        var authentication = new UsernamePasswordAuthenticationToken(
                "client@test.com",
                null,
                java.util.List.of(
                        new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                "ROLE_CLIENT"
                        )
                )
        );

        var response = controller.cancelBooking(999L, authentication);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Booking not found.", response.getBody());

        verify(bookingRepository, never()).save(any(Booking.class));
    }
}
