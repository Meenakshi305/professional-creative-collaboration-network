package com.creative.collaboration.repository;
import com.creative.collaboration.entity.CommentModerationReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CommentModerationReportRepository extends JpaRepository<CommentModerationReport,Long> {
 Page<CommentModerationReport> findByStatus(String status, Pageable pageable);
 Page<CommentModerationReport> findByAssignedAdminId(Long id, Pageable pageable);
 boolean existsByCommentIdAndReporterIdAndStatus(Long commentId, Long reporterId, String status);
}
