package com.servicehub.model;
import jakarta.persistence.*;
import java.time.Instant;
@Entity @Table(name="user_notifications")
public class Notification {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
 @Column(nullable=false) public Long userId;
 @Column(nullable=false,length=500) public String message;
 @Column(nullable=false) public boolean isRead=false;
 @Column(nullable=false) public Instant createdAt=Instant.now();
 public Notification(){} public Notification(Long u,String m){userId=u;message=m;}
}