package com.creative.collaboration.service;

import com.creative.collaboration.repository.SuperAdminPostMonitoringRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SuperAdminPostMonitoringService {
    private final SuperAdminPostMonitoringRepository repository;

    public SuperAdminPostMonitoringService(SuperAdminPostMonitoringRepository repository) {
        this.repository = repository;
    }

    public record DailyPoint(LocalDate date, long posts, long activeUsers, long maxPostsPerUser) {}
    public record PostingUser(long userId, String username, long posts) {}
    public record DailyMaximum(LocalDate date, long userId, String username, long posts) {}
    public record Summary(int days, String timezone, LocalDate from, LocalDate through,
                          long totalPosts, long uniquePosters, long postsToday,
                          long activePostersToday, DailyMaximum maximumSingleDay,
                          PostingUser mostActiveUser, List<DailyPoint> daily,
                          List<PostingUser> topUsers) {}

    /** The inclusive window contains today and the previous days-1 calendar days. */
    @Transactional(readOnly = true)
    public Summary monitor(int days) {
        if (days != 7) throw new IllegalArgumentException("Only 7 days is currently supported");
        ZoneId zone = ZoneId.systemDefault();
        LocalDate today = LocalDate.now(zone);
        LocalDate from = today.minusDays(days - 1L);
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();
        List<Object[]> rows = repository.findPostActivity(start, end);

        record UserKey(long id, String username) {}
        Map<LocalDate, Map<UserKey, Long>> perDay = new HashMap<>();
        Map<UserKey, Long> totals = new HashMap<>();
        for (Object[] row : rows) {
            if (row[0] == null || row[2] == null) continue;
            long id = ((Number) row[0]).longValue();
            String username = row[1] == null ? "user-" + id : (String) row[1];
            LocalDate date = ((LocalDateTime) row[2]).toLocalDate();
            UserKey user = new UserKey(id, username);
            perDay.computeIfAbsent(date, ignored -> new HashMap<>()).merge(user, 1L, Long::sum);
            totals.merge(user, 1L, Long::sum);
        }

        List<DailyPoint> daily = new ArrayList<>();
        DailyMaximum maximum = null;
        for (int i = 0; i < days; i++) {
            LocalDate date = from.plusDays(i);
            Map<UserKey, Long> counts = perDay.getOrDefault(date, Map.of());
            long posts = counts.values().stream().mapToLong(Long::longValue).sum();
            long max = counts.values().stream().mapToLong(Long::longValue).max().orElse(0);
            daily.add(new DailyPoint(date, posts, counts.size(), max));
            for (var entry : counts.entrySet()) {
                DailyMaximum candidate = new DailyMaximum(date, entry.getKey().id(), entry.getKey().username(), entry.getValue());
                if (maximum == null || candidate.posts() > maximum.posts()
                        || (candidate.posts() == maximum.posts() && candidate.date().isBefore(maximum.date()))
                        || (candidate.posts() == maximum.posts() && candidate.date().equals(maximum.date())
                        && candidate.userId() < maximum.userId())) maximum = candidate;
            }
        }
        List<PostingUser> ranking = totals.entrySet().stream()
                .map(e -> new PostingUser(e.getKey().id(), e.getKey().username(), e.getValue()))
                .sorted(Comparator.comparingLong(PostingUser::posts).reversed()
                        .thenComparing(PostingUser::username).thenComparingLong(PostingUser::userId))
                .toList();
        DailyPoint todayPoint = daily.get(daily.size() - 1);
        return new Summary(days, zone.getId(), from, today,
                rows.size(), totals.size(), todayPoint.posts(), todayPoint.activeUsers(),
                maximum, ranking.isEmpty() ? null : ranking.get(0), daily,
                ranking.stream().limit(10).collect(Collectors.toList()));
    }
}
