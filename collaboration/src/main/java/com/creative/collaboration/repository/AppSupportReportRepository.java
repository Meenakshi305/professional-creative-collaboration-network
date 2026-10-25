
package com.creative.collaboration.repository;

import com.creative.collaboration.entity.AppSupportReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppSupportReportRepository
        extends JpaRepository<AppSupportReport, Long> {

    List<AppSupportReport> findByReporterUserIdOrderByCreatedAtDesc(
            Long reporterUserId
    );

    List<AppSupportReport> findByStatusOrderByCreatedAtDesc(
            String status
    );
}
