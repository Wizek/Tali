SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL';

DROP SCHEMA IF EXISTS `tali` ;
CREATE SCHEMA IF NOT EXISTS `tali` DEFAULT CHARACTER SET utf8 COLLATE utf8_hungarian_ci ;
USE `tali` ;

-- -----------------------------------------------------
-- Table `tali`.`tali_user`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tali`.`tali_user` ;

CREATE  TABLE IF NOT EXISTS `tali`.`tali_user` (
  `id` INT UNSIGNED NOT NULL ,
  `username` VARCHAR(32) NULL ,
  `email` VARCHAR(64) NULL ,
  `password_type` VARCHAR(4) NOT NULL ,
  `password` VARCHAR(40) NULL ,
  `updated_at` DATETIME NULL ,
  `created_at` DATETIME NOT NULL ,
  `session_id` VARCHAR(68) NULL ,
  PRIMARY KEY (`id`) )
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `tali`.`tali_node`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tali`.`tali_node` ;

CREATE  TABLE IF NOT EXISTS `tali`.`tali_node` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT ,
  `headline` VARCHAR(256) NOT NULL ,
  `body` TEXT NULL ,
  `updated_at` DATETIME NOT NULL ,
  `created_at` DATETIME NOT NULL ,
  PRIMARY KEY (`id`) )
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `tali`.`tali_node_hierarchy`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tali`.`tali_node_hierarchy` ;

CREATE  TABLE IF NOT EXISTS `tali`.`tali_node_hierarchy` (
  `parent_id` INT UNSIGNED NOT NULL ,
  `child_id` INT UNSIGNED NOT NULL ,
  `position` INT UNSIGNED NOT NULL ,
  INDEX `fk_tali_node_hierarchy_parent` (`parent_id` ASC) ,
  INDEX `fk_tali_node_hierarchy_child` (`child_id` ASC) ,
  CONSTRAINT `fk_tali_node_hierarchy_parent`
    FOREIGN KEY (`parent_id` )
    REFERENCES `tali`.`tali_node` (`id` )
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_tali_node_hierarchy_child`
    FOREIGN KEY (`child_id` )
    REFERENCES `tali`.`tali_node` (`id` )
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `tali`.`tali_node_update`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tali`.`tali_node_update` ;

CREATE  TABLE IF NOT EXISTS `tali`.`tali_node_update` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT ,
  `node_id` INT UNSIGNED NOT NULL ,
  `user_id` INT UNSIGNED NULL ,
  `created_at` DATETIME NOT NULL ,
  PRIMARY KEY (`id`) ,
  INDEX `fk_tali_node_update_1` (`node_id` ASC) ,
  INDEX `fk_tali_node_update_2` (`user_id` ASC) ,
  CONSTRAINT `fk_tali_node_update_1`
    FOREIGN KEY (`node_id` )
    REFERENCES `tali`.`tali_node` (`id` )
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_tali_node_update_2`
    FOREIGN KEY (`user_id` )
    REFERENCES `tali`.`tali_user` (`id` )
    ON DELETE NO ACTION
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `tali`.`tali_tag`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tali`.`tali_tag` ;

CREATE  TABLE IF NOT EXISTS `tali`.`tali_tag` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT ,
  `title` VARCHAR(64) NULL ,
  PRIMARY KEY (`id`) )
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `tali`.`tali_node_tag`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tali`.`tali_node_tag` ;

