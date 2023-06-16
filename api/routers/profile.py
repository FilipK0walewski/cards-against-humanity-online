import os

from fastapi import APIRouter, Depends, Header, HTTPException, Request, UploadFile

from libs.common import check_password, get_encoded_url, get_hashed_password, generate_jwt_token, verify_token
from libs.psql import db
from models.users import NewDescription, UserIn, UserLogin, UserOut

router = APIRouter(
    tags=["users"],
    responses={404: {"description": "Not found"}},
)

@router.get('/')
async def get_profile(user_id: int = Depends(verify_token)):
    return await db.fetch_one('select description, img_url img, sound_url sound from profiles where user_id = :uid', {'uid': user_id})


@router.get('/username')
async def get_username(user_id: int = Depends(verify_token)):
    return await db.fetch_one('select username from users where user_id = :uid', {'uid': user_id})


@router.post('/description')
async def update_description(description: NewDescription, user_id: int = Depends(verify_token)):
    await db.execute('update profiles set description = :d where user_id = :uid', {'d': description.text, 'uid': user_id})
    return {'description': description.text}


@router.post('/image')
async def update_image(image: UploadFile, user_id: int = Depends(verify_token)):
    profile_id = await db.fetch_one('select profile_id from profiles where user_id = :uid', {'uid': user_id})
    profile_id = profile_id._mapping['profile_id']
    dir_path = f'/static/profiles/{profile_id}'
    if os.path.exists(dir_path) is False:
        os.mkdir(dir_path)

    file_path = f'{dir_path}/{image.filename}'
    with open(file_path, 'wb') as f:
        f.write(image.file.read())

    url = get_encoded_url(file_path)
    values = {'path': file_path, 'url': url, 'pid': profile_id}
    await db.execute('update profiles set img_path = :path, img_url = :url where profile_id = :pid', values)
    return {'message': 'Image changed.', 'url': url}


@router.post('/sound')
async def update_sound(sound: UploadFile, user_id: int = Depends(verify_token)):
    profile_id = await db.fetch_one('select profile_id from profiles where user_id = :uid', {'uid': user_id})
    profile_id = profile_id._mapping['profile_id']
    dir_path = f'/static/profiles/{profile_id}'
    if os.path.exists(dir_path) is False:
        os.mkdir(dir_path)

    file_path = f'{dir_path}/{sound.filename}'
    with open(file_path, 'wb') as f:
        f.write(sound.file.read())

    url = get_encoded_url(file_path)
    values = {'path': file_path, 'url': url, 'pid': profile_id}
    await db.execute('update profiles set win_sound_path = :path, sound_url = :url where profile_id = :pid', values)
    return {'message': 'Sound changed.', 'url': url}
