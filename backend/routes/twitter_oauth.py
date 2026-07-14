import os
import secrets
import hashlib
import base64
import requests
from flask import Blueprint, request, jsonify, redirect, current_app, session
from jose import jwt
from datetime import datetime, timedelta, timezone
from ..database import db_session, User

twitter_oauth_bp = Blueprint('twitter_oauth_bp', __name__)

TWITTER_CLIENT_ID = os.getenv('TWITTER_CLIENT_ID')
TWITTER_CLIENT_SECRET = os.getenv('TWITTER_CLIENT_SECRET')

TWITTER_AUTH_URL = 'https://twitter.com/i/oauth2/authorize'
TWITTER_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token'
TWITTER_USER_API_URL = 'https://api.twitter.com/2/users/me'

REDIRECT_URI = os.environ.get('FRONTEND_URL', 'http://localhost:5174') + '/auth/callback'
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5174')

def generate_code_verifier():
    return secrets.token_urlsafe(64)

def generate_code_challenge(verifier):
    challenge = hashlib.sha256(verifier.encode('utf-8')).digest()
    return base64.urlsafe_b64encode(challenge).decode('utf-8').rstrip('=')

def create_access_token(data, expires_delta):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, current_app.config['SECRET_KEY'], algorithm=current_app.config.get('JWT_ALGORITHM', 'HS256'))

@twitter_oauth_bp.route('/twitter')
def twitter_login():
    if not TWITTER_CLIENT_ID:
        return jsonify({"error": "Twitter OAuth is not configured on the server."}), 500

    code_verifier = generate_code_verifier()
    code_challenge = generate_code_challenge(code_verifier)
    state = secrets.token_urlsafe(16)

    session['twitter_code_verifier'] = code_verifier
    session['twitter_state'] = state

    scope = 'tweet.read users.read follows.read'
    auth_url = f"{TWITTER_AUTH_URL}?response_type=code&client_id={TWITTER_CLIENT_ID}&redirect_uri={REDIRECT_URI}&scope={scope}&state={state}&code_challenge={code_challenge}&code_challenge_method=S256"

    return redirect(auth_url)

@twitter_oauth_bp.route('/twitter/callback')
def twitter_callback():
    session_db = db_session()
    code = request.args.get('code')
    state = request.args.get('state')
    error = request.args.get('error')

    if error:
        return redirect(f"{FRONTEND_URL}/auth/callback?error={error}")

    if not code:
        return redirect(f"{FRONTEND_URL}/auth/callback?error=Authorization code not provided")

    stored_state = session.get('twitter_state')
    code_verifier = session.get('twitter_code_verifier')

    if not code_verifier:
        return redirect(f"{FRONTEND_URL}/auth/callback?error=Session expired. Please try again.")

    token_data = {
        'grant_type': 'authorization_code',
        'client_id': TWITTER_CLIENT_ID,
        'redirect_uri': REDIRECT_URI,
        'code': code,
        'code_verifier': code_verifier
    }

    headers = {'Content-Type': 'application/x-www-form-urlencoded'}

    if TWITTER_CLIENT_SECRET:
        credentials = base64.b64encode(f"{TWITTER_CLIENT_ID}:{TWITTER_CLIENT_SECRET}".encode()).decode()
        headers['Authorization'] = f'Basic {credentials}'

    token_res = requests.post(TWITTER_TOKEN_URL, data=token_data, headers=headers)
    token_json = token_res.json()

    if 'error' in token_json:
        return redirect(f"{FRONTEND_URL}/auth/callback?error={token_json.get('error_description', 'Failed to get access token')}")

    access_token = token_json.get('access_token')

    user_headers = {'Authorization': f'Bearer {access_token}'}
    user_res = requests.get(f"{TWITTER_USER_API_URL}?user.fields=name,username,profile_image_url", headers=user_headers)
    twitter_user_data = user_res.json()

    if 'data' not in twitter_user_data:
        return redirect(f"{FRONTEND_URL}/auth/callback?error=Failed to get user info from Twitter")

    twitter_user = twitter_user_data['data']
    twitter_id = twitter_user.get('id')
    name = twitter_user.get('name')
    username = twitter_user.get('username')
    profile_image_url = twitter_user.get('profile_image_url')

    email = f"{twitter_id}@twitter.local"

    user = session_db.query(User).filter_by(email=email).first()
    if not user:
        user = User(
            name=name or username,
            email=email,
            profile_image=profile_image_url,
            password=secrets.token_urlsafe(32)
        )
        session_db.add(user)
        session_db.commit()

    expires = timedelta(hours=current_app.config.get('JWT_EXPIRATION_HOURS', 24))
    app_token = create_access_token(data={"user_id": user.id}, expires_delta=expires)

    session.pop('twitter_code_verifier', None)
    session.pop('twitter_state', None)

    session_db.close()

    return redirect(f"{FRONTEND_URL}/auth/callback?token={app_token}")
