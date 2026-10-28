package com.creative.collaboration.guardian;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;

public interface ParentAccountConsentRepository extends JpaRepository<ParentAccountConsent, Long> {
    Optional<ParentAccountConsent> findByChild_Id(Long childId);
    List<ParentAccountConsent> findByGuardianEmailAndStatusOrderByCreatedAtDesc(String email, ParentAccountConsent.Status status);
    List<ParentAccountConsent> findByGuardian_IdAndStatusOrderByCreatedAtDesc(Long id, ParentAccountConsent.Status status);
    boolean existsByChild_IdAndStatus(Long id, ParentAccountConsent.Status status);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from ParentAccountConsent c where c.id = :id")
    Optional<ParentAccountConsent> lockById(@Param("id") Long id);
}
