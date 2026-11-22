package com.servicehub.repository;
import com.servicehub.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface MessageRepository extends JpaRepository<Message,Long>{List<Message> findByBookingIdOrderByCreatedAtAsc(Long bookingId);}
