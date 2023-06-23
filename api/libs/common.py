import base64
import bcrypt
import datetime
import jwt
import os
import uuid

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()
SECRET_KEY = os.environ.get('SECRET_KEY')


def get_encoded_url(file_path):
    return '/api/static/' + base64.urlsafe_b64encode(file_path.encode()).decode().rstrip('=')


def decode_file_path(encoded_path):
    encoded_path = encoded_path + ((len(encoded_path) % 4) * '=')
    return base64.urlsafe_b64decode(encoded_path).decode()


def check_password(plain_text_password, hashed_password):
    return bcrypt.checkpw(plain_text_password.encode(), hashed_password)


def get_hashed_password(plain_text_password):
    return bcrypt.hashpw(plain_text_password.encode(), bcrypt.gensalt())


def get_user_token(user_id, guest):
    return jwt.encode({'user_id': user_id, 'guest': guest}, SECRET_KEY, algorithm='HS256')


def generate_jwt_token(user_id):
    return jwt.encode({'user_id': user_id}, SECRET_KEY, algorithm="HS256")


def generate_game_token(payload):
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def is_valid_uuid4(string):
    try:
        uuid_obj = uuid.UUID(string, version=4)
        return str(uuid_obj) == string
    except ValueError:
        return False


def get_logged_in_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    scheme, token = credentials.scheme, credentials.credentials

    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_id = payload.get("user_id")
        guest = payload.get("guest")

        if user_id is None or guest is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if guest is True:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You have to br logged in"
            )

        return {'id': user_id, 'guest': guest}
    except jwt.exceptions.DecodeError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    scheme, token = credentials.scheme, credentials.credentials

    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_id = payload.get("user_id")
        guest = payload.get("guest")

        if user_id is None or guest is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return {'id': user_id, 'guest': guest}
    except jwt.exceptions.DecodeError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def decode_user_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_id = payload.get("user_id")
        guest = payload.get("guest")
        if user_id is None or guest is None:
            return None, None
        return user_id, guest
    except jwt.exceptions.DecodeError as e:
        return None, None
