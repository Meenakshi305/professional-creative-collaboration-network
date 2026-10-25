package com.creative.collaboration.controller;

import com.creative.collaboration.entity.AdminReport;
import com.creative.collaboration.repository.AdminReportRepository;
import com.creative.collaboration.repository.PostRepository;
import com.creative.collaboration.service.AdminIdentityService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api/reports")
@PreAuthorize("isAuthenticated()")
public class PostReportController {
  private final AdminReportRepository reports;
  private final PostRepository posts;
  private final AdminIdentityService identity;
  public PostReportController(AdminReportRepository reports,PostRepository posts,AdminIdentityService identity){
    this.reports=reports;this.posts=posts;this.identity=identity;
  }
  public record CreateReportRequest(@NotNull Long postId, @NotBlank @Size(max=1000) String reason) {}
  @PostMapping @ResponseStatus(HttpStatus.CREATED)
  public AdminReport create(@Valid @RequestBody CreateReportRequest req,Authentication auth){
    if(!posts.existsById(req.postId())) throw new ResponseStatusException(NOT_FOUND,"Post not found");
    return reports.save(AdminReport.builder().reportedPostId(req.postId())
       .reporterId(identity.current(auth).getId()).reason(req.reason().trim()).build());
  }
}
