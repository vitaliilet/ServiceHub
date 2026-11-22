package com.servicehub.controller;
import com.servicehub.model.User;
import com.servicehub.repository.BookingRepository;
import com.servicehub.model.Specialist;
import com.servicehub.model.Booking;
import com.servicehub.model.SpecialistDayOff;
import java.time.LocalDate;
import com.servicehub.repository.SpecialistDayOffRepository;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import com.servicehub.dto.ProfessionalProfileRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import java.util.Map;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.servicehub.repository.UserRepository;
import com.servicehub.repository.SpecialistRepository;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
@RestController
@RequestMapping("/professionals")
public class ProfessionalController {
    private final com.servicehub.repository.NotificationRepository notificationRepository;
    private final SpecialistDayOffRepository dayOffRepository;
    private final UserRepository userRepository;
    private final SpecialistRepository specialistRepository;
    private final BookingRepository bookingRepository;

    public ProfessionalController(
            UserRepository userRepository,
            SpecialistRepository specialistRepository,
            BookingRepository bookingRepository,
            SpecialistDayOffRepository dayOffRepository,
            com.servicehub.repository.NotificationRepository notificationRepository) {

        this.userRepository = userRepository;
        this.specialistRepository = specialistRepository;
        this.bookingRepository = bookingRepository;
        this.dayOffRepository = dayOffRepository;
        this.notificationRepository = notificationRepository;
    }
    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Not authenticated"));
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User not found"));
        }

        if (!"PROFESSIONAL".equals(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Professional access required"));
        }


        return specialistRepository.findByUserId(user.getId())
                .<ResponseEntity<?>>map(specialist -> {
                    Map<String, Object> profile = new java.util.HashMap<>();

                    profile.put("id", specialist.getId());
                    profile.put("name", specialist.getName());
                    profile.put("city", specialist.getCity());
                    profile.put("service", specialist.getService());
                    profile.put("price", specialist.getPrice());
                    profile.put("experience", specialist.getExperience());
                    profile.put("description", specialist.getDescription());
                    profile.put("imageUrl", specialist.getImageUrl());
                    profile.put("workStartHour", specialist.getWorkStartHour());
                    profile.put("workEndHour", specialist.getWorkEndHour());
                    return ResponseEntity.ok(profile);
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Professional profile not created yet")));

    }
    @PostMapping("/me")
    public ResponseEntity<?> createMyProfile(
            Authentication authentication,
            @Valid @RequestBody ProfessionalProfileRequest request) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Not authenticated"));
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User not found"));
        }

        if (!"PROFESSIONAL".equals(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Professional access required"));
        }

        if (specialistRepository.findByUserId(user.getId()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Professional profile already exists"));
        }

        Specialist specialist = new Specialist();
        specialist.setUser(user);
        specialist.setName(request.name());
        specialist.setCity(request.city());
        specialist.setService(request.service());
        specialist.setPrice(request.price());
        specialist.setExperience(request.experience());
        specialist.setDescription(request.description());
        if (request.workStartHour() != null ||
                request.workEndHour() != null) {

            int start = request.workStartHour() != null
                    ? request.workStartHour()
                    : specialist.getWorkStartHour();

            int end = request.workEndHour() != null
                    ? request.workEndHour()
                    : specialist.getWorkEndHour();

            if (start >= end) {
                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "message",
                                "Work end hour must be later than start hour"
                        ));
            }

            specialist.setWorkStartHour(start);
            specialist.setWorkEndHour(end);
        }
        Specialist saved = specialistRepository.save(specialist);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "message", "Professional profile created",
                        "id", saved.getId()
                ));
    }
    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(
            Authentication authentication,
            @Valid @RequestBody ProfessionalProfileRequest request) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Not authenticated"));
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User not found"));
        }

        if (!"PROFESSIONAL".equals(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Professional access required"));
        }

        Specialist specialist = specialistRepository
                .findByUserId(user.getId())
                .orElse(null);

        if (specialist == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Professional profile not found"));
        }

        specialist.setName(request.name());
        specialist.setCity(request.city());
        specialist.setService(request.service());
        specialist.setPrice(request.price());
        specialist.setExperience(request.experience());
        specialist.setDescription(request.description());

        if (request.workStartHour() != null ||
                request.workEndHour() != null) {

            int start = request.workStartHour() != null
                    ? request.workStartHour()
                    : specialist.getWorkStartHour();

            int end = request.workEndHour() != null
                    ? request.workEndHour()
                    : specialist.getWorkEndHour();

            if (start < 0 || start > 23 ||
                    end < 1 || end > 24 ||
                    start >= end) {
                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "message",
                                "Invalid working hours"
                        ));
            }

            specialist.setWorkStartHour(start);
            specialist.setWorkEndHour(end);
        }

        specialistRepository.save(specialist);

        return ResponseEntity.ok(
                Map.of("message", "Profile updated successfully")
        );
    }
    @GetMapping("/bookings")
    public ResponseEntity<?> getMyBookings(Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Not authenticated"));
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User not found"));
        }

        if (!"PROFESSIONAL".equals(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Professional access required"));
        }

        Specialist specialist = specialistRepository
                .findByUserId(user.getId())
                .orElse(null);

        if (specialist == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Professional profile not found"));
        }

        return ResponseEntity.ok(
                bookingRepository.findBySpecialistIdOrderByBookingDateAscBookingTimeAsc(
                        specialist.getId()
                )
        );
    }
    @PatchMapping("/bookings/{id}/cancel")
    public ResponseEntity<?> cancelProfessionalBooking(
            @PathVariable Long id,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Not authenticated"));
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User not found"));
        }

        if (!"PROFESSIONAL".equals(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Professional access required"));
        }

        Specialist specialist = specialistRepository
                .findByUserId(user.getId())
                .orElse(null);

        if (specialist == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Professional profile not found"));
        }

        Booking booking = bookingRepository.findById(id)
                .orElse(null);

        if (booking == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Booking not found"));
        }

        if (!specialist.getId().equals(booking.getSpecialistId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "You cannot cancel this booking"));
        }

        if (!"CONFIRMED".equals(booking.getStatus())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Booking is not confirmed"));
        }

        booking.setStatus("CANCELLED");
        bookingRepository.save(booking);
        if (booking.getUserId() != null) notificationRepository.save(new com.servicehub.model.Notification(booking.getUserId(), "Booking #" + booking.getId() + " is now " + booking.getStatus()));

        return ResponseEntity.ok(booking);
    }
    @PatchMapping("/bookings/{id}/complete")
    public ResponseEntity<?> completeProfessionalBooking(
            @PathVariable Long id,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElse(null);

        if (user == null || !"PROFESSIONAL".equals(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Specialist specialist = specialistRepository
                .findByUserId(user.getId())
                .orElse(null);

        if (specialist == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Booking booking = bookingRepository.findById(id).orElse(null);

        if (booking == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        if (!specialist.getId().equals(booking.getSpecialistId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if (!"CONFIRMED".equals(booking.getStatus())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Booking is not confirmed"));
        }

        if (!booking.getBookingDate().isBefore(java.time.LocalDate.now())
                && !(booking.getBookingDate().equals(java.time.LocalDate.now())
                && booking.getBookingTime().isBefore(java.time.LocalTime.now()))) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Cannot complete a future booking"));
        }

        booking.setStatus("COMPLETED");
        bookingRepository.save(booking);
        if (booking.getUserId() != null) notificationRepository.save(new com.servicehub.model.Notification(booking.getUserId(), "Booking #" + booking.getId() + " is now " + booking.getStatus()));

        return ResponseEntity.ok(booking);
    }

    @PostMapping(value = "/me/photo", consumes = "multipart/form-data")
    public ResponseEntity<?> uploadProfilePhoto(
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElse(null);

        if (user == null || !"PROFESSIONAL".equals(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Specialist specialist = specialistRepository
                .findByUserId(user.getId())
                .orElse(null);

        if (specialist == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        if (file.isEmpty() || file.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Image must be under 5 MB"));
        }

        String contentType = file.getContentType();

        if (!"image/jpeg".equals(contentType)
                && !"image/png".equals(contentType)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Only JPG and PNG images are allowed"));
        }

        try {
            byte[] bytes = file.getBytes();
            java.awt.image.BufferedImage image =
                    javax.imageio.ImageIO.read(
                            new java.io.ByteArrayInputStream(bytes)
                    );

            if (image == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Invalid image file"));
            }
            String extension;
            if (bytes.length >= 3
                    && (bytes[0] & 0xFF) == 0xFF
                    && (bytes[1] & 0xFF) == 0xD8
                    && (bytes[2] & 0xFF) == 0xFF) {
                extension = ".jpg";
            } else if (bytes.length >= 8
                    && (bytes[0] & 0xFF) == 0x89
                    && bytes[1] == 0x50
                    && bytes[2] == 0x4E
                    && bytes[3] == 0x47
                    && bytes[4] == 0x0D
                    && bytes[5] == 0x0A
                    && bytes[6] == 0x1A
                    && bytes[7] == 0x0A) {
                extension = ".png";
            } else {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Invalid image file"));
            }

            Path uploadDirectory = Paths.get("uploads", "professionals");
            Files.createDirectories(uploadDirectory);

            String filename = UUID.randomUUID() + extension;
            Path destination = uploadDirectory.resolve(filename);

            Files.write(destination, bytes);

            specialist.setImageUrl("/api/uploads/professionals/" + filename);
            specialistRepository.save(specialist);

            return ResponseEntity.ok(
                    Map.of("imageUrl", specialist.getImageUrl())
            );

        } catch (java.io.IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Could not save image"));
        }
    }
    @PostMapping("/me/days-off")
    public ResponseEntity<?> addDayOff(
            @RequestParam LocalDate date,
            Authentication authentication) {

        String email = authentication.getName();

        var user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            return ResponseEntity.status(401).body("User not found");
        }
        if (!"PROFESSIONAL".equals(user.getRole())) {
            return ResponseEntity.status(403)
                    .body("Professional access required");
        }
        var specialist = specialistRepository
                .findByUserId(user.getId())
                .orElse(null);

        if (specialist == null) {
            return ResponseEntity.status(404).body("Professional profile not found");
        }

        if (date.isBefore(LocalDate.now())) {
            return ResponseEntity.badRequest().body("Cannot add a past date");
        }

        if (dayOffRepository.existsBySpecialistIdAndDayOff(
                specialist.getId(), date)) {
            return ResponseEntity.badRequest().body("Day off already exists");
        }
        boolean hasBookings = !bookingRepository
                .findBySpecialistIdAndBookingDateAndStatus(
                        specialist.getId(),
                        date,
                        "CONFIRMED"
                )
                .isEmpty();

        if (hasBookings) {
            return ResponseEntity.badRequest()
                    .body("Cannot add a day off with existing confirmed bookings.");
        }
        SpecialistDayOff dayOff = new SpecialistDayOff();
        dayOff.setSpecialistId(specialist.getId());
        dayOff.setDayOff(date);

        dayOffRepository.save(dayOff);

        return ResponseEntity.ok("Day off added successfully");
    }
    @GetMapping("/me/days-off")
    public ResponseEntity<?> getMyDaysOff(Authentication authentication) {

        String email = authentication.getName();

        var user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            return ResponseEntity.status(401).body("User not found");
        }
        if (!"PROFESSIONAL".equals(user.getRole())) {
            return ResponseEntity.status(403)
                    .body("Professional access required");
        }
        var specialist = specialistRepository
                .findByUserId(user.getId())
                .orElse(null);

        if (specialist == null) {
            return ResponseEntity.status(404)
                    .body("Professional profile not found");
        }

        var daysOff = dayOffRepository.findBySpecialistId(specialist.getId());

        return ResponseEntity.ok(daysOff);
    }
    @DeleteMapping("/me/days-off/{id}")
    public ResponseEntity<?> deleteDayOff(
            @PathVariable Long id,
            Authentication authentication) {

        String email = authentication.getName();

        var user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            return ResponseEntity.status(401).body("User not found");
        }
        if (!"PROFESSIONAL".equals(user.getRole())) {
            return ResponseEntity.status(403)
                    .body("Professional access required");
        }
        var specialist = specialistRepository.findByUserId(user.getId()).orElse(null);

        if (specialist == null) {
            return ResponseEntity.status(404).body("Professional profile not found");
        }

        var dayOff = dayOffRepository
                .findByIdAndSpecialistId(id, specialist.getId())
                .orElse(null);

        if (dayOff == null) {
            return ResponseEntity.status(404).body("Day off not found");
        }

        dayOffRepository.delete(dayOff);

        return ResponseEntity.ok("Day off deleted successfully");
    }
}