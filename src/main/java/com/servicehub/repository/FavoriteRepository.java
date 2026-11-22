package com.servicehub.repository;
import com.servicehub.model.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface FavoriteRepository extends JpaRepository<Favorite,Long>{List<Favorite> findByUserId(Long userId);Optional<Favorite> findByUserIdAndSpecialistId(Long userId,Long specialistId);}
