-- Create database
CREATE DATABASE IF NOT EXISTS `card_game_db`;
USE `card_game_db`;

-- -----------------------------------------------------
-- Table `users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `uid` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(144) NOT NULL,
  `password` VARCHAR(144) NOT NULL,
  PRIMARY KEY (`uid`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table `inventory`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory` (
  `idinventory` INT NOT NULL AUTO_INCREMENT,
  `uid` INT NOT NULL,
  PRIMARY KEY (`idinventory`),
  INDEX `fk_inventory_users_idx` (`uid`),
  CONSTRAINT `fk_inventory_users`
    FOREIGN KEY (`uid`) REFERENCES `users` (`uid`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table `character`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `character` (
  `idcharacter` INT NOT NULL AUTO_INCREMENT,
  `charactername` VARCHAR(45) NOT NULL,
  `themeColor` VARCHAR(45),
  `textColor` VARCHAR(45),
  `shadow` VARCHAR(45),
  `border` VARCHAR(45),
  `skill` VARCHAR(45),
  PRIMARY KEY (`idcharacter`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table `card`
-- -----------------------------------------------------
CREATE TABLE card (
  idcard INT NOT NULL AUTO_INCREMENT,
  cardName VARCHAR(45) NOT NULL,
  Ability BOOLEAN,
  abilityType VARCHAR(45),
  cardinfo VARCHAR(200),
  Power INT NOT NULL,
  pawnsRequired INT NOT NULL,
  cardRarity VARCHAR(50),
  PRIMARY KEY (idcard)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table `PawnLocation`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `PawnLocation` (
  `idPawnLocation` INT NOT NULL,
  `card_idcard` INT NOT NULL,
  PRIMARY KEY (`idPawnLocation`),
  INDEX `fk_PawnLocation_card_idx` (`card_idcard`),
  CONSTRAINT `fk_PawnLocation_card`
    FOREIGN KEY (`card_idcard`) REFERENCES `card` (`idcard`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table `deck`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `deck` (
  `iddeck` INT NOT NULL AUTO_INCREMENT,
  `idinventory` INT NOT NULL,
  `deckname` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`iddeck`),
  INDEX `fk_deck_inventory_idx` (`idinventory`),
  CONSTRAINT `fk_deck_inventory`
    FOREIGN KEY (`idinventory`) REFERENCES `inventory` (`idinventory`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table `character_in_inventory`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `character_in_inventory` (
  `character_idcharacter` INT NOT NULL,
  `inventory_idinventory` INT NOT NULL,
  PRIMARY KEY (`character_idcharacter`, `inventory_idinventory`),
  INDEX `fk_character_inv_inventory_idx` (`inventory_idinventory`),
  INDEX `fk_character_inv_character_idx` (`character_idcharacter`),
  CONSTRAINT `fk_character_inv_character`
    FOREIGN KEY (`character_idcharacter`) REFERENCES `character` (`idcharacter`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_character_inv_inventory`
    FOREIGN KEY (`inventory_idinventory`) REFERENCES `inventory` (`idinventory`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table `card_in_deck`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `card_in_deck` (
  `deck_iddeck` INT NOT NULL,
  `card_idcard` INT NOT NULL,
  PRIMARY KEY (`deck_iddeck`, `card_idcard`),
  INDEX `fk_card_in_deck_card_idx` (`card_idcard`),
  INDEX `fk_card_in_deck_deck_idx` (`deck_iddeck`),
  CONSTRAINT `fk_card_in_deck_deck`
    FOREIGN KEY (`deck_iddeck`) REFERENCES `deck` (`iddeck`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_card_in_deck_card`
    FOREIGN KEY (`card_idcard`) REFERENCES `card` (`idcard`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table `map`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `map` (
  `idmap` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `image` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`idmap`)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table `lobby`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `lobby` (
  `idlobby` INT NOT NULL AUTO_INCREMENT,
  `player1_uid` INT NOT NULL,
  `player2_uid` INT,
  `player1_deckid` INT NOT NULL,
  `player2_deckid` INT,
  `player1_characterid` INT NOT NULL,
  `player2_characterid` INT,
  `lobbycol` VARCHAR(45),
  `map_idmap` INT NOT NULL,
  PRIMARY KEY (`idlobby`),
  INDEX `fk_lobby_player1_idx` (`player1_uid`),
  INDEX `fk_lobby_player2_idx` (`player2_uid`),
  INDEX `fk_lobby_map_idx` (`map_idmap`),
  INDEX `fk_lobby_player1_deck_idx` (`player1_deckid`),
  INDEX `fk_lobby_player2_deck_idx` (`player2_deckid`),
  INDEX `fk_lobby_player1_character_idx` (`player1_characterid`),
  INDEX `fk_lobby_player2_character_idx` (`player2_characterid`),
  CONSTRAINT `fk_lobby_player1`
    FOREIGN KEY (`player1_uid`) REFERENCES `users` (`uid`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_lobby_player2`
    FOREIGN KEY (`player2_uid`) REFERENCES `users` (`uid`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_lobby_map`
    FOREIGN KEY (`map_idmap`) REFERENCES `map` (`idmap`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_lobby_player1_deck`
    FOREIGN KEY (`player1_deckid`) REFERENCES `deck` (`iddeck`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_lobby_player2_deck`
    FOREIGN KEY (`player2_deckid`) REFERENCES `deck` (`iddeck`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_lobby_player1_character`
    FOREIGN KEY (`player1_characterid`) REFERENCES `character` (`idcharacter`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_lobby_player2_character`
    FOREIGN KEY (`player2_characterid`) REFERENCES `character` (`idcharacter`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB;

INSERT INTO users (uid, username, password) VALUES
  (1111, 'test1', 'test1'),
  (2222, 'test2', 'test2');

INSERT INTO `character` (idcharacter, charactername, themeColor, border, textColor, shadow) VALUES
  (111, 'Adolf Kitler', 'bg-[#8f0000]', 'border-[#db5b00]', 'text-[#e3d5c1]', 'shadow-[#8c8670]'),
  (112, 'Chinese Elon', 'bg-[#cc0000]', 'border-[#212121]', 'text-[#818181]', 'shadow-[#f2f2f2]'),
  (113, 'Mr. Baby Oil', 'bg-[#000000]', 'border-[#d4b845]', 'text-[#ff1414]', 'shadow-[#5c46bd]'),
  (114, 'Mr. Handsome All The Time', 'bg-gray-700', 'border-gray-500', 'text-white', 'shadow-gray-400'),
  (999, 'Aerith Gainsborough', 'bg-[#FF868A]', 'border-[#FFACAE]', 'text-[#FFD5CC]', 'shadow-[#EAEBBD]');
  
INSERT INTO inventory (idinventory, uid) VALUES
  (1, 1111),
  (2, 2222);

INSERT INTO deck (iddeck, idinventory, deckname) VALUES
  (2319, 1, 'Deck b7b9'),
  (2320, 1, 'Deck af9e'),
  (2321, 1, 'Deck 4b63'),
  (9895, 2, 'Deck beta');


INSERT INTO card (idcard, cardName, Ability, abilityType, cardinfo, Power, pawnsRequired, cardRarity) VALUES
(101, 'Grumpy Cat', 0, 'non', 'Nah, I''m Good.', 1, 1, 'Standard'),
(102, 'Smudge the Cat', 1, 'buff', 'The confused-looking white cat at a dinner table.', 1, 2, 'Standard'),
(103, 'Skibidi Toilet', 1, 'debuff', 'Skibidi Toilet Dob dob dob yes yes', 1, 1, 'Standard'),
(104, 'Dancing Banana', 0, 'non', 'Peanut butter jelly time!', 2, 2, 'Standard'),
(105, 'Keyboard Cat', 1, 'buff', 'Playing you off, play us on!', 1, 2, 'Standard'),
(106, 'Troll Face', 1, 'debuff', 'Problem?', 2, 2, 'Standard'),
(107, 'Doge', 0, 'non', 'Much wow, very meme.', 2, 1, 'Standard'),
(108, 'Pepe the Frog', 1, 'buff', 'Feels good man.', 1, 2, 'Standard'),
(109, 'Distracted Boyfriend', 1, 'debuff', 'Classic distraction.', 2, 2, 'Standard'),
(110, 'Rick Astley', 0, 'non', 'Never gonna give you up...', 3, 1, 'Legend'),
(111, 'Hide the Pain Harold', 1, 'buff', 'Internal suffering.', 1, 2, 'Standard'),
(112, 'Woman Yelling at Cat', 1, 'debuff', 'Confusion and anger.', 2, 2, 'Standard'),
(113, 'Big Chungus', 0, 'non', 'Oh lawd he comin''.', 2, 2, 'Epic'),
(114, 'Drake Meme', 1, 'buff', 'Disapproving and approving.', 1, 2, 'Standard'),
(115, 'Expanding Brain', 1, 'debuff', 'Ascending levels of knowledge.', 3, 2, 'Epic'),
(116, 'Code Geass: Lelouch''s Geass', 1, 'debuff', 'The power of the king will isolate you.', 2, 3, 'Legend'),
(117, 'Siamese Cat and Cucumber', 1, 'debuff', 'Cat sees cucumber, goes into panic mode.', 2, 2, 'Standard'),
(118, 'Confusing Black Dog', 0, 'non', 'What is going on here? Nobody knows.', 1, 1, 'Standard'),
(119, 'Just A Little', 0, 'non', 'Just a little bit of chaos for fun.', 1, 1, 'Standard'),
(120, 'You''re not that guy', 1, 'debuff', 'You wish, but you''re definitely not.', 2, 1, 'Epic'),
(121, 'Sad Keanu', 0, 'non', 'Keanu''s just sad and tired of everything.', 1, 1, 'Standard'),
(122, 'Talking to Brick Wall', 1, 'debuff', 'It''s like talking to a brick wall... no one listens.', 2, 2, 'Standard'),
(123, 'Why r u Gae ?', 1, 'buff', 'When you ask, but they give you a sly smile.', 6, 3, 'Legend'),
(124, 'Giga Chad', 1, 'buff', 'Peak masculinity achieved. Prepare to be jealous.', 2, 3, 'Epic'),
(125, 'Kazuya Guy', 1, 'debuff', 'He’s about to throw hands... watch out.', 3, 3, 'Epic'),
(126, 'Evil Kermit', 0, 'non', 'Embrace the dark side. It’s fun over here.', 1, 1, 'Standard'),
(127, 'Gomen Amanai', 1, 'buff', 'Sorry, I messed up. Again.', 4, 3, 'Legend'),
(128, 'Melon Helmet', 0, 'non', 'Protect your brain... in style.', 6, 3, 'Standard'),
(129, 'China Trump', 0, 'non', 'Make memes great again. YUGE memes.', 2, 2, 'Epic'),
(130, 'Sigma Cat', 0, 'non', 'Mewing with supreme confidence. Sigma vibes.', 1, 1, 'Standard'),
(131, 'Polygon White', 1, 'debuff', 'Walter White, but in pixelated glory. Science!', 3, 2, 'Legend'),
(132, 'All-might Wanna Be', 1, 'buff', 'When you try so hard to be All Might, but end up just... not.', 2, 2, 'Epic'),
(133, 'Dora-A', 1, 'debuff', 'When cosplay takes a turn for the weird... and funny.', 2, 2, 'Epic'),
(134, 'Sleepy-A', 0, 'non', 'A sleepy guy who got a sweetest dream.', 3, 2, 'Legend'),
(135, 'handsome Cat', 0, 'non', 'These cat want to give you flower', 1, 1, 'Standard'),
(136, 'Chill Guys', 0, 'non', 'Just Chilling', 1, 1, 'Standard'),
(137, 'Toothless the dragon', 0, 'non', 'idk', 1, 1, 'Standard'),
(138, 'Dark zuckerberg', 0, 'non', 'CEO of facebook from another universe', 1, 1, 'Standard'),
(139, 'Majima Goro', 0, 'non', '???', 1, 1, 'Standard');

INSERT INTO PawnLocation (idPawnLocation, card_idcard) VALUES
  (1, 101), (2, 101), (3, 101), (4, 101),
  (5, 102), (6, 102),
  (7, 103), (8, 103), (9, 103), (10, 103),
  (11, 104), (12, 104), (13, 104), (14, 104), (15, 104), (16, 104),
  (17, 105), (18, 105), (19, 105),
  (20, 106), (21, 106), (22, 106),
  (23, 107), (24, 107), (25, 107),
  (26, 108), (27, 108), (28, 108), (29, 108),
  (30, 109), (31, 109), (32, 109), (33, 109),
  (34, 110), (35, 110), (36, 110), (37, 110), (38, 110), (39, 110),
  (40, 111), (41, 111), (42, 111), (43, 111),
  (44, 112), (45, 112), (46, 112), (47, 112), (48, 112), (49, 112),
(50, 113), (51, 113), (52, 113), (53, 113),
(54, 114), (55, 114), (56, 114),
(57, 115), (58, 115), (59, 115), (60, 115),
(61, 116), (62, 116), (63, 116), (64, 116), (65, 116), (66, 116), (67, 116), (68, 116), (69, 116), (70, 116), (71, 116), (72, 116), (73, 116), (74, 116),
(75, 117), (76, 117), (77, 117), (78, 117),
(79, 118), (80, 118),
(81, 119), (82, 119), (83, 119), (84, 119),
(85, 120), (86, 120), (87, 120), (88, 120),
(89, 121), (90, 121),
(91, 122), (92, 122), (93, 122), (94, 122), (95, 122),
(96, 123), (97, 123),
(98, 124), (99, 124), (100, 124), (101, 124), (102, 124), (103, 124), (104, 124), (105, 124),
(106, 125), (107, 125), (108, 125), (109, 125), (110, 125), (111, 125),
(112, 126), (113, 126), (114, 126),
(115, 127), (116, 127), (117, 127), (118, 127), (119, 127), (120, 127),
(121, 128),
(122, 129), (123, 129), (124, 129), (125, 129), (126, 129), (127, 129),
(128, 130), (129, 130), (130, 130), (131, 130),
(132, 131), (133, 131), (134, 131), (135, 131),
(136, 132), (137, 132), (138, 132), (139, 132),
(140, 133), (141, 133),
(142, 134), (143, 134), (144, 134), (145, 134),
(146, 135), (147, 135), (148, 135), (149, 135), (150, 135), (151, 135),
(152, 136), (153, 136), (154, 136), (155, 136),
(156, 137), (157, 137), (158, 137), (159, 137),
 (160, 138), (161, 138), (162, 138), (163, 138),
  (164, 139), (165, 139), (166, 139), (167, 139);
  
-- Cards for deck 2319
INSERT INTO card_in_deck (deck_iddeck, card_idcard) VALUES
  (2319, 120), (2319, 132), (2319, 131), (2319, 130), (2319, 123),
  (2319, 124), (2319, 129), (2319, 128), (2319, 127), (2319, 126),
  (2319, 133), (2319, 116), (2319, 117), (2319, 101), (2319, 103);

-- Cards for deck 9895
INSERT INTO card_in_deck (deck_iddeck, card_idcard) VALUES
  (9895, 132), (9895, 131), (9895, 130), (9895, 129), (9895, 127), (9895, 128);

-- Maps
INSERT INTO map (idmap, name, image) VALUES
  (34352, 'Soviet Union', '/Maps/soviet_union.png'),
  (5256, 'Sky Tower', '/Maps/sky_tower.png'),
  (23553, 'Battle Ground', '/Maps/battle_ground.png'),
  (50883, 'Homie House', '/Maps/homie_house.png'),
  (61307, 'KMUTT', '/Maps/kmutt.png'),
  (5823, 'No Promises To Keep', '/Maps/No_Promises_To_Keep.png');

INSERT INTO character_in_inventory (character_idcharacter, inventory_idinventory) VALUES
  (111, 1), (112, 1), (113, 1), (114, 1), (999, 1),
  (111, 2), (112, 2);


