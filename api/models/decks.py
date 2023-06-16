from pydantic import BaseModel


class Deck(BaseModel):
    name: str | None = None
    public: bool | None = False
