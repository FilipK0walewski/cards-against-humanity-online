import base64
import os

from fastapi import HTTPException, FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from libs.common import decode_file_path
from libs.psql import db
from routers import auth, cards, decks, games, profile

app = FastAPI()

@app.on_event("startup")
async def startup():
    await db.connect()


@app.on_event("shutdown")
async def shutdown():
    await db.disconnect()


app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(auth.router, prefix='/auth')
app.include_router(cards.router, prefix='/cards')
app.include_router(decks.router, prefix='/decks')
app.include_router(games.router, prefix='/games')
app.include_router(profile.router, prefix='/profile')


@app.get('/static/{encoded_path}')
async def get_file(encoded_path: str):
    file_path = decode_file_path(encoded_path)
    if os.path.exists(file_path) is False:
        raise HTTPException(status_code=404, detail='File does not exist.')
    return FileResponse(file_path)
