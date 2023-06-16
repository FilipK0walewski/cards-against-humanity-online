import uuid

from fastapi import APIRouter, Header, HTTPException, Request

from libs.common import generate_game_token, verify_token
from libs.psql import db
from models.games import NewGame

router = APIRouter(
    tags=["games"],
    responses={404: {"description": "Not found"}},
)


@router.get('/join')
async def join_game(game: str, request: Request):
    token = request.headers.get('token')
    username = request.headers.get('username')
    password = request.headers.get('password')
    print(username, password)

    data = await db.fetch_one('select is_public, game_name, password, ended, created_by from games where game_uuid = :id', {'id': game})
    if data is None:
        raise HTTPException(status_code=404)

    if username is None and token is None:
        raise HTTPException(status_code=401, detail='Give username or log in.')

    user_id = None
    if token is not None:
        user_id = await verify_token(token)

    if data._mapping['created_by'] != user_id and data._mapping['is_public'] is False and password != data._mapping['password']:
        raise HTTPException(status_code=401, detail='Incorrect password.')

    if data._mapping['ended'] is True:
        raise HTTPException(status_code=500, detail='Game is ended.')

    user_id, img_url, sound_url = None, '/api/static/L3N0YXRpYy9wcm9maWxlcy9kZWZhdWx0LndlYnA', '/api/static/L3N0YXRpYy9wcm9maWxlcy9kZWZhdWx0Lndhdg'
    if token is not None:
        user_id = await verify_token(token)
        profile = await db.fetch_one('select a.username, b.img_url, b.sound_url from users a inner join profiles b on a.user_id = b.user_id where a.user_id = :id', {'id': user_id})
        username = profile._mapping['username']
        img_url = profile._mapping['img_url']
        sound_url = profile._mapping['sound_url']

    if user_id is None:
        user_id = str(uuid.uuid4())

    game_token = generate_game_token({'game': game, 'name': data._mapping['game_name'], 'user': user_id, 'username': username, 'img': img_url, 'sound': sound_url})
    return {'token': game_token, 'message': f'Joining game.'}


@router.get('/{game}')
async def get_game(game: str):
    return await db.fetch_one('select game_name name, is_public public, started, ended, b.username owner from games a join users b on a.created_by = b.user_id where game_uuid = :id', {'id': game})


@router.post('/')
async def create_game(game: NewGame, token: str | None = Header(default=None)):
    user_id = None
    if token is not None:
        user_id = await verify_token(token)

    guuid = str(uuid.uuid4())
    values = {'did': game.deck_id, 'guuid': guuid, 'name': game.name, 'max': game.max_score, 'pub': game.pub, 'pass': game.password, 'cb': user_id}    
    query = 'insert into games(deck_id, game_uuid, game_name, max_score, is_public, password, created_by) values (:did, :guuid, :name, :max, :pub, :pass, :cb)'
    await db.execute(query, values)
    return {'uuid': guuid}
