from pydantic import BaseModel


class Card(BaseModel):
    text: str
    color: str
    fields: int | None = None


class NewCard(BaseModel):
    deck_id: int
    text: str
    color: str
    fields: int | None = None
