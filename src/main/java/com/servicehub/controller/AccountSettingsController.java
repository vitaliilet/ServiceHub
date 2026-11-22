package com.servicehub.controller;
import com.servicehub.dto.ChangePasswordRequest;
import com.servicehub.repository.UserRepository;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/account")
public class AccountSettingsController {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    public AccountSettingsController(UserRepository users, PasswordEncoder encoder) {
        this.users = users; this.encoder = encoder;
    }
    @PostMapping("/password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(Map.of("message", "Sign in required"));
        var user = users.findByEmail(auth.getName()).orElse(null);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Sign in required"));
        if (request.currentPassword() == null || !encoder.matches(request.currentPassword(), user.getPassword()))
            return ResponseEntity.status(400).body(Map.of("message", "Current password is incorrect"));
        if (request.newPassword() == null || request.newPassword().length() < 8 || request.newPassword().length() > 128)
            return ResponseEntity.badRequest().body(Map.of("message", "New password must be 8-128 characters"));
        user.setPassword(encoder.encode(request.newPassword()));
        users.save(user);
        return ResponseEntity.ok(Map.of("message", "Password updated"));
    }
}
