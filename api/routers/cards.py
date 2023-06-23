from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile
from fastapi.responses import FileResponse

from libs.common import get_user, get_logged_in_user
from libs.psql import db
from models.cards import Card, NewCard

router = APIRouter(
    tags=["cards"],
    responses={404: {"description": "Not found"}},
)


@router.post('/')
async def create_card(card: NewCard, user: dict = Depends(get_logged_in_user)):
    deck = await db.fetch_one('select user_id from decks where id = :id', {'id': card.deck_id})
    if deck._mapping['user_id'] != user['id']:
        raise HTTPException(status_code=403, detail='Your are not ower of this deck.')

    values = {'id': card.deck_id, 'color': card.color, 'text': card.text, 'fields': card.fields}
    await db.execute('insert into cards(deck_id, color, text, fields) values(:id, :color, :text, :fields)', values)
    return {'message': 'Card created.'}


@router.put('/{card_id}')
async def update_card(card_id: int, data: Card, user: dict = Depends(get_logged_in_user)):
    card = await db.fetch_one('select deck_id from cards where id = :id', {'id': card_id})
    deck = await db.fetch_one('select user_id from decks where id = :id', {'id': card._mapping['deck_id']})
    if user['id'] != deck._mapping['user_id']:
        raise HTTPException(status_code=403, detail='Your are not ower of this deck.')

    values = {'color': data.color, 'text': data.text, 'fields': data.fields, 'id': card_id}
    await db.execute('update cards set color = :color, text = :text, fields = :fields where id = :id', values)
    return {'message': 'Card updated.'} 


@router.delete('/{card_id}')
async def delete_card(card_id: int, user: dict = Depends(get_logged_in_user)):
    card = await db.fetch_one('select deck_id from cards where id = :id', {'id': card_id})
    deck = await db.fetch_one('select user_id from decks where id = :id', {'id': card._mapping['deck_id']})
    if user['id'] != deck._mapping['user_id']:
        raise HTTPException(status_code=403, detail='It\'s not your deck.')

    await db.execute('delete from cards where id = :id', {'id': card_id})
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

        insert_data.append({'id': deck_id, 'color': color, 'text': text, 'fields': fields})
    try:
        await db.execute_many('insert into cards(deck_id, color, text, fields) values(:id, :color, :text, :fields)', insert_data)
    except:
        print('fail')


@router.post('/file-import')
async def import_cards_from_file(deck_id: int, file: UploadFile, background_tasks: BackgroundTasks, user: dict = Depends(get_logged_in_user)):
    deck = await db.fetch_one('select user_id from decks where id = :id', {'id': deck_id})
    if user['id'] != deck._mapping['user_id']:
        raise HTTPException(status_code=403, detail='It\'s not your deck.')

    background_tasks.add_task(insert_cards, file, deck_id)
    return {'message': 'Cards will appear in nearest future.'}


@router.get('/example')
async def download_example():
    return FileResponse('/static/example.csv')
