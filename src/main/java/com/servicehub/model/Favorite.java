package com.servicehub.model;
import jakarta.persistence.*;
@Entity @Table(name="user_favorites",uniqueConstraints=@UniqueConstraint(columnNames={"user_id","specialist_id"}))
public class Favorite {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
 @Column(name="user_id",nullable=false) public Long userId;
 @Column(name="specialist_id",nullable=false) public Long specialistId;
 public Favorite() {} public Favorite(Long u,Long s){userId=u;specialistId=s;}
}