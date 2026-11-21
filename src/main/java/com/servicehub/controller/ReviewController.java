
package com.servicehub.controller;
import com.servicehub.dto.ReviewRequest;
import com.servicehub.model.Booking;
import com.servicehub.model.User;
import com.servicehub.repository.BookingRepository;
import com.servicehub.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import java.util.Map;
import com.servicehub.repository.ReviewRepository;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.servicehub.model.Review;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.util.List;
@RestController
@RequestMapping("/reviews")
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;


    public ReviewController(
            ReviewRepository reviewRepository,
            BookingRepository bookingRepository,
            UserRepository userRepository
    ) {
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
    }


    @GetMapping("/specialist/{specialistId}")
    public List<Review> getSpecialistReviews(
            @PathVariable Long specialistId
    ) {
        return reviewRepository.findBySpecialistId(specialistId);
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyReviews(Authentication authentication) {

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

        if (!"CLIENT".equals(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Only clients can view their reviews"));
        }

        return ResponseEntity.ok(
                reviewRepository.findByClientId(user.getId())
        );
    }

    @PostMapping
    public ResponseEntity<?> createReview(
            @RequestBody ReviewRequest request,
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

        if (!"CLIENT".equals(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Only clients can leave reviews"));
        }

        if (request == null || request.getBookingId() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Booking ID is required"));
        }

        if (request.getRating() < 1 || request.getRating() > 5) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Rating must be between 1 and 5"));
        }

        String comment = request.getComment() == null
                ? ""
                : request.getComment().trim();

        if (comment.isEmpty() || comment.length() > 2000) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Comment must contain 1 to 2000 characters"));
        }

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElse(null);

        if (booking == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Booking not found"));
        }

        if (!user.getId().equals(booking.getUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "This booking does not belong to you"));
        }

        if (!"COMPLETED".equals(booking.getStatus())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Only completed bookings can be reviewed"));
        }

        if (booking.getSpecialistId() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Booking has no specialist"));
        }

        if (reviewRepository.existsByBookingId(booking.getId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Review already exists for this booking"));
        }

        Review review = new Review();
        review.setBookingId(booking.getId());
        review.setSpecialistId(booking.getSpecialistId());
        review.setClientId(user.getId());
        review.setRating(request.getRating());
        review.setComment(comment);

        try {
            Review saved = reviewRepository.saveAndFlush(review);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(saved);

        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "message",
                            "Review already exists for this booking"
                    ));
        }
    }

}

