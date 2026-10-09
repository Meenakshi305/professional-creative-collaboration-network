USE creative_collaboration_network;

-- ------------------------------------------------------------
-- 1. PORTFOLIO ITEM
-- ------------------------------------------------------------

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

INSERT INTO portfolio_items
(user_id, title, description, visibility, status)
VALUES
(
    @ravi_id,
    'Community Arts Poster',
    'A poster concept created for a local community arts event.',
    'PUBLIC',
    'ACTIVE'
);

SET @portfolio_id = (
    SELECT portfolio_item_id
    FROM portfolio_items
    WHERE user_id = @ravi_id
      AND title = 'Community Arts Poster'
    ORDER BY portfolio_item_id DESC
    LIMIT 1
);

-- ------------------------------------------------------------
-- 2. PORTFOLIO MEDIA
-- ------------------------------------------------------------

INSERT INTO portfolio_media
(
    portfolio_item_id,
    media_url,
    media_type,
    mime_type,
    file_size_bytes,
    display_order
)
VALUES
(
    @portfolio_id,
    '/demo/portfolio/community-arts-poster.jpg',
    'IMAGE',
    'image/jpeg',
    245000,
    1
);

-- ------------------------------------------------------------
-- 3. PORTFOLIO COMMENT
-- ------------------------------------------------------------

INSERT INTO portfolio_comments
(portfolio_item_id, user_id, comment_text, status)
VALUES
(
    @portfolio_id,
    @meena_id,
    'The layout looks clear and the colours suit the event well.',
    'ACTIVE'
);

-- ------------------------------------------------------------
-- 4. POST
-- ------------------------------------------------------------

INSERT INTO posts
(user_id, content, visibility, status)
VALUES
(
    @ravi_id,
    'I have been working on a poster idea for a local arts event. It was a good chance to try a different layout.',
    'PUBLIC',
    'ACTIVE'
);

SET @post_id = (
    SELECT post_id
    FROM posts
    WHERE user_id = @ravi_id
    ORDER BY post_id DESC
    LIMIT 1
);

-- ------------------------------------------------------------
-- 5. POST REACTION
-- ------------------------------------------------------------

INSERT INTO post_reactions
(post_id, user_id, reaction_type)
VALUES
(
    @post_id,
    @meena_id,
    'LIKE'
);