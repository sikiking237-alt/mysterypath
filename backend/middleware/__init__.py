from flask import Flask
from flask_cors import CORS

from flask_socketio import SocketIO
import os


socketio = SocketIO(cors_allowed_origins="*")

def create_app(config_class=None):
    app = Flask(__name__)
    
    if config_class:
        app.config.from_object(config_class)
    else:
        app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'super-secret-key')
        app.config['DATABASE_NAME'] = os.environ.get('DATABASE_NAME', 'mysterypath.db')
        app.config['UPLOAD_FOLDER'] = 'static/uploads/course_images'
    
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5174')
    CORS(app, origins=[
        frontend_url,
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175"
    ])
    
    
    socketio.init_app(app, cors_allowed_origins="*")
    
    # Import and register blueprints
    from backend.routes.auth import auth_bp
    from backend.routes.instructor_routes import instructor_bp
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(instructor_bp, url_prefix='/api')
    
    return app
