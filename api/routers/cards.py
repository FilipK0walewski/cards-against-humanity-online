# from asyncpg.exceptions import UniqueViolationError
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile
from fastapi.responses import FileResponse

from libs.common import verify_token
from libs.psql import db
from models.cards import Card, NewCard

router = APIRouter(
    tags=["cards"],
    responses={404: {"description": "Not found"}},
)


@router.post('/')
async def create_card(card: NewCard, user_id = Depends(verify_token)):
    r = await db.fetch_one('select user_id from decks where deck_id = :did', {'did': card.deck_id})
    if r._mapping['user_id'] != user_id:
        raise HTTPException(status_code=403)

    values = {'did': card.deck_id, 'c': card.color, 't': card.text, 'f': card.fields}
    await db.execute('insert into cards(deck_id, color, text, fields) values(:did, :c, :t, :f)', values)
    return {'message': 'Card created.'}


@router.put('/{card_id}')
async def update_card(card_id: int, data: Card, user_id: int = Depends(verify_token)):
    deck = await db.fetch_one('select deck_id from cards where card_id = :id', {'id': card_id})
    card = await db.fetch_one('select user_id from decks where deck_id = :id', {'id': deck._mapping['deck_id']})
    if user_id != card._mapping['user_id']:
        raise HTTPException(status_code=403)

    values = {'c': data.color, 't': data.text, 'f': data.fields, 'id': card_id}
    await db.execute('update cards set color = :c, text = :t, fields = :f where card_id = :id', values)
    return {'message': 'Card updated.'} 


@router.delete('/{card_id}')
async def delete_card(card_id: int, user_id: int = Depends(verify_token)):
    deck = await db.fetch_one('select deck_id from cards where card_id = :id', {'id': card_id})
    card = await db.fetch_one('select user_id from decks where deck_id = :id', {'id': deck._mapping['deck_id']})
    if user_id != card._mapping['user_id']:
        raise HTTPException(status_code=403, detail='It\'s not your deck.')

    await db.execute('delete from cards where card_id = :id', {'id': card_id})
    return {'card_id': card_id, 'message': 'Card deleted.'}


async def insert_cards(f, deck_id):
    file_content = await f.read()
    insert_data = []
    for row in file_content.decode().split('\n'):
        try:
            text, color, file_fields = row.split(';')
        except ValueError:
            continue

        file_fields = file_fields.replace('\r', '')
        if color not in ['white', 'black']:
            continue

        fields = None
        if color == 'black':
            fields = 1
            if file_fields.isnumeric():
                fields = int(file_fields)

        insert_data.append({'did': deck_id, 'c': color, 't': text, 'f': fields})
    try:
        await db.execute_many('insert into cards(deck_id, color, text, fields) values(:did, :c, :t, :f)', insert_data)
    except:
        print('fail')


@router.post('/file-import')
async def import_cards_from_file(deck_id: int, file: UploadFile, background_tasks: BackgroundTasks):
    background_tasks.add_task(insert_cards, file, deck_id)
    return {'message': 'Cards will appear in nearest future.'}


@router.get('/example')
async def download_example():
    return FileResponse('/static/example.csv')
