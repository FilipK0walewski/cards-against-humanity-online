import base64
import bcrypt
import datetime
import jwt
import os

from fastapi import Header, HTTPException

key = os.environ.get('JWT_KEY')


def get_encoded_url(file_path):
    return '/api/static/' + base64.urlsafe_b64encode(file_path.encode()).decode().rstrip('=')


def decode_file_path(encoded_path):
    encoded_path = encoded_path + ((len(encoded_path) % 4) * '=')
    return base64.urlsafe_b64decode(encoded_path).decode()

def check_password(plain_text_password, hashed_password):
    return bcrypt.checkpw(plain_text_password.encode(), hashed_password)


def get_hashed_password(plain_text_password):
    return bcrypt.hashpw(plain_text_password.encode(), bcrypt.gensalt())


def generate_jwt_token(user_id):
    return jwt.encode({'user_id': user_id}, key, algorithm="HS256")


def generate_game_token(payload):
    return jwt.encode(payload, key, algorithm="HS256")


async def get_user_id(token: str | None = Header(default=None)):
    user_id = None
    try:
        payload = jwt.decode(token, key, ['HS256'])
        user_id = payload['user_id']
    except jwt.exceptions.DecodeError:
        pass

    return user_id


async def verify_token(token: str = Header()):
    try:
        payload = jwt.decode(token, key, ['HS256'])
    except jwt.exceptions.DecodeError:
        raise HTTPException(status_code=403, detail='Invalid token.')
    return payload['user_id']
