import os
from flask import Flask
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from .config import Config
from .database import close_db
from .extensions import cors, bcrypt, jwt, socketio

def create_app(config_object=Config):
    """
    Application factory pattern.
    Creates and configures the Flask application.
    """
    from .app import app as flask_app
    flask_app.config.from_object(config_object)
    
    # Re-initialize extensions with the configured app
    cors.init_app(flask_app, resources={r"/api/*": {"origins": flask_app.config.get('CORS_ORIGINS')}})
    bcrypt.init_app(flask_app)
    jwt.init_app(flask_app)
    socketio.init_app(flask_app, cors_allowed_origins=flask_app.config.get('CORS_ORIGINS'))
    
    return flask_app