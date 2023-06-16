CREATE TABLE IF NOT EXISTS cards (
    card_id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    deck_id INT,
    color VARCHAR(5) NOT NULL,
    text VARCHAR(255) NOT NULL,
    fields INT,
    CONSTRAINT fk_deck FOREIGN KEY(deck_id) REFERENCES decks(deck_id)
)