from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_socketio import SocketIO
from flask_jwt_extended import JWTManager
from flask import jsonify

cors = CORS()
bcrypt = Bcrypt()
socketio = SocketIO()
jwt = JWTManager()

try:
    from flask_mail import Mail
    mail = Mail()
except ImportError:
    mail = None


def token_required(fn):
    from functools import wraps
    from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        return fn(current_user_id, *args, **kwargs)
    return wrapper


def admin_required(fn):
    from functools import wraps
    from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
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
    from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
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
