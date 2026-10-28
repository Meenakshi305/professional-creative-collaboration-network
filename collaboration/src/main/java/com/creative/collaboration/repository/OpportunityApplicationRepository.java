
package com.creative.collaboration.repository;

import com.creative.collaboration.entity.OpportunityApplication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OpportunityApplicationRepository
        extends JpaRepository<OpportunityApplication, Long> {
    long countByApplicant_Id(Long userId);
    List<OpportunityApplication> findByApplicant_IdOrderByAppliedAtDesc(Long userId, org.springframework.data.domain.Pageable page);


    boolean existsByOpportunity_IdAndApplicant_Id(
            Long opportunityId,
            Long applicantId
    );

    List<OpportunityApplication> findByOpportunity_Id(
            Long opportunityId
    );

    List<OpportunityApplication> findByApplicant_Id(
            Long applicantId
    );

    void deleteByOpportunity_Id(
            Long opportunityId
    );
}
