# Flask extensions
from flask_cors import CORS
from flask_jwt_extended import JWTManager, verify_jwt_in_request, get_jwt_identity
from flask_socketio import SocketIO
from flask_bcrypt import Bcrypt
from flask import jsonify

try:
    from flask_mail import Mail
    mail = Mail()
except ImportError:
    mail = None

# Initialize extensions
cors = CORS()
jwt = JWTManager()
socketio = SocketIO(cors_allowed_origins="*")
bcrypt = Bcrypt()


def token_required(fn):
    from functools import wraps
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        return fn(current_user_id, *args, **kwargs)
    return wrapper


def admin_required(fn):
    from functools import wraps
    from .database import get_db_session, User
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        db = get_db_session()
        user = db.query(User).filter_by(id=current_user_id).first()
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required', 'success': False}), 403
        return fn(current_user_id, *args, **kwargs)
    return wrapper


def instructor_required(fn):
    from functools import wraps
    from .database import get_db_session, User
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        db = get_db_session()
        user = db.query(User).filter_by(id=current_user_id).first()
        if not user or user.role not in ('instructor', 'admin'):
            return jsonify({'error': 'Instructor access required', 'success': False}), 403
        return fn(current_user_id, *args, **kwargs)
    return wrapper