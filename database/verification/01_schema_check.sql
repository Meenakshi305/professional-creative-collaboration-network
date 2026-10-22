USE creative_collaboration_network;

SHOW TABLES;

SELECT COUNT(*) AS total_tables
FROM information_schema.tables
WHERE table_schema = 'creative_collaboration_network';