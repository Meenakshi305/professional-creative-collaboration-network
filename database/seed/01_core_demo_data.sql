-- A07 Professional Creative Collaboration Network
-- Simple demo data for testing the database
-- This data is only for development and presentation purposes

USE creative_collaboration_network;

-- ------------------------------------------------------------
-- 1. USERS
-- ------------------------------------------------------------

INSERT INTO users
(email, password_hash, account_type, date_of_birth, account_status, email_verified)
VALUES
('ravi.demo@example.com', 'demo_hash_ravi', 'PERSON', '1999-06-14', 'ACTIVE', TRUE),
('meena.demo@example.com', 'demo_hash_meena', 'PERSON', '2000-11-03', 'ACTIVE', TRUE),
('adelaide.creatives@example.com', 'demo_hash_org', 'ORGANISATION', NULL, 'ACTIVE', TRUE);

-- Store the IDs so we can use them in the related tables

SET @ravi_id = (
    SELECT user_id
    FROM users
    WHERE email = 'ravi.demo@example.com'
);

SET @meena_id = (
    SELECT user_id
    FROM users
    WHERE email = 'meena.demo@example.com'
);

SET @org_id = (
    SELECT user_id
    FROM users
    WHERE email = 'adelaide.creatives@example.com'
);

-- ------------------------------------------------------------
-- 2. ROLES
-- ------------------------------------------------------------

-- Ravi and Meena are creative professionals

INSERT INTO user_roles (user_id, role_id)
SELECT @ravi_id, role_id
FROM roles
WHERE role_name = 'CREATIVE_PROFESSIONAL';

INSERT INTO user_roles (user_id, role_id)
SELECT @meena_id, role_id
FROM roles
WHERE role_name = 'CREATIVE_PROFESSIONAL';

-- Adelaide Creatives is an organisation account

INSERT INTO user_roles (user_id, role_id)
SELECT @org_id, role_id
FROM roles
WHERE role_name = 'ORGANISATION';

-- ------------------------------------------------------------
-- 3. PROFILES
-- ------------------------------------------------------------

INSERT INTO profiles
(user_id, display_name, bio, location, website_url, visibility)
VALUES
(
    @ravi_id,
    'Ravi Kumar',
    'Graphic designer interested in posters, branding and community projects.',
    'Adelaide, SA',
    NULL,
    'PUBLIC'
),
(
    @meena_id,
    'Meena Sharma',
    'Photographer interested in local events and portrait photography.',
    'Adelaide, SA',
    NULL,
    'PUBLIC'
),
(
    @org_id,
    'Adelaide Creatives',
    'A local creative group that organises small events and community projects.',
    'Adelaide, SA',
    NULL,
    'PUBLIC'
);

-- ------------------------------------------------------------
-- 4. SKILLS
-- ------------------------------------------------------------

INSERT INTO skills (skill_name)
VALUES
('Graphic Design'),
('Photography'),
('Event Planning');

SET @graphic_skill = (
    SELECT skill_id
    FROM skills
    WHERE skill_name = 'Graphic Design'
);

SET @photo_skill = (
    SELECT skill_id
    FROM skills
    WHERE skill_name = 'Photography'
);

SET @event_skill = (
    SELECT skill_id
    FROM skills
    WHERE skill_name = 'Event Planning'
);

-- Link each user to a skill

INSERT INTO user_skills
(user_id, skill_id, proficiency_level)
VALUES
(@ravi_id, @graphic_skill, 'INTERMEDIATE'),
(@meena_id, @photo_skill, 'ADVANCED'),
(@org_id, @event_skill, 'INTERMEDIATE');

-- ------------------------------------------------------------
-- 5. MODULES
-- ------------------------------------------------------------

INSERT INTO modules
(module_key, module_name, description, is_active, display_order)
VALUES
('PROFILE', 'Profiles', 'User profile section', TRUE, 1),
('PORTFOLIO', 'Portfolio', 'Portfolio and work samples', TRUE, 2),
('COLLABORATION', 'Collaboration', 'Project opportunities and applications', TRUE, 3),
('EVENTS', 'Events', 'Creative events and registrations', TRUE, 4);

SET @portfolio_module = (
    SELECT module_id
    FROM modules
    WHERE module_key = 'PORTFOLIO'
);

-- Portfolio Comments is a submodule under Portfolio

INSERT INTO modules
(module_key, module_name, parent_module_id, description, is_active, display_order)
VALUES
(
    'PORTFOLIO_COMMENTS',
    'Portfolio Comments',
    @portfolio_module,
    'Allows comments on portfolio work',
    TRUE,
    1
);

SET @collab_module = (
    SELECT module_id
    FROM modules
    WHERE module_key = 'COLLABORATION'
);

-- Example user-level module setting

INSERT INTO user_modules
(user_id, module_id, is_enabled)
VALUES
(@ravi_id, @collab_module, TRUE);

-- ------------------------------------------------------------
-- 6. COLLABORATION OPPORTUNITY
-- ------------------------------------------------------------

INSERT INTO collaboration_opportunities
(
    created_by_user_id,
    title,
    description,
    role_required,
    requirements_text,
    category,
    location,
    status,
    closing_at
)
VALUES
(
    @org_id,
    'Poster Design for Local Arts Day',
    'We are looking for someone to help create a poster for a local arts event.',
    'Graphic Designer',
    'Basic design experience and an interest in community projects.',
    'Community Arts',
    'Adelaide, SA',
    'OPEN',
    DATE_ADD(NOW(), INTERVAL 20 DAY)
);

SET @opportunity_id = (
    SELECT opportunity_id
    FROM collaboration_opportunities
    WHERE title = 'Poster Design for Local Arts Day'
);

-- Ravi applies for the opportunity

INSERT INTO applications
(opportunity_id, applicant_user_id, cover_message, status)
VALUES
(
    @opportunity_id,
    @ravi_id,
    'I would like to help with the poster design. I have some experience with small design projects.',
    'PENDING'
);

-- ------------------------------------------------------------
-- 7. EVENT
-- ------------------------------------------------------------

INSERT INTO events
(
    created_by_user_id,
    title,
    description,
    event_type,
    category,
    venue_name,
    address_line,
    city,
    state,
    postcode,
    start_datetime,
    end_datetime,
    capacity,
    price,
    currency,
    status
)
VALUES
(
    @org_id,
    'Adelaide Creative Meetup',
    'A small meetup for local creative people to meet and share ideas.',
    'FREE',
    'Networking',
    'North Adelaide Community Centre',
    '176 Tynte Street',
    'North Adelaide',
    'SA',
    '5006',
    DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY) + INTERVAL 18 HOUR,
    DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY) + INTERVAL 20 HOUR,
    30,
    0.00,
    'AUD',
    'PUBLISHED'
);

SET @event_id = (
    SELECT event_id
    FROM events
    WHERE title = 'Adelaide Creative Meetup'
);

-- Meena registers for the event

INSERT INTO event_registrations
(event_id, user_id, registration_status)
VALUES
(@event_id, @meena_id, 'CONFIRMED');