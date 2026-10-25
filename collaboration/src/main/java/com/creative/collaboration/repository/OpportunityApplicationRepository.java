
package com.creative.collaboration.repository;

import com.creative.collaboration.entity.OpportunityApplication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OpportunityApplicationRepository
        extends JpaRepository<OpportunityApplication, Long> {

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
