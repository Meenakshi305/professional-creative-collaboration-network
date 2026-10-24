
package com.creative.collaboration.repository;

import com.creative.collaboration.entity.UserSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserSettingsRepository
        extends JpaRepository<UserSettings, Long> {
}
