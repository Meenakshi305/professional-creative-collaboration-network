package com.creative.collaboration.repository;

import com.creative.collaboration.entity.AdminReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminReportRepository extends JpaRepository<AdminReport,Long> {
  Page<AdminReport> findByAssignedAdminId(Long adminId, Pageable pageable);
  Page<AdminReport> findByStatus(String status, Pageable pageable);
  long countByStatus(String status);
}
