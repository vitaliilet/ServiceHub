package com.servicehub.model;
import jakarta.persistence.*;
import java.time.Instant;
@Entity @Table(name="booking_messages")
public class Message {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
 @Column(nullable=false) public Long bookingId;
 @Column(nullable=false) public Long senderId;
 @Column(nullable=false,length=2000) public String body;
 @Column(nullable=false) public Instant createdAt=Instant.now();
 public Message(){} public Message(Long b,Long s,String text){bookingId=b;senderId=s;body=text;}
}