from pydantic import BaseModel


class NewGame(BaseModel):
    name: str
    max_score: int
    pub: bool
    password: str | None = None
    deck_id: int
