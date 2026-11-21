
package com.servicehub.controller;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.servicehub.model.Specialist;
import com.servicehub.repository.SpecialistRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/specialists")
public class SpecialistController {

    private final SpecialistRepository repository;

    public SpecialistController(SpecialistRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Specialist> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public ResponseEntity<Void> create() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }
}

