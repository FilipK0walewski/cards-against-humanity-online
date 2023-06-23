-- create user with privileges
-- CREATE USER ${POSTGRES_USER} WITH ENCRYPTED PASSWORD '${POSTGRES_PASSWORD}';
-- CREATE DATABASE ${POSTGRES_DB};
-- GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB} TO ${POSTGRES_USER};

CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    username VARCHAR,
    hashed_password BYTEA,
    guest BOOLEAN DEFAULT false,
    CONSTRAINT not_null_username CHECK ((guest = true) OR (guest = false AND username IS NOT NULL)),
    CONSTRAINT not_null_password CHECK ((guest = true) OR (guest = false AND hashed_password IS NOT NULL))
);
CREATE UNIQUE INDEX idx_unique_username_guest ON users (username) WHERE (guest = false);

CREATE TABLE IF NOT EXISTS profiles (
    id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id INT NOT NULL,
    user_description VARCHAR(1024),
    img_path VARCHAR(255) NOT NULL DEFAULT '/static/profiles/default.webp',
    img_url VARCHAR(255) NOT NULL DEFAULT '/api/static/L3N0YXRpYy9wcm9maWxlcy9kZWZhdWx0LndlYnA',
    sound_path VARCHAR(255) NOT NULL DEFAULT '/static/profiles/default.wav',
    sound_url VARCHAR(255) NOT NULL DEFAULT '/api/static/L3N0YXRpYy9wcm9maWxlcy9kZWZhdWx0Lndhdg',
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS decks (
    id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id INT NOT NULL,
    public BOOLEAN NOT NULL DEFAULT false,
    deck_name VARCHAR(255) NOT NULL,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS cards (
    id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    deck_id INT NOT NULL,
    color VARCHAR(5) NOT NULL,
    text VARCHAR(255) NOT NULL,
    fields INT,
    CONSTRAINT fk_deck FOREIGN KEY(deck_id) REFERENCES decks(id)
);

CREATE TABLE IF NOT EXISTS games (
    id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    deck_id INT NOT NULL,
    game_uuid UUID UNIQUE NOT NULL,
    game_name VARCHAR(255) NOT NULL,
    max_score SMALLINT,
    is_public BOOLEAN DEFAULT true,
    game_password VARCHAR(50),
    winner VARCHAR(255),
    ended BOOLEAN,
    created_by INT,
    CONSTRAINT fk_user FOREIGN KEY(created_by) REFERENCES users(id)
);