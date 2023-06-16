from fastapi import APIRouter, Depends, Header, HTTPException

from libs.common import get_user_id, verify_token
from libs.psql import db
from models.decks import Deck

router = APIRouter(
    tags=["decks"],
    responses={404: {"description": "Not found"}},
)


@router.get('/')
async def get_decks(page: int | None = 1, page_size: int | None = 10, public: bool | None = True, private: bool | None = True, empty: bool | None = True, user_id: int | None = Depends(get_user_id)):
    if public is False and private is False:
        raise HTTPException(status_code=400)
        
    values = {'limit': page_size, 'offset': (page - 1) * page_size}
    query = 'select d.deck_id id, d.name, u.username as owner from decks d left join users u on d.user_id = u.user_id '
    if private is True and user_id is not None:
        values['uid'] = user_id
        if public is True: 
            values['public'] = True
            query += 'where d.public = :public or d.user_id = :uid'
        elif public is False:
            query += 'where d.user_id = :uid'
    elif public is True:
        values['public'] = True
        query += 'where d.public = :public'

    # if empty is False:
    #     query += 

    query += ' order by id limit :limit offset :offset'
    return await db.fetch_all(query, values)


@router.get('/{deck_id}')
async def get_deck(deck_id: int, page: int| None = 1, size: int | None = 50, user_id: int | None = Depends(get_user_id)):
    deck = await db.fetch_one('select user_id, name, public from decks where deck_id = :did', {'did': deck_id})
    if deck._mapping['public'] is False and user_id != deck._mapping['user_id']:
        raise HTTPException(status_code=401)

    user = await db.fetch_one('select username from users where user_id = :user_id', {'user_id': deck._mapping['user_id']})
    username = user._mapping['username']

    values = {'did': deck_id, 'limit': size, 'offset': (page - 1) * size}
    offset = (page - 1) * size
    cards = await db.fetch_all(f'select card_id, color, text, fields from cards where deck_id = :did order by card_id desc limit :limit offset :offset', values)
    count = await db.fetch_one('select count(*) from cards where deck_id = :did', {'did': deck_id})
    return {'name': deck._mapping['name'], 'public': deck._mapping['public'], 'owner': username, 'cards': cards, 'size': count._mapping['count']}


@router.post('/', status_code=201)
async def create_deck(deck: Deck, user_id: int = Depends(verify_token)):
    if deck.name is None or len(deck.name) == 0:
        raise HTTPException(status_code=422, detail='Invalid name.')

    exists = await db.fetch_one('select 1 from decks where name = :name', {'name': deck.name})
    if exists is not None:
        raise HTTPException(status_code=400, detail='Name exists.')

    values = {'uid': user_id, 'name': deck.name, 'p': deck.public}
    await db.fetch_one('insert into decks(user_id, name, public) values (:uid, :name, :p)', values)
    return {'message': 'Deck created.'}


@router.delete('/{deck_id}')
async def delete_deck(deck_id: int, user_id: int = Depends(verify_token)):
    deck = await db.fetch_one('select user_id from decks where deck_id = :id', {'id': deck_id})
    if user_id != deck._mapping['user_id']:
        raise HTTPException(status_code=403, detail='You do not own this deck.')

    await db.execute('delete from cards where deck_id = :id', {'id': deck_id})
    await db.execute('delete from decks where deck_id = :id', {'id': deck_id})
    return {'message': 'Deck deleted.'}


@router.patch('/{deck_id}', response_model=Deck)
async def update_deck(deck_id: int, deck: Deck, user_id: int = Depends(verify_token)):
    db_deck = await db.fetch_one('select user_id, public from decks where deck_id = :id', {'id': deck_id})
    if user_id != db_deck._mapping['user_id']:
        raise HTTPException(status_code=403, detail='This is not your deck.')
    if deck.public == db_deck._mapping['public']:
        raise HTTPException(status_code=422, detail='Something no yes.')
    await db.execute('update decks set public = :public where deck_id = :id', {'public': deck.public, 'id': deck_id})
    return deck
