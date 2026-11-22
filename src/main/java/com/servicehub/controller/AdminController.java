package com.servicehub.controller;

import com.servicehub.model.*;
import com.servicehub.repository.*;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/admin")
public class AdminController {
    private final UserRepository users;
    private final BookingRepository bookings;
    private final ReviewRepository reviews;

    public AdminController(UserRepository users, BookingRepository bookings, ReviewRepository reviews) {
        this.users = users; this.bookings = bookings; this.reviews = reviews;
    }

    @GetMapping("/summary")
    public Map<String,Object> summary() {
        List<Booking> all = bookings.findAll();
        return Map.of("users", users.count(), "bookings", all.size(), "reviews", reviews.count(),
            "professionals", users.findAll().stream().filter(u -> "PROFESSIONAL".equals(u.getRole())).count(),
            "blocked", users.findAll().stream().filter(User::isBlocked).count(),
            "upcoming", all.stream().filter(b -> b.getBookingDate() != null && !b.getBookingDate().isBefore(LocalDate.now()) && "CONFIRMED".equals(b.getStatus())).count());
    }

    @GetMapping("/users")
    public List<Map<String,Object>> users() {
        return users.findAll().stream().map(u -> {
            Map<String,Object> row = new LinkedHashMap<>();
            row.put("id", u.getId()); row.put("name", u.getName()); row.put("email", u.getEmail());
            row.put("role", u.getRole()); row.put("blocked", u.isBlocked());
            row.put("city", u.getCity() == null ? "" : u.getCity());
            return row;
        }).toList();
    }

    @GetMapping("/bookings")
    public List<Booking> bookings() { return bookings.findAll(); }

    @GetMapping("/reviews")
    public List<Review> reviews() { return reviews.findAll(); }

    @PatchMapping("/users/{id}/blocked")
    @Transactional
    public ResponseEntity<?> setBlocked(@PathVariable Long id, @RequestBody Map<String,Boolean> body, Authentication auth) {
        User user = users.findById(id).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();
        if (user.getEmail().equalsIgnoreCase(auth.getName()) || "ADMIN".equals(user.getRole()))
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Administrator accounts cannot be blocked here."));
        if (!body.containsKey("blocked") || body.get("blocked") == null)
            return ResponseEntity.badRequest().body(Map.of("message", "blocked must be true or false"));
        user.setBlocked(body.get("blocked")); users.save(user);
        return ResponseEntity.ok(Map.of("id", user.getId(), "blocked", user.isBlocked()));
    }

    @PatchMapping("/bookings/{id}/cancel")
    @Transactional
    public ResponseEntity<?> cancelBooking(@PathVariable Long id) {
        Booking booking = bookings.findById(id).orElse(null);
        if (booking == null) return ResponseEntity.notFound().build();
        if ("CANCELLED".equals(booking.getStatus()))
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Booking is already cancelled."));
        booking.setStatus("CANCELLED"); bookings.save(booking);
        return ResponseEntity.ok(Map.of("id", id, "status", "CANCELLED"));
    }

    @DeleteMapping("/reviews/{id}")
    @Transactional
    public ResponseEntity<?> deleteReview(@PathVariable Long id) {
        if (!reviews.existsById(id)) return ResponseEntity.notFound().build();
        reviews.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
