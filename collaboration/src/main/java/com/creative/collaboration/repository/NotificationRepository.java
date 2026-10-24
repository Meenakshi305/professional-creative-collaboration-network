package com.creative.collaboration.repository;

import com.creative.collaboration.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    List<Notification>
    findByRecipientAndDismissedFalseOrderByCreatedAtDescIdDesc(
            String recipient
    );

    Optional<Notification> findByIdAndRecipient(
            Long id,
            String recipient
    );
}