
package com.servicehub;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.junit.jupiter.api.BeforeEach;
import java.util.concurrent.*;
import java.sql.Date;
import java.sql.Time;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class BookingDatabaseIntegrationTest {

    @Autowired
    private JdbcTemplate jdbc;

    private final long specialistId = 987654321L;
    private final LocalDate date = LocalDate.of(2030, 6, 10);
    private final LocalTime time = LocalTime.of(10, 0);
    @BeforeEach
    void cleanTestBookings() {
        jdbc.update(
                "DELETE FROM booking WHERE specialist_id = ?",
                specialistId
        );
    }
    private void insertBooking(String status) {
        jdbc.update("""
            INSERT INTO booking
                (specialist_id, booking_date, booking_time, status)
            VALUES (?, ?, ?, ?)
            """,
                specialistId,
                Date.valueOf(date),
                Time.valueOf(time),
                status
        );
    }

    @Test
    void shouldRejectDuplicateConfirmedBooking() {
        insertBooking("CONFIRMED");

        assertThrows(
                DataIntegrityViolationException.class,
                () -> insertBooking("CONFIRMED")
        );
    }

    @Test
    void shouldAllowBookingAfterCancellation() {
        insertBooking("CANCELLED");
        insertBooking("CONFIRMED");

        Integer count = jdbc.queryForObject("""
            SELECT COUNT(*)
            FROM booking
            WHERE specialist_id = ?
              AND booking_date = ?
              AND booking_time = ?
              AND status = 'CONFIRMED'
            """,
                Integer.class,
                specialistId,
                Date.valueOf(date),
                Time.valueOf(time)
        );

        assertEquals(1, count);
    }

    @Test
    void shouldAllowOnlyOneConcurrentBooking() throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);

        Callable<Boolean> attempt = () -> {
            start.await(5, TimeUnit.SECONDS);

            try {
                insertBooking("CONFIRMED");
                return true;
            } catch (DataIntegrityViolationException e) {
                return false;
            }
        };

        try {
            Future<Boolean> first = executor.submit(attempt);
            Future<Boolean> second = executor.submit(attempt);

            start.countDown();

            boolean firstSuccess = first.get(10, TimeUnit.SECONDS);
            boolean secondSuccess = second.get(10, TimeUnit.SECONDS);

            assertNotEquals(firstSuccess, secondSuccess);

            Integer count = jdbc.queryForObject("""
            SELECT COUNT(*)
            FROM booking
            WHERE specialist_id = ?
              AND booking_date = ?
              AND booking_time = ?
              AND status = 'CONFIRMED'
            """,
                    Integer.class,
                    specialistId,
                    Date.valueOf(date),
                    Time.valueOf(time)
            );

            assertEquals(1, count);
        } finally {
            executor.shutdownNow();
        }
    }

}

