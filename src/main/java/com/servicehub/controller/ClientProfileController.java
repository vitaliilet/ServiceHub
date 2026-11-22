package com.servicehub.controller;

import com.servicehub.dto.ClientProfileRequest;
import com.servicehub.model.User;
import com.servicehub.repository.UserRepository;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.*;
import java.util.*;

@RestController
@RequestMapping("/clients/me")
public class ClientProfileController {
    private final UserRepository users;
    public ClientProfileController(UserRepository users) { this.users = users; }

    private User current(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return null;
        return users.findByEmail(auth.getName()).filter(u -> "CLIENT".equals(u.getRole())).orElse(null);
    }
    private ResponseEntity<?> unauthorized() { return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Client account required")); }
    private Map<String,Object> result(User u) {
        Map<String,Object> data = new LinkedHashMap<>();
        data.put("id",u.getId()); data.put("name",u.getName()); data.put("email",u.getEmail());
        data.put("role",u.getRole()); data.put("phone",u.getPhone()); data.put("city",u.getCity());
        data.put("address",u.getAddress()); data.put("imageUrl",u.getImageUrl());
        return data;
    }
    @GetMapping
    public ResponseEntity<?> get(Authentication auth) {
        User u=current(auth); return u == null ? unauthorized() : ResponseEntity.ok(result(u));
    }
    private String clean(String value, int max) {
        if (value == null) return null;
        String v=value.trim(); return v.length() > max ? null : v;
    }
    @PutMapping
    public ResponseEntity<?> update(@RequestBody ClientProfileRequest req, Authentication auth) {
        User u=current(auth); if(u==null) return unauthorized();
        if(req==null || req.name()==null || req.name().trim().isEmpty() || req.name().trim().length()>100 ||
           (req.phone()!=null && req.phone().trim().length()>30) ||
           (req.city()!=null && req.city().trim().length()>120) ||
           (req.address()!=null && req.address().trim().length()>300))
            return ResponseEntity.badRequest().body(Map.of("message","Invalid profile details"));
        u.setName(req.name().trim()); u.setPhone(clean(req.phone(),30));
        u.setCity(clean(req.city(),120)); u.setAddress(clean(req.address(),300));
        return ResponseEntity.ok(result(users.save(u)));
    }
    @PostMapping(value="/photo", consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> photo(@RequestParam("file") MultipartFile file, Authentication auth) {
        User u=current(auth); if(u==null) return unauthorized();
        if(file==null || file.isEmpty() || file.getSize()>5*1024*1024)
            return ResponseEntity.badRequest().body(Map.of("message","Image must be 1–5 MB"));
        try {
            byte[] bytes=file.getBytes();
            boolean png=bytes.length>=8 && (bytes[0]&255)==137 && bytes[1]==80 && bytes[2]==78 && bytes[3]==71 && bytes[4]==13 && bytes[5]==10 && bytes[6]==26 && bytes[7]==10;
            boolean jpeg=bytes.length>=3 && (bytes[0]&255)==255 && (bytes[1]&255)==216 && (bytes[2]&255)==255;
            if(!png && !jpeg) return ResponseEntity.badRequest().body(Map.of("message","Only PNG and JPEG images are supported"));
            Path dir=Paths.get("uploads","clients").toAbsolutePath().normalize(); Files.createDirectories(dir);
            String name=UUID.randomUUID()+(png?".png":".jpg");
            Files.write(dir.resolve(name),bytes,StandardOpenOption.CREATE_NEW);
            String old=u.getImageUrl();
            u.setImageUrl("/api/uploads/clients/"+name); users.save(u);
            if(old!=null && old.startsWith("/api/uploads/clients/")) {
                try { Files.deleteIfExists(dir.resolve(old.substring(old.lastIndexOf('/')+1))); } catch(Exception ignored) {}
            }
            return ResponseEntity.ok(result(u));
        } catch(Exception e) { return ResponseEntity.status(500).body(Map.of("message","Could not upload image")); }
    }
}