CREATE  TABLE IF NOT EXISTS `tali`.`tali_node_tag` (
  `tag_id` INT UNSIGNED NOT NULL ,
  `node_id` INT UNSIGNED NOT NULL ,
  `creator_id` INT UNSIGNED NOT NULL ,
  `updated_at` DATETIME NOT NULL ,
  `created_at` DATETIME NOT NULL ,
  INDEX `fk_tali_node_tag_node` (`node_id` ASC) ,
  INDEX `fk_tali_node_tag_tag` (`tag_id` ASC) ,
  INDEX `fk_tali_node_tag_user` (`creator_id` ASC) ,
  CONSTRAINT `fk_tali_node_tag_node`
    FOREIGN KEY (`node_id` )
    REFERENCES `tali`.`tali_node` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_tali_node_tag_tag`
    FOREIGN KEY (`tag_id` )
    REFERENCES `tali`.`tali_tag` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_tali_node_tag_user`
    FOREIGN KEY (`creator_id` )
    REFERENCES `tali`.`tali_user` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;



SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

-- -----------------------------------------------------
-- Data for table `tali`.`tali_user`
-- -----------------------------------------------------
START TRANSACTION;
USE `tali`;
INSERT INTO `tali`.`tali_user` (`id`, `username`, `email`, `password_type`, `password`, `updated_at`, `created_at`, `session_id`) VALUES (2, 'Fodi69', 'fodor0205@gmail.com', 'text', 'mypass', now(), now(), NULL);
INSERT INTO `tali`.`tali_user` (`id`, `username`, `email`, `password_type`, `password`, `updated_at`, `created_at`, `session_id`) VALUES (1, 'Wizek', '123.wizek@gmail.com', 'text', '1234', now(), now(), NULL);

COMMIT;

-- -----------------------------------------------------
-- Data for table `tali`.`tali_node`
-- -----------------------------------------------------
START TRANSACTION;
USE `tali`;
INSERT INTO `tali`.`tali_node` (`id`, `headline`, `body`, `updated_at`, `created_at`) VALUES (1, '#1 - First level test node', '1', now(), now());
INSERT INTO `tali`.`tali_node` (`id`, `headline`, `body`, `updated_at`, `created_at`) VALUES (2, '#2 - Child of 1', '2', now(), now());
INSERT INTO `tali`.`tali_node` (`id`, `headline`, `body`, `updated_at`, `created_at`) VALUES (3, '#3 - Child of 1 and 2', '3', now(), now());
INSERT INTO `tali`.`tali_node` (`id`, `headline`, `body`, `updated_at`, `created_at`) VALUES (0, 'GLOBAL - invisible', NULL, now(), now());

COMMIT;

-- -----------------------------------------------------
-- Data for table `tali`.`tali_node_hierarchy`
-- -----------------------------------------------------
START TRANSACTION;
USE `tali`;
INSERT INTO `tali`.`tali_node_hierarchy` (`parent_id`, `child_id`, `position`) VALUES (1, 3, 0);
INSERT INTO `tali`.`tali_node_hierarchy` (`parent_id`, `child_id`, `position`) VALUES (1, 2, 4194304);
INSERT INTO `tali`.`tali_node_hierarchy` (`parent_id`, `child_id`, `position`) VALUES (0, 1, 0);

COMMIT;

-- -----------------------------------------------------
-- Data for table `tali`.`tali_node_update`
-- -----------------------------------------------------
START TRANSACTION;
USE `tali`;
INSERT INTO `tali`.`tali_node_update` (`id`, `node_id`, `user_id`, `created_at`) VALUES (1, 3, 1, now());

COMMIT;

-- -----------------------------------------------------
-- Data for table `tali`.`tali_tag`
-- -----------------------------------------------------
START TRANSACTION;
USE `tali`;
INSERT INTO `tali`.`tali_tag` (`id`, `title`) VALUES (1, 'Category 1');
INSERT INTO `tali`.`tali_tag` (`id`, `title`) VALUES (2, 'Category 2');
INSERT INTO `tali`.`tali_tag` (`id`, `title`) VALUES (3, 'Category 3');

COMMIT;

-- -----------------------------------------------------
-- Data for table `tali`.`tali_node_tag`
-- -----------------------------------------------------
START TRANSACTION;
USE `tali`;
INSERT INTO `tali`.`tali_node_tag` (`tag_id`, `node_id`, `creator_id`, `updated_at`, `created_at`) VALUES (2, 2, 2, now(), now());
INSERT INTO `tali`.`tali_node_tag` (`tag_id`, `node_id`, `creator_id`, `updated_at`, `created_at`) VALUES (3, 1, 1, now(), now());
INSERT INTO `tali`.`tali_node_tag` (`tag_id`, `node_id`, `creator_id`, `updated_at`, `created_at`) VALUES (1, 1, 2, now(), now());

COMMIT;
