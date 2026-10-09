package com.creative.collaboration.repository;

import com.creative.collaboration.entity.PostMedia;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PostMediaRepository
        extends JpaRepository<PostMedia, Long> {
}