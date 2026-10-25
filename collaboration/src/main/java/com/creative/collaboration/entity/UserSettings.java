
package com.creative.collaboration.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "user_settings")
public class UserSettings {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(
            name = "email_notifications",
            nullable = false
    )
    private boolean emailNotifications = true;

    @Column(
            name = "event_notifications",
            nullable = false
    )
    private boolean eventNotifications = true;

    @Column(
            name = "profile_visibility",
            nullable = false,
            length = 20
    )
    private String profileVisibility = "public";

    @Column(
            name = "theme",
            nullable = false,
            length = 20
    )
    private String theme = "light";

    public UserSettings() {
    }

    public UserSettings(Long userId) {
        this.userId = userId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public boolean isEmailNotifications() {
        return emailNotifications;
    }

    public void setEmailNotifications(boolean emailNotifications) {
        this.emailNotifications = emailNotifications;
    }

    public boolean isEventNotifications() {
        return eventNotifications;
    }

    public void setEventNotifications(boolean eventNotifications) {
        this.eventNotifications = eventNotifications;
    }

    public String getProfileVisibility() {
        return profileVisibility;
    }

    public void setProfileVisibility(String profileVisibility) {
        this.profileVisibility = profileVisibility;
    }

    public String getTheme() {
        return theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }
}
