USE creative_collaboration_network;

-- USERS
SELECT
    user_id,
    email,
    account_type,
    account_status
FROM users;

-- PROFILES
SELECT
    p.profile_id,
    u.email,
    p.display_name,
    p.location,
    p.visibility
FROM profiles p
JOIN users u
    ON p.user_id = u.user_id;

-- ROLES
SELECT
    u.email,
    r.role_name
FROM user_roles ur
JOIN users u
    ON ur.user_id = u.user_id
JOIN roles r
    ON ur.role_id = r.role_id;

-- SKILLS
SELECT
    u.email,
    s.skill_name,
    us.proficiency_level
FROM user_skills us
JOIN users u
    ON us.user_id = u.user_id
JOIN skills s
    ON us.skill_id = s.skill_id;

-- MODULES
SELECT
    module_id,
    module_key,
    module_name,
    parent_module_id,
    is_active
FROM modules
ORDER BY module_id;

-- USER MODULE
SELECT
    u.email,
    m.module_name,
    um.is_enabled
FROM user_modules um
JOIN users u
    ON um.user_id = u.user_id
JOIN modules m
    ON um.module_id = m.module_id;

-- COLLABORATION
SELECT
    co.title,
    p.display_name AS created_by,
    co.role_required,
    co.status
FROM collaboration_opportunities co
JOIN profiles p
    ON co.created_by_user_id = p.user_id;

-- APPLICATION
SELECT
    co.title AS opportunity,
    p.display_name AS applicant,
    a.status
FROM applications a
JOIN collaboration_opportunities co
    ON a.opportunity_id = co.opportunity_id
JOIN profiles p
    ON a.applicant_user_id = p.user_id;

-- EVENT
SELECT
    e.title,
    p.display_name AS created_by,
    e.venue_name,
    e.city,
    e.status
FROM events e
JOIN profiles p
    ON e.created_by_user_id = p.user_id;

-- EVENT REGISTRATION
SELECT
    e.title AS event_name,
    p.display_name AS attendee,
    er.registration_status
FROM event_registrations er
JOIN events e
    ON er.event_id = e.event_id
JOIN profiles p
    ON er.user_id = p.user_id;