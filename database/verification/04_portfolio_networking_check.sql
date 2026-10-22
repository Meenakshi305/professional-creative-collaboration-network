USE creative_collaboration_network;

-- Portfolio
SELECT
    p.display_name AS owner,
    pi.title,
    pi.description,
    pi.visibility,
    pi.status
FROM portfolio_items pi
JOIN profiles p
    ON pi.user_id = p.user_id;

-- Portfolio media
SELECT
    pi.title,
    pm.media_url,
    pm.media_type,
    pm.mime_type,
    pm.file_size_bytes
FROM portfolio_media pm
JOIN portfolio_items pi
    ON pm.portfolio_item_id = pi.portfolio_item_id;

-- Portfolio comments
SELECT
    pi.title,
    p.display_name AS commented_by,
    pc.comment_text,
    pc.status
FROM portfolio_comments pc
JOIN portfolio_items pi
    ON pc.portfolio_item_id = pi.portfolio_item_id
JOIN profiles p
    ON pc.user_id = p.user_id;

-- Posts
SELECT
    p.display_name,
    po.content,
    po.visibility,
    po.status
FROM posts po
JOIN profiles p
    ON po.user_id = p.user_id;

-- Post reactions
SELECT
    owner.display_name AS post_owner,
    reactor.display_name AS reacted_by,
    pr.reaction_type
FROM post_reactions pr
JOIN posts po
    ON pr.post_id = po.post_id
JOIN profiles owner
    ON po.user_id = owner.user_id
JOIN profiles reactor
    ON pr.user_id = reactor.user_id;