package com.creative.collaboration.controller;

import com.creative.collaboration.repository.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
public class AdminOverviewController {
  private final UserRepository users;
  private final PostRepository posts;
  private final EventRepository events;
  private final AdminReportRepository reports;
  public AdminOverviewController(UserRepository users, PostRepository posts,
      EventRepository events, AdminReportRepository reports){
    this.users=users;this.posts=posts;this.events=events;this.reports=reports;
  }
  public record Overview(long totalUsers, long totalPosts, long totalEvents,
                         long pendingReports, long totalReports) {}
  @GetMapping("/overview") public Overview overview(){
    return new Overview(users.count(),posts.count(),events.count(),reports.countByStatus("PENDING"),reports.count());
  }
  @GetMapping("/analytics") public Overview analytics(){return overview();}
}
