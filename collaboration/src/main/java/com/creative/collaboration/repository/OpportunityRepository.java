package com.creative.collaboration.repository;

import com.creative.collaboration.entity.Opportunity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OpportunityRepository
        extends JpaRepository<Opportunity, Long> {
}