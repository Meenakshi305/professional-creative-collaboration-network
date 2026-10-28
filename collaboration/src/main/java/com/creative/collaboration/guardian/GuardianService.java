package com.creative.collaboration.guardian;

import com.creative.collaboration.entity.*;
import com.creative.collaboration.repository.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.*;
import java.util.*;
import static com.creative.collaboration.guardian.ParentAccountConsent.Status.*;
import static org.springframework.http.HttpStatus.*;

@Service @Transactional
public class GuardianService {
    private final UserRepository users;
    private final ParentAccountConsentRepository consents;
    private final PostRepository posts;
    private final EventRegistrationRepository events;
    private final OpportunityApplicationRepository applications;
    private final NotificationRepository notifications;
    public GuardianService(UserRepository users, ParentAccountConsentRepository consents,
            PostRepository posts, EventRegistrationRepository events,
            OpportunityApplicationRepository applications, NotificationRepository notifications) {
        this.users = users; this.consents = consents; this.posts = posts;
        this.events = events; this.applications = applications; this.notifications = notifications;
    }
    public record ConsentStatus(boolean required, String status, String guardianEmail) {}
    public record RequestView(Long id, String childName, String childUsername, Instant expiresAt) {}
    public record ChildView(Long consentId, Long childId, String fullName, String username,
                            long posts, long events, long applications, Instant approvedAt, Controls controls) {}
    public record Controls(boolean accessPaused, boolean postingAllowed, boolean eventsAllowed, boolean applicationsAllowed) {}
    private Controls controls(ParentAccountConsent c) { return new Controls(c.isAccessPaused(), c.isPostingAllowed(), c.isEventsAllowed(), c.isApplicationsAllowed()); }
    public record Activity(Long id, String title, String status, LocalDateTime date) {}
    public record ChildActivity(List<Activity> posts, List<Activity> events, List<Activity> applications) {}

