-- A07 Professional Creative Collaboration Network
-- Final Database Schema Design 


DROP DATABASE IF EXISTS creative_collaboration_network;

CREATE DATABASE creative_collaboration_network
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
USE creative_collaboration_network;

CREATE TABLE users (
  user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  account_type VARCHAR(30) NOT NULL,
  date_of_birth DATE NULL,
  account_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_users_account_type CHECK (account_type IN ('PERSON','ORGANISATION')),
  CONSTRAINT chk_users_dob_by_type CHECK (
    (account_type='PERSON' AND date_of_birth IS NOT NULL) OR
    (account_type='ORGANISATION' AND date_of_birth IS NULL)
  ),
  CONSTRAINT chk_users_status CHECK (account_status IN ('PENDING','ACTIVE','SUSPENDED','DEACTIVATED'))
) ENGINE=InnoDB;

CREATE TABLE roles (
  role_id SMALLINT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) NULL
) ENGINE=InnoDB;

CREATE TABLE user_roles (
  user_role_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  role_id SMALLINT NOT NULL,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_user_roles UNIQUE (user_id, role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE RESTRICT
) ENGINE=InnoDB;


CREATE TABLE modules (
  module_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  module_key VARCHAR(100) NOT NULL UNIQUE,
  module_name VARCHAR(150) NOT NULL,
  parent_module_id BIGINT NULL,
  description VARCHAR(500) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_modules_display_order CHECK (display_order >= 0),
  CONSTRAINT fk_modules_parent FOREIGN KEY (parent_module_id) REFERENCES modules(module_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE user_modules (
  user_module_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  module_id BIGINT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  enabled_from DATETIME NULL,
  enabled_until DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_user_modules UNIQUE (user_id, module_id),
  CONSTRAINT chk_user_modules_dates CHECK (
    enabled_from IS NULL OR enabled_until IS NULL OR enabled_until > enabled_from
  ),
  CONSTRAINT fk_user_modules_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_user_modules_module FOREIGN KEY (module_id) REFERENCES modules(module_id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT IGNORE INTO roles (role_name, description) VALUES
('CREATIVE_PROFESSIONAL','Creative professional member'),
('ORGANISATION','Creative organisation or event provider'),
('GUARDIAN','Parent or guardian role'),
('ADMIN','Platform administrator');

CREATE TABLE guardian_consents (
  consent_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  minor_user_id BIGINT NOT NULL,
  guardian_user_id BIGINT NULL,
  guardian_email VARCHAR(255) NOT NULL,
  relationship_type VARCHAR(50) NULL,
  consent_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME NULL,
  revoked_at DATETIME NULL,
  CONSTRAINT chk_guardian_consent_status CHECK (consent_status IN ('PENDING','APPROVED','REJECTED','REVOKED')),
  CONSTRAINT fk_guardian_minor FOREIGN KEY (minor_user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
  CONSTRAINT fk_guardian_user FOREIGN KEY (guardian_user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE profiles (
  profile_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,
  display_name VARCHAR(150) NOT NULL,
  bio TEXT NULL,
  location VARCHAR(255) NULL,
  website_url VARCHAR(500) NULL,
  profile_image_url VARCHAR(500) NULL,
  visibility VARCHAR(30) NOT NULL DEFAULT 'PUBLIC',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_profiles_visibility CHECK (visibility IN ('PUBLIC','MEMBERS_ONLY','PRIVATE')),
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE skills (
  skill_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  skill_name VARCHAR(100) NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE user_skills (
  user_skill_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  skill_id BIGINT NOT NULL,
  proficiency_level VARCHAR(30) NULL,
  CONSTRAINT uq_user_skills UNIQUE (user_id, skill_id),
  CONSTRAINT fk_user_skills_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_user_skills_skill FOREIGN KEY (skill_id) REFERENCES skills(skill_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE achievements (
  achievement_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  achievement_date DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_achievements_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE portfolio_items (
  portfolio_item_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  visibility VARCHAR(30) NOT NULL DEFAULT 'PUBLIC',
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_portfolio_visibility CHECK (visibility IN ('PUBLIC','MEMBERS_ONLY','PRIVATE')),
  CONSTRAINT chk_portfolio_status CHECK (status IN ('ACTIVE','REMOVED')),
  CONSTRAINT fk_portfolio_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE portfolio_media (
  media_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  portfolio_item_id BIGINT NOT NULL,
  media_url VARCHAR(500) NOT NULL,
  media_type VARCHAR(30) NOT NULL,
  mime_type VARCHAR(100) NULL,
  file_size_bytes BIGINT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_media_type CHECK (media_type = 'IMAGE'),
  CONSTRAINT chk_media_file_size CHECK (file_size_bytes >= 0),
  CONSTRAINT chk_media_display_order CHECK (display_order >= 0),
  CONSTRAINT fk_media_portfolio FOREIGN KEY (portfolio_item_id) REFERENCES portfolio_items(portfolio_item_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE portfolio_comments (
  comment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  portfolio_item_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  comment_text TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_portfolio_comment_status CHECK (status IN ('ACTIVE','REMOVED')),
  CONSTRAINT fk_portfolio_comments_item FOREIGN KEY (portfolio_item_id) REFERENCES portfolio_items(portfolio_item_id) ON DELETE CASCADE,
  CONSTRAINT fk_portfolio_comments_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE posts (
  post_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  content TEXT NOT NULL,
  visibility VARCHAR(30) NOT NULL DEFAULT 'PUBLIC',
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_posts_visibility CHECK (visibility IN ('PUBLIC','MEMBERS_ONLY','PRIVATE')),
  CONSTRAINT chk_posts_status CHECK (status IN ('ACTIVE','REMOVED')),
  CONSTRAINT fk_posts_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE post_reactions (
  reaction_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  reaction_type VARCHAR(30) NOT NULL DEFAULT 'LIKE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_post_reaction UNIQUE (post_id, user_id),
  CONSTRAINT fk_reaction_post FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
  CONSTRAINT fk_reaction_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE follows (
  follow_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  follower_user_id BIGINT NOT NULL,
  followed_user_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_follows UNIQUE (follower_user_id, followed_user_id),
  CONSTRAINT chk_no_self_follow CHECK (follower_user_id <> followed_user_id),
  CONSTRAINT fk_follows_follower FOREIGN KEY (follower_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_follows_followed FOREIGN KEY (followed_user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE collaboration_opportunities (
  opportunity_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  created_by_user_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  role_required VARCHAR(150) NULL,
  requirements_text TEXT NULL,
  category VARCHAR(100) NULL,
  location VARCHAR(255) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  closing_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_opportunity_status CHECK (status IN ('OPEN','CLOSED','CANCELLED','COMPLETED','REMOVED')),
  CONSTRAINT chk_opportunity_closing CHECK (closing_at IS NULL OR closing_at > created_at),
  CONSTRAINT fk_opportunity_creator FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE opportunity_skills (
  opportunity_skill_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  opportunity_id BIGINT NOT NULL,
  skill_id BIGINT NOT NULL,
  CONSTRAINT uq_opportunity_skill UNIQUE (opportunity_id, skill_id),
  CONSTRAINT fk_opportunity_skill_opp FOREIGN KEY (opportunity_id) REFERENCES collaboration_opportunities(opportunity_id) ON DELETE CASCADE,
  CONSTRAINT fk_opportunity_skill_skill FOREIGN KEY (skill_id) REFERENCES skills(skill_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE applications (
  application_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  opportunity_id BIGINT NOT NULL,
  applicant_user_id BIGINT NOT NULL,
  cover_message TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_application UNIQUE (opportunity_id, applicant_user_id),
  CONSTRAINT chk_application_status CHECK (status IN ('PENDING','ACCEPTED','REJECTED','WITHDRAWN')),
  CONSTRAINT fk_application_opportunity FOREIGN KEY (opportunity_id) REFERENCES collaboration_opportunities(opportunity_id) ON DELETE RESTRICT,
  CONSTRAINT fk_application_user FOREIGN KEY (applicant_user_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE project_teams (
  team_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  opportunity_id BIGINT NULL,
  created_by_user_id BIGINT NOT NULL,
  team_name VARCHAR(200) NOT NULL,
  description TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_team_status CHECK (status IN ('ACTIVE','COMPLETED','ARCHIVED')),
  CONSTRAINT fk_team_opportunity FOREIGN KEY (opportunity_id) REFERENCES collaboration_opportunities(opportunity_id) ON DELETE SET NULL,
  CONSTRAINT fk_team_creator FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE team_members (
  team_member_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  team_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  team_role VARCHAR(100) NULL,
  membership_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_team_member UNIQUE (team_id, user_id),
  CONSTRAINT chk_team_membership_status CHECK (membership_status IN ('ACTIVE','LEFT','REMOVED')),
  CONSTRAINT fk_team_member_team FOREIGN KEY (team_id) REFERENCES project_teams(team_id) ON DELETE CASCADE,
  CONSTRAINT fk_team_member_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE events (
  event_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  created_by_user_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  event_type VARCHAR(10) NOT NULL,
  category VARCHAR(100) NULL,
  venue_name VARCHAR(200) NULL,
  address_line VARCHAR(255) NULL,
  city VARCHAR(100) NULL,
  state VARCHAR(100) NULL,
  postcode VARCHAR(20) NULL,
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NOT NULL,
  capacity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency CHAR(3) NOT NULL DEFAULT 'AUD',
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_event_type CHECK (event_type IN ('FREE','PAID')),
  CONSTRAINT chk_event_status CHECK (status IN ('DRAFT','PUBLISHED','CANCELLED','COMPLETED','REMOVED')),
  CONSTRAINT chk_event_dates CHECK (end_datetime > start_datetime),
  CONSTRAINT chk_event_capacity CHECK (capacity > 0),
  CONSTRAINT chk_event_price CHECK (price >= 0),
  CONSTRAINT chk_event_type_price CHECK ((event_type='FREE' AND price=0) OR (event_type='PAID' AND price>0)),
  CONSTRAINT fk_event_creator FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE event_registrations (
  registration_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  registration_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_event_registration UNIQUE (event_id, user_id),
  CONSTRAINT chk_registration_status CHECK (registration_status IN ('PENDING','CONFIRMED','CANCELLED')),
  CONSTRAINT fk_registration_event FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE RESTRICT,
  CONSTRAINT fk_registration_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE payments (
  payment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  registration_id BIGINT NOT NULL,
  stripe_payment_intent_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_charge_id VARCHAR(255) NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'AUD',
  payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  succeeded_at DATETIME NULL,
  CONSTRAINT chk_payment_amount CHECK (amount > 0),
  CONSTRAINT chk_payment_status CHECK (payment_status IN ('PENDING','SUCCEEDED','FAILED','REFUNDED','CANCELLED')),
  CONSTRAINT fk_payment_registration FOREIGN KEY (registration_id) REFERENCES event_registrations(registration_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE payment_webhook_events (
  webhook_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  stripe_event_id VARCHAR(255) NOT NULL UNIQUE,
  payment_id BIGINT NULL,
  event_type VARCHAR(100) NOT NULL,
  processing_status VARCHAR(20) NOT NULL DEFAULT 'RECEIVED',
  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME NULL,
  error_message VARCHAR(500) NULL,
  CONSTRAINT chk_webhook_status CHECK (processing_status IN ('RECEIVED','PROCESSED','FAILED')),
  CONSTRAINT fk_webhook_payment FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE reports (
  report_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  reported_by_user_id BIGINT NOT NULL,
  reported_user_id BIGINT NULL,
  post_id BIGINT NULL,
  portfolio_item_id BIGINT NULL,
  portfolio_comment_id BIGINT NULL,
  opportunity_id BIGINT NULL,
  event_id BIGINT NULL,
  reason_code VARCHAR(50) NOT NULL,
  description TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME NULL,
  resolved_by_user_id BIGINT NULL,
  resolution_notes TEXT NULL,
  CONSTRAINT chk_report_status CHECK (status IN ('OPEN','UNDER_REVIEW','RESOLVED','DISMISSED')),
  CONSTRAINT chk_report_exactly_one_target CHECK (
    (reported_user_id IS NOT NULL) + (post_id IS NOT NULL) + (portfolio_item_id IS NOT NULL) +
    (portfolio_comment_id IS NOT NULL) + (opportunity_id IS NOT NULL) + (event_id IS NOT NULL) = 1
  ),
  CONSTRAINT fk_reporter FOREIGN KEY (reported_by_user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
  CONSTRAINT fk_report_user_target FOREIGN KEY (reported_user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
  CONSTRAINT fk_report_post_target FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE RESTRICT,
  CONSTRAINT fk_report_portfolio_target FOREIGN KEY (portfolio_item_id) REFERENCES portfolio_items(portfolio_item_id) ON DELETE RESTRICT,
  CONSTRAINT fk_report_portfolio_comment_target FOREIGN KEY (portfolio_comment_id) REFERENCES portfolio_comments(comment_id) ON DELETE RESTRICT,
  CONSTRAINT fk_report_opportunity_target FOREIGN KEY (opportunity_id) REFERENCES collaboration_opportunities(opportunity_id) ON DELETE RESTRICT,
  CONSTRAINT fk_report_event_target FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE RESTRICT,
  CONSTRAINT fk_report_resolver FOREIGN KEY (resolved_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
  audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  admin_user_id BIGINT NULL,
  action_type VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id BIGINT NOT NULL,
  details TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_admin FOREIGN KEY (admin_user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Initial production/prototype indexes based on expected search/filter/join patterns. Review again after query profiling.
CREATE INDEX idx_modules_parent_active ON modules(parent_module_id, is_active);
CREATE INDEX idx_user_modules_user_enabled ON user_modules(user_id, is_enabled);
CREATE INDEX idx_user_modules_module ON user_modules(module_id);

CREATE INDEX idx_profiles_display_name ON profiles(display_name);
CREATE INDEX idx_profiles_location ON profiles(location);
CREATE INDEX idx_user_skills_skill ON user_skills(skill_id);
CREATE INDEX idx_portfolio_user_status ON portfolio_items(user_id, status);
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at);
CREATE INDEX idx_posts_status_created ON posts(status, created_at);
CREATE INDEX idx_follows_followed ON follows(followed_user_id);
CREATE INDEX idx_opportunities_status_category ON collaboration_opportunities(status, category);
CREATE INDEX idx_opportunities_location ON collaboration_opportunities(location);
CREATE INDEX idx_opportunities_closing ON collaboration_opportunities(closing_at);
CREATE INDEX idx_opportunity_skills_skill ON opportunity_skills(skill_id);
CREATE INDEX idx_applications_opportunity_status ON applications(opportunity_id, status);
CREATE INDEX idx_applications_user ON applications(applicant_user_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_events_status_start ON events(status, start_datetime);
CREATE INDEX idx_events_city ON events(city);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_registrations_event_status ON event_registrations(event_id, registration_status);
CREATE INDEX idx_registrations_user ON event_registrations(user_id);
CREATE INDEX idx_payments_registration ON payments(registration_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_webhooks_status_received ON payment_webhook_events(processing_status, received_at);
CREATE INDEX idx_reports_status_created ON reports(status, created_at);
CREATE INDEX idx_reports_portfolio_comment ON reports(portfolio_comment_id);
CREATE INDEX idx_reports_reporter ON reports(reported_by_user_id);
CREATE INDEX idx_audit_admin_created ON audit_logs(admin_user_id, created_at);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
