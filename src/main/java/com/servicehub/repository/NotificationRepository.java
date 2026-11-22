package com.servicehub.repository;
import com.servicehub.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface NotificationRepository extends JpaRepository<Notification,Long>{List<Notification> findTop100ByUserIdOrderByCreatedAtDesc(Long userId);Optional<Notification> findByIdAndUserId(Long id,Long userId);}
