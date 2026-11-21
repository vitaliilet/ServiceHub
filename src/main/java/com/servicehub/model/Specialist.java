
package com.servicehub.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
public class Specialist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;
    private String name;
    private String city;
    private String service;
    private int price;
    private int workStartHour = 8;
    private int workEndHour = 17;
    // Additional profile information
    private int experience;
    private double rating;
    private int reviewCount;
    private String imageUrl;

    @Column(length = 2000)
    private String description;

    public Specialist() {
    }

    public Specialist(String name, String city, String service, int price) {
        this.name = name;
        this.city = city;
        this.service = service;
        this.price = price;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getCity() {
        return city;
    }

    public String getService() {
        return service;
    }

    public int getPrice() {
        return price;
    }

    public int getExperience() {
        return experience;
    }

    public double getRating() {
        return rating;
    }

    public int getReviewCount() {
        return reviewCount;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public String getDescription() {
        return description;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public void setService(String service) {
        this.service = service;
    }

    public void setPrice(int price) {
        this.price = price;
    }

    public void setExperience(int experience) {
        this.experience = experience;
    }

    public void setRating(double rating) {
        this.rating = rating;
    }

    public void setReviewCount(int reviewCount) {
        this.reviewCount = reviewCount;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public void setDescription(String description) {
        this.description = description;
    }
    @JsonIgnore

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
    public int getWorkStartHour() {
        return workStartHour;
    }

    public void setWorkStartHour(int workStartHour) {
        this.workStartHour = workStartHour;
    }

    public int getWorkEndHour() {
        return workEndHour;
    }

    public void setWorkEndHour(int workEndHour) {
        this.workEndHour = workEndHour;
    }
}
