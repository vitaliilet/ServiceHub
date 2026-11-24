
package com.servicehub;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import org.junit.jupiter.api.Test;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import org.springframework.test.web.servlet.MockMvc;
import com.servicehub.model.User;
import com.servicehub.model.Booking;
import com.servicehub.repository.BookingRepository;
import com.servicehub.model.Specialist;
import com.servicehub.repository.UserRepository;
import com.servicehub.repository.SpecialistRepository;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
class BookingHttpIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void createBooking_withoutAuthentication_returns401()
            throws Exception {

        String requestBody = """
                {
                    "specialistId": 1,
                    "bookingDate": "2026-12-01",
                    "bookingTime": "10:00",
                    "description": "Test booking"
                }
                """;

        mockMvc.perform(post("/bookings")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isUnauthorized());

    }

    @Test
    @Transactional
    void createBooking_authenticatedUser_returns201()
            throws Exception {

        // 1. Створюємо тестового користувача
        User testUser = new User(
                "Test Client",
                "booking-http-test@example.com",
                "test-password"
        );

        testUser = userRepository.saveAndFlush(testUser);

        // 2. Створюємо спеціаліста
        Specialist specialist = new Specialist(
                "Test Electrician",
                "Drohobych",
                "Electrician",
                500
        );

        specialist.setWorkStartHour(8);
        specialist.setWorkEndHour(17);

        specialist = specialistRepository.saveAndFlush(specialist);

        // 3. Вибираємо майбутній робочий день
        LocalDate bookingDate = LocalDate.now().plusDays(1);

        while (bookingDate.getDayOfWeek().getValue() > 5) {
            bookingDate = bookingDate.plusDays(1);
        }

        // 4. Формуємо JSON
        String requestBody = """
            {
                "specialistId": %d,
                "bookingDate": "%s",
                "bookingTime": "10:00",
                "description": "HTTP integration test"
            }
            """.formatted(specialist.getId(), bookingDate);

        // 5. Надсилаємо HTTP-запит
        mockMvc.perform(post("/bookings")
                        .with(user(testUser.getEmail())
                                .roles("CLIENT"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated());
    }

    @Test
    @Transactional
    void createBooking_alreadyBooked_returns409()
            throws Exception {

        User testUser = userRepository.saveAndFlush(
                new User(
                        "Conflict Test Client",
                        "booking-conflict-test@example.com",
                        "test-password"
                )
        );

        Specialist specialist = specialistRepository.saveAndFlush(
                new Specialist(
                        "Conflict Test Specialist",
                        "Drohobych",
                        "Electrician",
                        500
                )
        );

        LocalDate bookingDate = LocalDate.now().plusDays(1);

        while (bookingDate.getDayOfWeek().getValue() > 5) {
            bookingDate = bookingDate.plusDays(1);
        }

        String requestBody = """
            {
                "specialistId": %d,
                "bookingDate": "%s",
                "bookingTime": "10:00",
                "description": "Conflict test"
            }
            """.formatted(specialist.getId(), bookingDate);

        // Перше бронювання має пройти успішно
        mockMvc.perform(post("/bookings")
                        .with(user(testUser.getEmail()).roles("CLIENT"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated());

        // Повторне бронювання того самого часу має повернути 409
        mockMvc.perform(post("/bookings")
                        .with(user(testUser.getEmail()).roles("CLIENT"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isConflict());
    }

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private BookingRepository bookingRepository;
    @Autowired
    private SpecialistRepository specialistRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Test
    @Transactional
    void createBooking_outsideWorkingHours_returns400()
            throws Exception {

        User testUser = userRepository.saveAndFlush(
                new User(
                        "Working Hours Test",
                        "booking-hours-test@example.com",
                        "test-password"
                )
        );

        Specialist specialist = new Specialist(
                "Test Electrician",
                "Drohobych",
                "Electrician",
                500
        );

        specialist.setWorkStartHour(8);
        specialist.setWorkEndHour(17);

        specialist = specialistRepository.saveAndFlush(specialist);

        LocalDate bookingDate = LocalDate.now().plusDays(1);

        while (bookingDate.getDayOfWeek().getValue() > 5) {
            bookingDate = bookingDate.plusDays(1);
        }

        String requestBody = """
            {
                "specialistId": %d,
                "bookingDate": "%s",
                "bookingTime": "20:00",
                "description": "Outside working hours test"
            }
            """.formatted(specialist.getId(), bookingDate);

        mockMvc.perform(post("/bookings")
                        .with(user(testUser.getEmail()).roles("CLIENT"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Transactional
    void cancelBooking_owner_returns200() throws Exception {

        User testUser = userRepository.saveAndFlush(
                new User(
                        "Cancel Test Client",
                        "booking-cancel-test@example.com",
                        "test-password"
                )
        );

        Specialist specialist = specialistRepository.saveAndFlush(
                new Specialist(
                        "Cancel Test Specialist",
                        "Drohobych",
                        "Electrician",
                        500
                )
        );

        LocalDate bookingDate = LocalDate.now().plusDays(1);

        while (bookingDate.getDayOfWeek().getValue() > 5) {
            bookingDate = bookingDate.plusDays(1);
        }

        Booking booking = new Booking();
        booking.setUserId(testUser.getId());
        booking.setSpecialistId(specialist.getId());
        booking.setBookingDate(bookingDate);
        booking.setBookingTime(java.time.LocalTime.of(10, 0));
        booking.setCustomerName(testUser.getName());
        booking.setCustomerEmail(testUser.getEmail());
        booking.setStatus("CONFIRMED");

        booking = bookingRepository.saveAndFlush(booking);

        mockMvc.perform(patch("/bookings/{id}/cancel", booking.getId())
                        .with(user(testUser.getEmail()).roles("CLIENT"))
                        .with(csrf()))
                .andExpect(status().isOk());

        org.junit.jupiter.api.Assertions.assertEquals(
                "CANCELLED",
                bookingRepository.findById(booking.getId())
                        .orElseThrow()
                        .getStatus()
        );
    }

    @Test
    @Transactional
    void cancelBooking_notOwner_returns403() throws Exception {

        User owner = userRepository.saveAndFlush(
                new User(
                        "Booking Owner",
                        "booking-owner-test@example.com",
                        "test-password"
                )
        );

        User otherUser = userRepository.saveAndFlush(
                new User(
                        "Other Client",
                        "booking-other-test@example.com",
                        "test-password"
                )
        );

        Specialist specialist = specialistRepository.saveAndFlush(
                new Specialist(
                        "Test Specialist",
                        "Drohobych",
                        "Electrician",
                        500
                )
        );

        LocalDate bookingDate = LocalDate.now().plusDays(1);

        while (bookingDate.getDayOfWeek().getValue() > 5) {
            bookingDate = bookingDate.plusDays(1);
        }

        Booking booking = new Booking();
        booking.setUserId(owner.getId());
        booking.setSpecialistId(specialist.getId());
        booking.setBookingDate(bookingDate);
        booking.setBookingTime(java.time.LocalTime.of(10, 0));
        booking.setCustomerName(owner.getName());
        booking.setCustomerEmail(owner.getEmail());
        booking.setStatus("CONFIRMED");

        booking = bookingRepository.saveAndFlush(booking);

        // Інший користувач намагається скасувати чуже бронювання
        mockMvc.perform(patch("/bookings/{id}/cancel", booking.getId())
                        .with(user(otherUser.getEmail()).roles("CLIENT"))
                        .with(csrf()))
                .andExpect(status().isForbidden());

        // Перевіряємо, що бронювання залишилося активним
        org.junit.jupiter.api.Assertions.assertEquals(
                "CONFIRMED",
                bookingRepository.findById(booking.getId())
                        .orElseThrow()
                        .getStatus()
        );
    }

    @Test
    @Transactional
    void changedUserRole_invalidatesOldSession() throws Exception {

        User testUser = new User(
                "Role Change Test",
                "role-change-test@example.com",
                "test-password"
        );
        testUser.setRole("ADMIN");
        testUser = userRepository.saveAndFlush(testUser);

        var session = new org.springframework.mock.web.MockHttpSession();

        mockMvc.perform(get("/auth/me")
                        .session(session)
                        .with(user(testUser.getEmail()).roles("ADMIN")))
                .andExpect(status().isOk());

        testUser.setRole("CLIENT");
        userRepository.saveAndFlush(testUser);

        mockMvc.perform(get("/admin/test")
                        .session(session)
                        .with(user(testUser.getEmail()).roles("ADMIN")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void realLogin_roleChanged_oldSessionReturns401() throws Exception {

        // 1. Створюємо користувача з роллю ADMIN
        User testUser = new User(
                "Session Test Admin",
                "session-role-test@example.com",
                passwordEncoder.encode("TestPassword123!")
        );

        testUser.setRole("ADMIN");
        testUser = userRepository.saveAndFlush(testUser);

        Long userId = testUser.getId();

        try {
            // 2. Виконуємо справжній вхід через /auth/login
            String loginBody = """
                {
                    "email": "session-role-test@example.com",
                    "password": "TestPassword123!"
                }
                """;

            var loginResult = mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(loginBody))
                    .andExpect(status().isOk())
                    .andReturn();

            // 3. Отримуємо сесію, створену під час входу
            MockHttpSession session =
                    (MockHttpSession) loginResult.getRequest().getSession(false);

            org.junit.jupiter.api.Assertions.assertNotNull(session);

            // 4. Перевіряємо, що авторизована сесія працює
            mockMvc.perform(get("/auth/me").session(session))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.role").value("ADMIN"));

            // 5. Змінюємо роль у PostgreSQL
            testUser.setRole("CLIENT");
            userRepository.saveAndFlush(testUser);

            // 6. Стара сесія повинна втратити доступ
            mockMvc.perform(get("/auth/me").session(session))
                    .andExpect(status().isUnauthorized());

        } finally {
            // 7. Видаляємо тестового користувача
            userRepository.deleteById(userId);
        }
    }

    @Test
    void realLogin_blockedUser_oldSessionReturns403() throws Exception {

        User testUser = new User(
                "Blocked Session Test",
                "blocked-session-test@example.com",
                passwordEncoder.encode("TestPassword123!")
        );

        testUser.setRole("CLIENT");
        testUser = userRepository.saveAndFlush(testUser);

        Long userId = testUser.getId();

        try {
            String loginBody = """
                {
                    "email": "blocked-session-test@example.com",
                    "password": "TestPassword123!"
                }
                """;

            var loginResult = mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(loginBody))
                    .andExpect(status().isOk())
                    .andReturn();

            MockHttpSession session =
                    (MockHttpSession) loginResult.getRequest().getSession(false);

            org.junit.jupiter.api.Assertions.assertNotNull(session);

            // Перевіряємо активну сесію
            mockMvc.perform(get("/auth/me").session(session))
                    .andExpect(status().isOk());

            // Блокуємо користувача
            testUser.setBlocked(true);
            userRepository.saveAndFlush(testUser);

            // Стара сесія повинна отримати 403
            mockMvc.perform(get("/auth/me").session(session))
                    .andExpect(status().isForbidden());

        } finally {
            userRepository.deleteById(userId);
        }
    }

    @Test
    void realLogin_deletedUser_oldSessionReturns401() throws Exception {

        User testUser = new User(
                "Deleted Session Test",
                "deleted-session-test@example.com",
                passwordEncoder.encode("TestPassword123!")
        );

        testUser.setRole("CLIENT");
        testUser = userRepository.saveAndFlush(testUser);

        Long userId = testUser.getId();

        try {
            String loginBody = """
                {
                    "email": "deleted-session-test@example.com",
                    "password": "TestPassword123!"
                }
                """;

            var loginResult = mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(loginBody))
                    .andExpect(status().isOk())
                    .andReturn();

            MockHttpSession session =
                    (MockHttpSession) loginResult.getRequest().getSession(false);

            org.junit.jupiter.api.Assertions.assertNotNull(session);

            // Перевіряємо, що сесія працює
            mockMvc.perform(get("/auth/me").session(session))
                    .andExpect(status().isOk());

            // Видаляємо користувача з бази
            userRepository.deleteById(userId);
            userRepository.flush();

            // Стара сесія повинна отримати 401
            mockMvc.perform(get("/auth/me").session(session))
                    .andExpect(status().isUnauthorized());

        } finally {
            if (userRepository.existsById(userId)) {
                userRepository.deleteById(userId);
            }
        }
    }

    @Test
    void realLogin_logout_invalidatesSession() throws Exception {

        User testUser = new User(
                "Logout Session Test",
                "logout-session-test@example.com",
                passwordEncoder.encode("TestPassword123!")
        );

        testUser.setRole("CLIENT");
        testUser = userRepository.saveAndFlush(testUser);

        Long userId = testUser.getId();

        try {
            String loginBody = """
                {
                    "email": "logout-session-test@example.com",
                    "password": "TestPassword123!"
                }
                """;

            var loginResult = mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(loginBody))
                    .andExpect(status().isOk())
                    .andReturn();

            MockHttpSession session =
                    (MockHttpSession) loginResult.getRequest().getSession(false);

            org.junit.jupiter.api.Assertions.assertNotNull(session);

            // Перевіряємо, що користувач авторизований
            mockMvc.perform(get("/auth/me").session(session))
                    .andExpect(status().isOk());

            // Виходимо із системи
            mockMvc.perform(post("/auth/logout")
                            .session(session)
                            .with(csrf()))
                    .andExpect(status().isOk());

            // Перевіряємо, що сесія анульована
            org.junit.jupiter.api.Assertions.assertTrue(
                    session.isInvalid()
            );

            // Запит без авторизації повинен повернути 401
            mockMvc.perform(get("/auth/me"))
                    .andExpect(status().isUnauthorized());

        } finally {
            userRepository.deleteById(userId);
        }
    }

}

