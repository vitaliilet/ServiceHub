package com.servicehub.controller;
import com.servicehub.model.*;
import com.servicehub.repository.*;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController @RequestMapping("/workspace")
public class WorkspaceController {
 private final UserRepository users; private final SpecialistRepository specialists;
 private final BookingRepository bookings; private final FavoriteRepository favorites;
 private final NotificationRepository notifications; private final MessageRepository messages;
 public WorkspaceController(UserRepository u,SpecialistRepository s,BookingRepository b,FavoriteRepository f,NotificationRepository n,MessageRepository m){users=u;specialists=s;bookings=b;favorites=f;notifications=n;messages=m;}
 private User current(Authentication a){return a==null?null:users.findByEmail(a.getName()).orElse(null);}
 private ResponseEntity<?> unauth(){return ResponseEntity.status(401).body("Sign in required");}
 @GetMapping("/favorites") public ResponseEntity<?> favorites(Authentication a){User u=current(a);if(u==null)return unauth();return ResponseEntity.ok(favorites.findByUserId(u.getId()));}
 @PostMapping("/favorites/{id}") public ResponseEntity<?> favorite(@PathVariable Long id,Authentication a){User u=current(a);if(u==null)return unauth();if(!specialists.existsById(id))return ResponseEntity.notFound().build();if(favorites.findByUserIdAndSpecialistId(u.getId(),id).isEmpty())favorites.save(new Favorite(u.getId(),id));return ResponseEntity.ok().build();}
 @DeleteMapping("/favorites/{id}") public ResponseEntity<?> unfavorite(@PathVariable Long id,Authentication a){User u=current(a);if(u==null)return unauth();favorites.findByUserIdAndSpecialistId(u.getId(),id).ifPresent(favorites::delete);return ResponseEntity.noContent().build();}
 @GetMapping("/notifications") public ResponseEntity<?> notifications(Authentication a){User u=current(a);if(u==null)return unauth();return ResponseEntity.ok(notifications.findTop100ByUserIdOrderByCreatedAtDesc(u.getId()));}
 @PatchMapping("/notifications/{id}/read") public ResponseEntity<?> markRead(@PathVariable Long id,Authentication a){User u=current(a);if(u==null)return unauth();var notification=notifications.findByIdAndUserId(id,u.getId()).orElse(null);if(notification==null)return ResponseEntity.notFound().build();notification.isRead=true;notifications.save(notification);return ResponseEntity.ok().build();}
 private boolean member(User u,Booking booking){if(u==null||booking==null)return false;if(u.getId().equals(booking.getUserId()))return true;return specialists.findByUserId(u.getId()).map(s->s.getId().equals(booking.getSpecialistId())).orElse(false);}
 @GetMapping("/messages/{bookingId}") public ResponseEntity<?> conversation(@PathVariable Long bookingId,Authentication a){User u=current(a);if(u==null)return unauth();Booking booking=bookings.findById(bookingId).orElse(null);if(!member(u,booking))return ResponseEntity.status(403).body("Not a participant");return ResponseEntity.ok(messages.findByBookingIdOrderByCreatedAtAsc(bookingId));}
 public record MessageInput(String body){}
 @PostMapping("/messages/{bookingId}") public ResponseEntity<?> send(@PathVariable Long bookingId,@RequestBody MessageInput input,Authentication a){User u=current(a);if(u==null)return unauth();Booking booking=bookings.findById(bookingId).orElse(null);if(!member(u,booking))return ResponseEntity.status(403).body("Not a participant");if(input==null||input.body()==null||input.body().isBlank()||input.body().length()>2000)return ResponseEntity.badRequest().body("Message must contain 1–2000 characters");Message msg=messages.save(new Message(bookingId,u.getId(),input.body().trim()));Long other=u.getId().equals(booking.getUserId())?specialists.findById(booking.getSpecialistId()).map(s->s.getUser()).map(User::getId).orElse(null):booking.getUserId();if(other!=null)notifications.save(new Notification(other,"New message for booking #"+bookingId));return ResponseEntity.status(201).body(msg);}
}
