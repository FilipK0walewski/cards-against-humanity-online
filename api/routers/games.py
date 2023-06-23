import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, Request

from libs.common import generate_game_token, get_user, is_valid_uuid4
from libs.psql import db
from models.games import NewGame

router = APIRouter(
    tags=["games"],
    responses={404: {"description": "Not found"}},
)


@router.get('/join')
async def join_game(game: str, request: Request, user: dict = Depends(get_user)):
    username = request.headers.get('username')
    password = request.headers.get('password')

    if user['guest'] is True and username is not None:
        await db.execute('update users set username = :username where id = :id', {'id': user['id'], 'username': username})

    data = await db.fetch_one('select is_public, game_password, ended, created_by from games where game_uuid = :id', {'id': game})
    if data is None:
        raise HTTPException(status_code=404)

    if data._mapping['created_by'] != user['id'] and data._mapping['is_public'] is False and password != data._mapping['game_password']:
        raise HTTPException(status_code=403, detail='Incorrect password.')

    # if data._mapping['ended'] is True:
    #     raise HTTPException(status_code=400, detail='Game is ended.')

    game_token = generate_game_token({'game': game, 'user': user['id']})
    return {'token': game_token, 'message': f'Joining game.'}


@router.get('/{game}')
async def get_game(game: str):
    if is_valid_uuid4(game) is False:
        raise HTTPException(status_code=400, detail='Invalid game id.')
    data = await db.fetch_one('select game_name name, is_public public, ended, b.username owner from games a join users b on a.created_by = b.id where game_uuid = :id', {'id': game})
    if data is None:
        raise HTTPException(status_code=404, detail='Game not found.')
    return data


@router.post('/')
async def create_game(game: NewGame, user: dict = Depends(get_user)):
    game_id = str(uuid.uuid4())
    values = {'deck_id': game.deck_id, 'game_id': game_id, 'name': game.name, 'max': game.max_score, 'pub': game.pub, 'pass': game.password, 'user_id': user['id']}    
    query = 'insert into games(deck_id, game_uuid, game_name, max_score, is_public, game_password, created_by) values (:deck_id, :game_id, :name, :max, :pub, :pass, :user_id)'
    await db.execute(query, values)
    return {'uuid': game_id}
