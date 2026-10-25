package com.creative.collaboration.controller;

import com.creative.collaboration.entity.Event;
import com.creative.collaboration.entity.Opportunity;
import com.creative.collaboration.entity.Post;
import com.creative.collaboration.repository.EventRepository;
import com.creative.collaboration.repository.OpportunityRepository;
import com.creative.collaboration.repository.PostRepository;
import com.creative.collaboration.service.AdminAuditService;
import com.creative.collaboration.service.AdminIdentityService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/content")
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
public class AdminContentModerationController {
    private final OpportunityRepository opportunities;
    private final EventRepository events;
    private final PostRepository posts;
    private final AdminAuditService audit;
    private final AdminIdentityService identity;

    public AdminContentModerationController(OpportunityRepository opportunities, EventRepository events,
                                           PostRepository posts, AdminAuditService audit,
                                           AdminIdentityService identity) {
        this.opportunities=opportunities; this.events=events; this.posts=posts;
        this.audit=audit; this.identity=identity;
    }

    public record RemovalRequest(@NotBlank @Size(min=10,max=1000) String reason) {}
    public record ContentView(Long id, String title, String type, Long ownerId) {}
    public record RemovalResult(String type, Long id, String outcome) {}

    @GetMapping("/opportunities")
    public Page<ContentView> opportunities(Pageable pageable) {
        return opportunities.findAll(pageable).map(o -> new ContentView(o.getId(),o.getTitle(),"OPPORTUNITY",o.getCreatedBy().getId()));
    }
    @GetMapping("/events")
    public Page<ContentView> events(Pageable pageable) {
        return events.findAll(pageable).map(e -> new ContentView(e.getId(),e.getTitle(),"EVENT",e.getCreatedBy().getId()));
    }
    @GetMapping("/posts")
    public Page<ContentView> posts(Pageable pageable) {
        return posts.findAll(pageable).map(p -> new ContentView(p.getId(),p.getCaption(),"POST",p.getUser().getId()));
    }

    // These are hard deletion endpoints. Confirm registrations/payments/applications and their
    // foreign keys before using in production. A DB referential constraint may reject deletion.
    @DeleteMapping("/opportunities/{id}")
    @Transactional
    public RemovalResult removeOpportunity(@PathVariable Long id,
                                           @Valid @RequestBody RemovalRequest body, Authentication auth) {
        Opportunity o = opportunities.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"Opportunity not found"));
        opportunities.delete(o);
        opportunities.flush();
        audit.record(identity.current(auth).getId(),"DELETE_OPPORTUNITY","OPPORTUNITY",id,body.reason());
        return new RemovalResult("OPPORTUNITY",id,"DELETED");
    }
    @DeleteMapping("/events/{id}")
    @Transactional
    public RemovalResult removeEvent(@PathVariable Long id,
                                     @Valid @RequestBody RemovalRequest body, Authentication auth) {
        Event e = events.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"Event not found"));
        events.delete(e);
        events.flush();
        audit.record(identity.current(auth).getId(),"DELETE_EVENT","EVENT",id,body.reason());
        return new RemovalResult("EVENT",id,"DELETED");
    }
    @DeleteMapping("/posts/{id}")
    @Transactional
    public RemovalResult removePost(@PathVariable Long id,
                                    @Valid @RequestBody RemovalRequest body, Authentication auth) {
        Post p = posts.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"Post not found"));
        posts.delete(p);
        posts.flush();
        audit.record(identity.current(auth).getId(),"DELETE_POST","POST",id,body.reason());
        return new RemovalResult("POST",id,"DELETED");
    }
}
