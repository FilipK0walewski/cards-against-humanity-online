from pydantic import BaseModel


class UserIn(BaseModel):
    username: str
    password0: str
    password1: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    username: str


class NewDescription(BaseModel):
    text: str
