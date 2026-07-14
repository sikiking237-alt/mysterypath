import os
import secrets
import requests
from flask import Blueprint, request, jsonify, redirect, url_for, current_app
from jose import jwt
from datetime import datetime, timedelta, timezone
from ..database import db_session, User

github_oauth_bp = Blueprint('github_oauth_bp', __name__)

GITHUB_CLIENT_ID = os.getenv('GITHUB_CLIENT_ID')
GITHUB_CLIENT_SECRET = os.getenv('GITHUB_CLIENT_SECRET')

GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'
GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'
GITHUB_USER_API_URL = 'https://api.github.com/user'

REDIRECT_URI = os.environ.get('FRONTEND_URL', 'http://localhost:5174') + '/auth/callback'
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5174')

def create_access_token(data, expires_delta):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, current_app.config['SECRET_KEY'], algorithm=current_app.config.get('JWT_ALGORITHM', 'HS256'))

@github_oauth_bp.route('/github')
def github_login():
    if not GITHUB_CLIENT_ID:
        return jsonify({"error": "GitHub OAuth is not configured on the server."}), 500

    scope = 'read:user user:email'
    github_auth_url = f"{GITHUB_AUTH_URL}?client_id={GITHUB_CLIENT_ID}&redirect_uri={REDIRECT_URI}&scope={scope}"
    
    return redirect(github_auth_url)

@github_oauth_bp.route('/github/callback')
def github_callback():
    session_db = db_session()
    code = request.args.get('code')

    if not code:
        return redirect(f"{FRONTEND_URL}/auth/callback?error=Authorization code not provided")

    token_payload = {
        'client_id': GITHUB_CLIENT_ID,
        'client_secret': GITHUB_CLIENT_SECRET,
        'code': code,
        'redirect_uri': REDIRECT_URI,
    }
    headers = {'Accept': 'application/json'}
    token_res = requests.post(GITHUB_TOKEN_URL, json=token_payload, headers=headers)
    token_data = token_res.json()

    if 'error' in token_data:
        return redirect(f"{FRONTEND_URL}/auth/callback?error={token_data.get('error_description', 'Failed to get access token')}")

    access_token = token_data.get('access_token')

    user_headers = {'Authorization': f'token {access_token}'}
    user_res = requests.get(GITHUB_USER_API_URL, headers=user_headers)
    github_user_data = user_res.json()

    email = github_user_data.get('email')
    github_id = github_user_data.get('id')
    name = github_user_data.get('name') or github_user_data.get('login')
    avatar_url = github_user_data.get('avatar_url')

    if not email:
        email_res = requests.get(f'{GITHUB_USER_API_URL}/emails', headers=user_headers)
        emails = email_res.json()
        primary_email = next((e['email'] for e in emails if e['primary']), None)
        email = primary_email or (emails[0]['email'] if emails else None)

    if not email:
        return redirect(f"{FRONTEND_URL}/auth/callback?error=Email not available from GitHub")

    user = session_db.query(User).filter_by(email=email).first()
    if not user:
        user = User(
            name=name,
            email=email,
            github_id=str(github_id),
            profile_image=avatar_url,
            password=secrets.token_urlsafe(32)
        )
        session_db.add(user)
        session_db.commit()
    else:
        if not user.github_id:
            user.github_id = str(github_id)
            session_db.commit()

    expires = timedelta(hours=current_app.config.get('JWT_EXPIRATION_HOURS', 24))
    app_token = create_access_token(data={"user_id": user.id}, expires_delta=expires)

    session_db.close()

    return redirect(f"{FRONTEND_URL}/auth/callback?token={app_token}")