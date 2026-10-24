
package com.creative.collaboration.controller;

import com.creative.collaboration.repository.SuperAdminDailyLikesRepository;
import com.creative.collaboration.repository.SuperAdminDailyLikesRepository.DailyLikes;
import com.creative.collaboration.repository.SuperAdminDailyLikesRepository.TopLikedUser;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/superadmin/analytics/likes")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminDailyLikesController {

    private final SuperAdminDailyLikesRepository repository;

    public SuperAdminDailyLikesController(
            SuperAdminDailyLikesRepository repository
    ) {
        this.repository = repository;
    }

    public record DailyWinner(
            LocalDate date,
            Long userId,
            String username,
            String fullName,
            long likesReceived
    ) {}

    public record LikesAnalyticsResponse(
            int days,
            LocalDate startDate,
            LocalDate endDate,
            long totalLikesToday,
            long maximumLikesToday,
            TopLikedUser mostLikedUserToday,
            List<DailyLikes> dailyLikes,
            List<TopLikedUser> topUsersToday,
            List<DailyWinner> dailyWinners
    ) {}

    @GetMapping("/daily")
    public LikesAnalyticsResponse getDailyLikes(
            @RequestParam(defaultValue = "7") int days
    ) {

        // Restrict reporting period to 1-30 days
        int safeDays = Math.max(1, Math.min(days, 30));

        // Use the same timezone as your MySQL reporting queries.
        LocalDate today = LocalDate.now(
                ZoneId.systemDefault()
        );

        LocalDate startDate =
                today.minusDays(safeDays - 1L);

        // Get actual daily likes from MySQL
        List<DailyLikes> stored =
                repository.getDailyLikes(safeDays);

        Map<LocalDate, DailyLikes> dailyLookup =
                stored.stream().collect(
                        Collectors.toMap(
                                DailyLikes::date,
                                Function.identity(),
                                (first, second) -> first
                        )
                );

        // Include days with zero likes
        List<DailyLikes> dailyLikes =
                new ArrayList<>();

        for (int i = 0; i < safeDays; i++) {

            LocalDate date =
                    startDate.plusDays(i);

            DailyLikes matching =
                    dailyLookup.get(date);

            dailyLikes.add(
                    matching != null
                            ? matching
                            : new DailyLikes(date, 0L, 0L)
            );
        }

        // Top 10 users who received Likes today
        List<TopLikedUser> topUsers =
                repository.getTopLikedUsersToday();

        // Most liked user today
        TopLikedUser mostLikedUser =
                topUsers.isEmpty()
                        ? null
                        : topUsers.get(0);

        long maximumLikesToday =
                mostLikedUser == null
                        ? 0L
                        : mostLikedUser.likesReceived();

        long totalLikesToday =
                repository.getTotalLikesToday();

        return new LikesAnalyticsResponse(
                safeDays,
                startDate,
                today,
                totalLikesToday,
                maximumLikesToday,
                mostLikedUser,
                dailyLikes,
                topUsers,
                List.of()
        );
    }
}