    public static String normalize(String email) { return email.trim().toLowerCase(Locale.ROOT); }
    public static boolean isMinor(User user) {
        return user.getDateOfBirth() != null && user.getDateOfBirth().isAfter(today().minusYears(18));
    }
    public static LocalDate today() { return LocalDate.now(ZoneId.of("Australia/Adelaide")); }
    private User current(String email) {
        return users.findByEmail(email).filter(User::isActive)
            .orElseThrow(() -> fail(UNAUTHORIZED, "Active account required"));
    }
    private User adult(String email) {
        var user = current(email);
        if (user.getDateOfBirth() == null || !user.getDateOfBirth().isBefore(today()) || isMinor(user))
            throw fail(FORBIDDEN, "An adult parent or guardian account is required");
        return user;
    }
    /** Called only from server-side child registration in the same transaction. */
    public void requestConsent(User child, String parentEmail) {
        if (!isMinor(child)) throw fail(BAD_REQUEST, "Consent requests are for children under 18");
        if (parentEmail == null || parentEmail.isBlank()) throw fail(BAD_REQUEST, "Guardian email is required for users under 18");
        String email = normalize(parentEmail);
        if (email.length() > 150 || !email.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+"))
            throw fail(BAD_REQUEST, "Enter a valid guardian email");
        if (email.equals(normalize(child.getEmail()))) throw fail(BAD_REQUEST, "Use a separate parent email");
        users.findByEmail(email).ifPresent(parent -> {
            if (isMinor(parent)) throw fail(BAD_REQUEST, "The guardian email belongs to a child account");
        });
        var c = new ParentAccountConsent(); c.setChild(child); c.setGuardianEmail(email);
        consents.save(c);
        // Stored by email so the parent can register later and still see the request.
        notifications.save(new Notification(email, "A child account is awaiting your consent. Open Settings > Parental Controls to review it.", "guardian"));
    }
    @Transactional(readOnly = true)
    public ConsentStatus status(String email) {
        var user = current(email);
        if (!isMinor(user)) return new ConsentStatus(false, "NOT_REQUIRED", null);
        return consents.findByChild_Id(user.getId()).map(c -> new ConsentStatus(true,
            c.getStatus() == APPROVED && c.isAccessPaused() ? "PAUSED" :
            c.getStatus() == PENDING && !Instant.now().isBefore(c.getExpiresAt()) ? "EXPIRED" : c.getStatus().name(),
            c.getGuardianEmail())).orElse(new ConsentStatus(true, "MISSING", null));
    }
    @Transactional(readOnly = true)
    public boolean canUsePlatform(String email) {
        var user = current(email);
        return !isMinor(user) || consents.findByChild_Id(user.getId())
            .filter(c -> c.getStatus() == APPROVED && !c.isAccessPaused()).isPresent();
    }
    @Transactional(readOnly = true)
    public List<RequestView> requests(String email) {
        var parent = adult(email);
        return consents.findByGuardianEmailAndStatusOrderByCreatedAtDesc(normalize(parent.getEmail()), PENDING)
            .stream().filter(c -> Instant.now().isBefore(c.getExpiresAt()) && isMinor(c.getChild()))
            .map(c -> new RequestView(c.getId(), c.getChild().getFullName(), c.getChild().getUsername(), c.getExpiresAt())).toList();
    }
    public void decide(String email, Long id, boolean approve, boolean guardianConfirmed) {
        var parent = adult(email);
        var c = consents.lockById(id).orElseThrow(() -> fail(NOT_FOUND, "Request not found"));
        if (!normalize(parent.getEmail()).equals(c.getGuardianEmail()) || parent.getId().equals(c.getChild().getId()))
            throw fail(NOT_FOUND, "Request not found");
        if (!isMinor(c.getChild())) throw fail(CONFLICT, "This account no longer requires guardian consent");
        if (approve && !guardianConfirmed) throw fail(BAD_REQUEST, "Confirm that you are the parent or guardian and agree to the notice");
        var target = approve ? APPROVED : DECLINED;
        if (c.getStatus() == target && c.getGuardian() != null && parent.getId().equals(c.getGuardian().getId())) return;
        if (c.getStatus() != PENDING) throw fail(CONFLICT, "This request has already been decided");
        if (!Instant.now().isBefore(c.getExpiresAt())) throw fail(GONE, "This request has expired");
        c.setGuardian(parent); c.setStatus(target); c.setDecidedAt(Instant.now());
        // Consent is separate from admin account activation/suspension.
        notifications.save(new Notification(c.getChild().getEmail(), approve ? "Your guardian approved your account." : "Your guardian declined the consent request.", "guardian"));
    }
    @Transactional(readOnly = true)
    public List<ChildView> children(String email) {
        var parent = adult(email);
        return consents.findByGuardian_IdAndStatusOrderByCreatedAtDesc(parent.getId(), APPROVED).stream()
            .filter(c -> isMinor(c.getChild()))
            .map(c -> { var u = c.getChild(); return new ChildView(c.getId(), u.getId(), u.getFullName(), u.getUsername(),
                posts.countByUser_Id(u.getId()), events.countByUser_Id(u.getId()),
                applications.countByApplicant_Id(u.getId()), c.getDecidedAt(), controls(c)); }).toList();
    }
    @Transactional(readOnly = true)
    public ChildActivity activity(String email, Long consentId) {
        var parent = adult(email);
        var c = consents.findById(consentId).orElseThrow(() -> fail(NOT_FOUND, "Child link not found"));
        requireLink(parent, c);
        var id = c.getChild().getId(); var page = PageRequest.of(0, 20);
        return new ChildActivity(
            posts.findByUser_IdOrderByCreatedAtDesc(id, page).stream()
                .map(p -> new Activity(p.getId(), p.getCaption(), "POSTED", p.getCreatedAt())).toList(),
            events.findByUser_IdOrderByRegisteredAtDesc(id, page).stream()
                .map(e -> new Activity(e.getId(), e.getEvent().getTitle(), e.getStatus().name(), e.getRegisteredAt())).toList(),
            applications.findByApplicant_IdOrderByAppliedAtDesc(id, page).stream()
                .map(a -> new Activity(a.getId(), a.getOpportunity().getTitle(), a.getStatus(), a.getAppliedAt())).toList());
    }
    public void updateControls(String email, Long consentId, Controls settings) {
        var parent = adult(email);
        var c = consents.lockById(consentId).orElseThrow(() -> fail(NOT_FOUND, "Child link not found"));
        requireLink(parent, c);
        c.setAccessPaused(settings.accessPaused());
        c.setPostingAllowed(settings.postingAllowed());
        c.setEventsAllowed(settings.eventsAllowed());
        c.setApplicationsAllowed(settings.applicationsAllowed());
    }
    @Transactional(readOnly = true)
    public boolean actionAllowed(String email, String method, String path) {
        var user = current(email);
        if (!isMinor(user)) return true;
        var c = consents.findByChild_Id(user.getId()).orElse(null);
        if (c == null || c.getStatus() != APPROVED || c.isAccessPaused()) return false;
        if ("POST".equals(method) || "PUT".equals(method) || "PATCH".equals(method)) {
            if (path.matches("/api/posts(?:/.*)?") && !c.isPostingAllowed()) return false;
            if (path.matches("/api/events(?:/.*)?") && !c.isEventsAllowed()) return false;
            if (path.matches("/api/opportunities(?:/.*)?") && !c.isApplicationsAllowed()) return false;
        }
        return true;
    }
    public void revoke(String email, Long id) {
        var parent = adult(email);
        var c = consents.lockById(id).orElseThrow(() -> fail(NOT_FOUND, "Child link not found"));
        if (c.getStatus() == REVOKED && c.getGuardian() != null && parent.getId().equals(c.getGuardian().getId())) return;
        requireLink(parent, c);
        c.setStatus(REVOKED); c.setRevokedAt(Instant.now());
        notifications.save(new Notification(c.getChild().getEmail(), "Your guardian withdrew consent. Your account access is paused.", "guardian"));
    }
    private void requireLink(User parent, ParentAccountConsent c) {
        if (c.getGuardian() == null || !parent.getId().equals(c.getGuardian().getId()) || c.getStatus() != APPROVED || !isMinor(c.getChild()))
            throw fail(NOT_FOUND, "Child link not found");
    }
    private static ResponseStatusException fail(HttpStatus status, String message) { return new ResponseStatusException(status, message); }
}
