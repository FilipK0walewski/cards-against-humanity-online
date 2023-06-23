import io

from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import StreamingResponse

from libs.common import get_user, get_logged_in_user
from libs.psql import db
from models.decks import Deck

router = APIRouter(
    tags=["decks"],
    responses={404: {"description": "Not found"}},
)


@router.get('/')
async def get_decks(page: int | None = 1, page_size: int | None = 10, private: bool | None = False, empty: bool | None = True, user: dict = Depends(get_user)):
    values = {'limit': page_size, 'offset': (page - 1) * page_size}

    query = 'select d.id, d.deck_name name, u.username as owner from decks d left join users u on d.user_id = u.id '
    if private is False:
        query += 'where d.public = true'
    elif private is True and user['guest'] is False:
        values['user_id'] = user['id']
        query += 'where d.user_id = :user_id'
    else:
        raise HTTPException(status_code=403, detail='You have to be logged in.')

    query += ' order by id limit :limit offset :offset'
    return await db.fetch_all(query, values)


@router.get('/{deck_id}')
async def get_deck(deck_id: int, page: int| None = 1, size: int | None = 50, user: dict = Depends(get_user)):
    deck = await db.fetch_one('select user_id, deck_name name, public from decks where id = :id', {'id': deck_id})
    if deck._mapping['public'] is False and user['id'] != deck._mapping['user_id']:
        raise HTTPException(status_code=403, detail='This deck is private, you are not owner.')

    user = await db.fetch_one('select username from users where id = :id', {'id': deck._mapping['user_id']})
    username = user._mapping['username']

    values = {'id': deck_id, 'limit': size, 'offset': (page - 1) * size}
    offset = (page - 1) * size
    cards = await db.fetch_all(f'select id, color, text, fields from cards where deck_id = :id order by id desc limit :limit offset :offset', values)
    count = await db.fetch_one('select count(*) from cards where deck_id = :id', {'id': deck_id})
    return {'name': deck._mapping['name'], 'public': deck._mapping['public'], 'owner': username, 'cards': cards, 'size': count._mapping['count']}


@router.get('/{deck_id}/download')
async def downlaod_deck(deck_id: int):
    data = await db.fetch_all('select text, color, fields from cards where deck_id = :id', {'id': deck_id})

    output = io.StringIO()
    for row in data:
        row = dict(row._mapping)
        output.write(';'.join(str(v if v is not None else '') for _, v in row.items()) + '\n')

    output.seek(0)
    response = StreamingResponse(output, media_type="text/plain")
    response.headers["Content-Disposition"] = "attachment; filename=your_file.txt"
    return response


@router.post('/', status_code=201)
async def create_deck(deck: Deck, user: dict = Depends(get_logged_in_user)):
    if deck.name is None or len(deck.name) == 0:
        raise HTTPException(status_code=422, detail='Invalid name.')

    exists = await db.fetch_one('select 1 from decks where deck_name = :name', {'name': deck.name})
    if exists is not None:
        raise HTTPException(status_code=400, detail='Name exists.')

    values = {'id': user['id'], 'name': deck.name, 'public': deck.public}
    await db.fetch_one('insert into decks(user_id, deck_name, public) values (:id, :name, :public)', values)
    return {'message': 'Deck created.'}


@router.delete('/{deck_id}')
async def delete_deck(deck_id: int, user: dict = Depends(get_logged_in_user)):
    deck = await db.fetch_one('select user_id from decks where id = :id', {'id': deck_id})
    if user['id'] != deck._mapping['user_id']:
        raise HTTPException(status_code=403, detail='You do not own this deck.')

    await db.execute('delete from cards where deck_id = :id', {'id': deck_id})
    await db.execute('delete from decks where id = :id', {'id': deck_id})
    return {'message': 'Deck deleted.'}


@router.patch('/{deck_id}', response_model=Deck)
async def update_deck(deck_id: int, deck: Deck, user: dict = Depends(get_logged_in_user)):
    db_deck = await db.fetch_one('select user_id, public from decks where id = :id', {'id': deck_id})
    if user['id'] != db_deck._mapping['user_id']:
        raise HTTPException(status_code=403, detail='This is not your deck.')
    if deck.public == db_deck._mapping['public']:
        raise HTTPException(status_code=422, detail='Something no yes.')
    await db.execute('update decks set public = :public where id = :id', {'public': deck.public, 'id': deck_id})
    return deck
