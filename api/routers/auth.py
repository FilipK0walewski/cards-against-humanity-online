from fastapi import APIRouter, Depends, Header, HTTPException, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from libs.common import check_password, decode_user_token, get_hashed_password, get_user_token
from libs.psql import db
from models.users import UserIn, UserLogin, UserOut

security = HTTPBearer()

router = APIRouter(
    tags=["users"],
    responses={404: {"description": "Not found"}},
)


@router.post('/register', status_code=201, response_model=UserOut)
async def register_user(user: UserIn):
    if len(user.username) == 0:
        raise HTTPException(status_code=400, detail="Invalid username.")

    if user.password0 != user.password1:
        raise HTTPException(status_code=400, detail="Passwords are not equal.")

    db_user = await db.fetch_one('select 1 from users where username = :username and guest = true', {'username': user.username})
    if db_user is not None:
        raise HTTPException(status_code=400, detail="Username taken.")
    
    hashed_password = get_hashed_password(user.password0)
    values = {'username': user.username, 'password': hashed_password}
    user_id = await db.fetch_one('insert into users(username, hashed_password) values(:username, :password) returning id', values)
    await db.execute('insert into profiles(user_id) values(:id)', {'id': user_id._mapping['id']})
    return user


@router.post('/login')
async def login(response: Response, user: UserLogin):
    data = await db.fetch_one('select id, guest, hashed_password from users where username = :username', {'username': user.username})
    if data is None:
        raise HTTPException(status_code=403, detail='Invalid username or password.')
    if check_password(user.password, data._mapping['hashed_password']) is False:
        raise HTTPException(status_code=403, detail='Invalid username or password.')
    token = get_user_token(data._mapping['id'], data._mapping['guest'])

    return {'token': token, 'username': user.username, 'guest': data._mapping['guest']}


@router.get('/check')
async def check(credentials: HTTPAuthorizationCredentials | None = Depends(security)):
    user_id, guest = None, None
    scheme, token = credentials.scheme, credentials.credentials
    if scheme:
        user_id, guest = decode_user_token(token)

    if user_id is None:
        user = await db.fetch_one('insert into users(guest) values(true) returning id')
        user_id = user._mapping['id']
        await db.execute('insert into profiles (user_id) values(:id)', {'id': user_id})
        token = get_user_token(user_id, True)
        return {'token': token, 'username': None, 'guest': True}

    result = await db.fetch_one('select username from users where id = :id', {'id': user_id})
    return {'username': result._mapping['username'], 'guest': guest}
