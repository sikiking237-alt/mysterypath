import os
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from config import Config
from database import close_db
from routes.github_oauth import github_oauth_bp

# --- App Initialization ---
app = Flask(__name__)
app.config.from_object(Config)

# --- Extensions Initialization ---
CORS(app, resources={r"/api/*": Config.CORS_ORIGINS})
bcrypt = Bcrypt(app)
jwt = JWTManager(app)
socketio = SocketIO(app, cors_allowed_origins=Config.CORS_ORIGINS)

# --- Register Blueprints ---
app.register_blueprint(github_oauth_bp, url_prefix='/api')
# You can register other blueprints here as your app grows

# --- Request Teardown ---
@app.teardown_appcontext
def shutdown_session(exception=None):
    """Remove database session at the end of the request."""
    close_db(exception)

# --- Health Check Route (for testing) ---
@app.route('/api/health')
def health_check():
    return "OK", 200
