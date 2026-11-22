package com.servicehub.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record CreateBookingRequest(
        Long specialistId,
        LocalDate bookingDate,
        LocalTime bookingTime,
        String description
) {}
