-- A07 Professional Creative Collaboration Network
-- Module self-parent protection triggers
-- Prevents a module from using itself as its parent

USE creative_collaboration_network;

DROP TRIGGER IF EXISTS trg_modules_no_self_parent_insert;
DROP TRIGGER IF EXISTS trg_modules_no_self_parent_update;

DELIMITER $$

CREATE TRIGGER trg_modules_no_self_parent_insert
BEFORE INSERT ON modules
FOR EACH ROW
BEGIN
    IF NEW.module_id IS NOT NULL
       AND NEW.module_id <> 0
       AND NEW.parent_module_id = NEW.module_id THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'A module cannot be its own parent';

    END IF;
END$$


CREATE TRIGGER trg_modules_no_self_parent_update
BEFORE UPDATE ON modules
FOR EACH ROW
BEGIN
    IF NEW.parent_module_id = NEW.module_id THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'A module cannot be its own parent';

    END IF;
END$$

DELIMITER ;