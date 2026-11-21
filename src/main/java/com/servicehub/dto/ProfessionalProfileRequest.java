package com.servicehub.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Max;
public record ProfessionalProfileRequest(

        @NotBlank
        String name,

        @NotBlank
        String city,

        @NotBlank
        String service,

        @NotNull
        @Min(0)
        Integer price,

        @NotNull
        @Min(0)
        Integer experience,

        @Size(max = 2000)
        String description,

        @Min(0)
        @Max(23)
        Integer workStartHour,

        @Min(1)
        @Max(24)
        Integer workEndHour
) {}