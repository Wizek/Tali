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
  `password` CHAR(64) NULL ,
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
  `id` INT UNSIGNED NOT NULL ,
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
  `position` MEDIUMINT NOT NULL ,
  INDEX `fk_tali_node_hiererchyt_1` (`child_id` ASC) ,
  INDEX `fk_tali_node_hiererchy_2` (`parent_id` ASC) ,
  CONSTRAINT `fk_tali_node_hiererchyt_1`
    FOREIGN KEY (`child_id` )
    REFERENCES `tali`.`tali_node` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_tali_node_hiererchy_2`
    FOREIGN KEY (`parent_id` )
    REFERENCES `tali`.`tali_node` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
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
    ON DELETE SET NULL
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
  INDEX `fk_tali_node_tag_1` (`node_id` ASC) ,
  INDEX `fk_tali_node_tag_2` (`tag_id` ASC) ,
  INDEX `fk_tali_node_tag_3` (`creator_id` ASC) ,
  CONSTRAINT `fk_tali_node_tag_1`
    FOREIGN KEY (`node_id` )
    REFERENCES `tali`.`tali_node` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_tali_node_tag_2`
    FOREIGN KEY (`tag_id` )
    REFERENCES `tali`.`tali_tag` (`id` )
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_tali_node_tag_3`
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
INSERT INTO `tali`.`tali_node` (`id`, `headline`, `body`, `updated_at`, `created_at`) VALUES (1, '#1 - First level test node', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas sit amet tincidunt elit. Morbi diam dui, elementum quis cursus quis, molestie at odio. Sed eros tellus, consequat scelerisque adipiscing vel, vestibulum tincidunt felis. Sed sit amet erat eget diam imperdiet posuere. Proin et nibh mi. Pellentesque viverra posuere commodo. Vivamus placerat mi magna. Cras aliquet dignissim tempor. Curabitur aliquet interdum eros, eget fringilla mauris iaculis et. Aenean interdum diam ut eros gravida tristique. Aliquam orci libero, tempor quis volutpat et, pharetra adipiscing enim. Vivamus a mauris mauris, vel ultrices nibh. Donec accumsan sodales nunc. Aliquam sed ante sit amet lorem aliquet vulputate accumsan in ante. Curabitur vitae dolor et orci pulvinar tristique. Vivamus vulputate eleifend orci nec mattis. Donec convallis pharetra risus at iaculis. Mauris id libero vel lacus suscipit lacinia. ', now(), now());
INSERT INTO `tali`.`tali_node` (`id`, `headline`, `body`, `updated_at`, `created_at`) VALUES (2, '#2 - Child of 1', 'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Praesent eleifend viverra ligula, eu laoreet nisl convallis tristique. Fusce varius leo eget mi rutrum id adipiscing felis malesuada. Cras sit amet massa id libero ultricies pretium. Nam pretium ipsum vel odio venenatis sit amet viverra mi cursus. Nullam id mi sed lorem accumsan aliquam. Nam ligula magna, hendrerit sed dictum sed, egestas vitae lectus. Pellentesque sit amet tellus lorem. Quisque luctus consequat enim sed euismod. Nullam pellentesque ornare lacus vitae pulvinar. Integer ullamcorper accumsan arcu a ultricies. Sed rhoncus egestas quam, id rhoncus sapien aliquet vel. Nullam semper consequat diam, a ultricies sem cursus id. Donec purus arcu, euismod quis fringilla eget, hendrerit at elit. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. ', now(), now());
INSERT INTO `tali`.`tali_node` (`id`, `headline`, `body`, `updated_at`, `created_at`) VALUES (3, '#3 - Child of 1 and 2', 'Sed quis quam vitae ligula venenatis viverra vitae vitae metus. Etiam dolor ipsum, scelerisque sit amet mollis vel, laoreet sed velit. Vestibulum ut sapien ut sapien facilisis lacinia. Nunc sed neque at dui scelerisque consequat ac vitae mi. Aliquam sit amet ullamcorper dolor. Integer nibh erat, cursus ut ullamcorper sed, cursus ac metus. Pellentesque suscipit suscipit eleifend. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Duis at sem sed massa posuere consequat. Sed sed neque eu lorem dignissim ullamcorper et vitae felis. Nullam convallis posuere porta. Morbi convallis semper nibh sed auctor. Maecenas vel vestibulum ipsum. Fusce elit metus, ultricies vitae posuere et, consectetur ac sapien. Pellentesque convallis, justo sed lacinia porttitor, dui velit accumsan libero, vel ornare dui tortor vitae lectus. In hac habitasse platea dictumst. Ut luctus mi sit amet ligula aliquam euismod malesuada est tristique. Phasellus quis erat nisl, et elementum ligula. Suspendisse ante augue, ullamcorper eget sollicitudin at, vulputate non lacus. Donec tempus magna ac dolor fermentum luctus. ', now(), now());
INSERT INTO `tali`.`tali_node` (`id`, `headline`, `body`, `updated_at`, `created_at`) VALUES (0, 'GLOBAL - invisible', NULL, now(), now());

COMMIT;

-- -----------------------------------------------------
-- Data for table `tali`.`tali_node_hierarchy`
-- -----------------------------------------------------
START TRANSACTION;
USE `tali`;
INSERT INTO `tali`.`tali_node_hierarchy` (`parent_id`, `child_id`, `position`) VALUES (1, 3, 0);
INSERT INTO `tali`.`tali_node_hierarchy` (`parent_id`, `child_id`, `position`) VALUES (2, 3, 0);
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
