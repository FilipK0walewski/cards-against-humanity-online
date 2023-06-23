import os

from fastapi import APIRouter, Cookie, Depends, Header, HTTPException, Request, UploadFile

from libs.common import check_password, get_encoded_url, get_hashed_password, generate_jwt_token, get_user, get_logged_in_user
from libs.psql import db
from models.users import NewDescription, UserIn, UserLogin, UserOut, Username

router = APIRouter(
    tags=["users"],
    responses={404: {"description": "Not found"}},
)

@router.get('/')
async def get_profile(user: dict = Depends(get_logged_in_user)):
    return await db.fetch_one('select user_description, img_url img, sound_url sound from profiles where user_id = :id', {'id': user['id']})


@router.put('/username')
async def update_username(username: Username, user: dict = Depends(get_user)):
    await db.execute('update users set username = :username where id = :id', {'id': user['id'], 'username': username.text})
    return {'message': 'Username set.', 'username': username.text}


@router.post('/description')
async def update_description(description: NewDescription, user: dict = Depends(get_logged_in_user)):
    values = {'description': description.text, 'id': user['id']}
    await db.execute('update profiles set description = :description where user_id = :id', values)
    return {'description': description.text}


@router.post('/image')
async def update_image(image: UploadFile, user: dict = Depends(get_logged_in_user)):
    profile = await db.fetch_one('select id from profiles where user_id = :id', {'id': user['id']})
    profile_id = profile._mapping['id']
    dir_path = f'/static/profiles/{profile_id}'
    if os.path.exists(dir_path) is False:
        os.mkdir(dir_path)

    file_path = f'{dir_path}/{image.filename}'
    with open(file_path, 'wb') as f:
        f.write(image.file.read())

    url = get_encoded_url(file_path)
    values = {'path': file_path, 'url': url, 'id': profile_id}
    await db.execute('update profiles set img_path = :path, img_url = :url where id = :id', values)
    return {'message': 'Image changed.', 'url': url}


@router.post('/sound')
async def update_sound(sound: UploadFile, user: dict = Depends(get_logged_in_user)):
    profile = await db.fetch_one('select id from profiles where user_id = :id', {'id': user['id']})
    profile_id = profile._mapping['id']
    dir_path = f'/static/profiles/{profile_id}'
    if os.path.exists(dir_path) is False:
        os.mkdir(dir_path)

    file_path = f'{dir_path}/{sound.filename}'
    with open(file_path, 'wb') as f:
        f.write(sound.file.read())

    url = get_encoded_url(file_path)
    values = {'path': file_path, 'url': url, 'id': profile_id}
    await db.execute('update profiles set sound_path = :path, sound_url = :url where id = :id', values)
    return {'message': 'Sound changed.', 'url': url}
