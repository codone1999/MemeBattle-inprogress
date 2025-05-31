-- Create database
CREATE DATABASE IF NOT EXISTS `card_game_db`;
USE `card_game_db`;

DROP TABLE IF EXISTS `card_in_deck`;
DROP TABLE IF EXISTS `character_in_inventory`;
DROP TABLE IF EXISTS `PawnLocation`;
DROP TABLE IF EXISTS `lobby`;
DROP TABLE IF EXISTS `deck`;
DROP TABLE IF EXISTS `inventory`;
DROP TABLE IF EXISTS `card`;
DROP TABLE IF EXISTS `character`;
DROP TABLE IF EXISTS `map`;
DROP TABLE IF EXISTS `users`;

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
  `location_value` INT NOT NULL,
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

-- Insert data into 'users' table (password hashed)
INSERT INTO users (uid, username, password) VALUES
  (1111, 'test1', SHA2('test1', 256)),
  (2222, 'test2', SHA2('test2', 256));

-- Insert data into 'character' table (skill column set to NULL as it's not provided)
INSERT INTO `character` (idcharacter, charactername, themeColor, border, textColor, shadow, skill) VALUES
  (111, 'Adolf Kitler', 'bg-[#8f0000]', 'border-[#db5b00]', 'text-[#e3d5c1]', 'shadow-[#8c8670]', NULL),
  (112, 'Chinese Elon', 'bg-[#cc0000]', 'border-[#212121]', 'text-[#818181]', 'shadow-[#f2f2f2]', NULL),
  (113, 'Mr. Baby Oil', 'bg-[#000000]', 'border-[#d4b845]', 'text-[#ff1414]', 'shadow-[#5c46bd]', NULL),
  (114, 'Mr. Handsome All The Time', 'bg-gray-700', 'border-gray-500', 'text-white', 'shadow-gray-400', NULL),
  (999, 'Aerith Gainsborough', 'bg-[#FF868A]', 'border-[#FFACAE]', 'text-[#FFD5CC]', 'shadow-[#EAEBBD]', NULL);
  
-- Insert data into 'inventory' table
INSERT INTO inventory (idinventory, uid) VALUES
  (1, 1111),
  (2, 2222);

-- Insert data into 'deck' table
INSERT INTO deck (iddeck, idinventory, deckname) VALUES
  (2319, 1, 'Deck b7b9'),
  (2320, 1, 'Deck af9e'),
  (2321, 1, 'Deck 4b63'),
  (9895, 2, 'Deck beta');

-- Insert data into 'card' table
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

-- Insert data into 'PawnLocation' table (ใช้ 'location_value' แทน 'idPawnLocation' ในคอลัมน์ค่า)
INSERT INTO PawnLocation (card_idcard, location_value) VALUES
  (101, 8), (101, 14), (101, 18), (101, 12),
  (102, 14), (102, 12),
  (103, 8), (103, 3), (103, 18), (103, 23),
  (104, 8), (104, 9), (104, 18), (104, 19), (104, 7), (104, 17),
  (105, 12), (105, 8), (105, 14),
  (106, 14), (106, 18), (106, 12),
  (107, 12), (107, 8), (107, 14),
  (108, 9), (108, 14), (108, 12), (108, 7),
  (109, 9), (109, 19), (109, 17), (109, 7),
  (110, 9), (110, 3), (110, 7), (110, 17), (110, 23), (110, 19),
  (111, 18), (111, 19), (111, 17), (111, 8),
  (112, 23), (112, 24), (112, 22), (112, 2), (112, 3), (112, 4),
  (113, 14), (113, 15), (113, 11), (113, 12),
  (114, 8), (114, 14), (114, 12),
  (115, 7), (115, 9), (115, 17), (115, 19),
  (116, 6), (116, 7), (116, 8), (116, 9), (116, 10), (116, 11), (116, 12), (116, 14), (116, 15), (116, 16), (116, 17), (116, 18), (116, 19), (116, 20),
  (117, 8), (117, 18), (117, 17), (117, 19),
  (118, 7), (118, 9),
  (119, 7), (119, 8), (119, 18), (119, 19),
  (120, 8), (120, 12), (120, 18), (120, 14),
  (121, 12), (121, 14),
  (122, 22), (122, 23), (122, 24), (122, 12), (122, 14),
  (123, 12), (123, 14),
  (124, 20), (124, 24), (124, 16), (124, 22), (124, 6), (124, 2), (124, 4), (124, 10),
  (125, 7), (125, 12), (125, 17), (125, 9), (125, 14), (125, 19),
  (126, 11), (126, 18), (126, 15),
  (127, 8), (127, 18), (127, 12), (127, 11), (127, 14), (127, 15),
  (128, 13),
  (129, 18), (129, 19), (129, 7), (129, 8), (129, 20), (129, 6),
  (130, 11), (130, 12), (130, 14), (130, 15),
  (131, 7), (131, 6), (131, 9), (131, 10),
  (132, 2), (132, 4), (132, 22), (132, 24),
  (133, 12), (133, 14),
  (134, 11), (134, 12), (134, 14), (134, 15),
  (135, 17), (135, 19), (135, 7), (135, 9), (135, 18), (135, 8),
  (136, 17), (136, 19), (136, 16), (136, 20),
  (137, 6), (137, 7), (137, 9), (137, 10),
  (138, 7), (138, 17), (138, 9), (138, 19),
  (139, 8), (139, 12), (139, 14), (139, 18);
  
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

-- character_in_inventory
INSERT INTO character_in_inventory (character_idcharacter, inventory_idinventory) VALUES
  (111, 1), (112, 1), (113, 1), (114, 1), (999, 1),
  (111, 2), (112, 2);

select * from users;