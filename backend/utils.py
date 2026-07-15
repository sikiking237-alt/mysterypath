# utils.py - FIXED VERSION

from flask import current_app, request
import logging
from cryptography.fernet import Fernet
from datetime import datetime, timedelta, timezone

# Import database and extensions carefully to avoid circular dependencies
from .database import get_db_session, User, ActivityLog
from .extensions import socketio, bcrypt
from werkzeug.security import check_password_hash as werkzeug_check_password_hash

_fernet = None

def get_fernet():
    """Initializes and returns a Fernet instance from the app config."""
    global _fernet
    if _fernet is None:
        key = current_app.config.get('FERNET_KEY')
        if not key:
            raise ValueError("FERNET_KEY is not set in the application configuration. Please generate one and add it to your .env file.")
        _fernet = Fernet(key.encode())
    return _fernet

def encrypt_data(data: str) -> str:
    """Encrypts a string and returns a URL-safe base64 encoded string."""
    f = get_fernet()
    encrypted_data = f.encrypt(data.encode('utf-8'))
    return encrypted_data.decode('utf-8')

def decrypt_data(encrypted_data: str) -> str:
    """Decrypts a string, returning an empty string on failure."""
    f = get_fernet()
    try:
        decrypted_data = f.decrypt(encrypted_data.encode('utf-8'))
        return decrypted_data.decode('utf-8')
    except Exception as e:
        logging.error(f"Failed to decrypt data: {e}")
        return ""

def log_activity(user_id, action, details=None, status='info', log_type='general', ip=None, email_for_log=None):
    """Logs user activity to the database and emits a socket event."""
    try:
        db = get_db_session()
        user_name = "System/Unknown"
        log_email = email_for_log or "system@local"
        log_user_id = None

        user = None
        if user_id:
            user = db.query(User).filter_by(id=user_id).first()

        if user:
            user_name = user.name
            log_email = user.email
            log_user_id = user.id

        if not ip:
            ip = request.remote_addr if request else None

        new_log = ActivityLog(
            user_id=log_user_id,
            user=user_name,
            email=log_email,
            action=action,
            details=details,
            status=status,
            type=log_type,
            ip=ip
        )
        db.add(new_log)
        db.commit()

        log_dict = {
            'id': new_log.id, 'user_id': new_log.user_id, 'user': new_log.user,
            'email': new_log.email, 'action': new_log.action, 'details': new_log.details,
            'status': new_log.status, 'type': new_log.type, 'ip': new_log.ip,
            'timestamp': new_log.timestamp.isoformat(), 'time': 'Just now'
        }

        try:
            socketio.emit('new-activity', log_dict, to='activity-room')
        except Exception as e:
            logging.error(f"Socket emit error in log_activity: {e}")

        return log_dict
    except Exception as e:
        logging.error(f"Error logging activity: {str(e)}", exc_info=True)
        if 'db' in locals():
            db.rollback()
        return None

def update_daily_streak(user_id):
    """Increment streak at most once per calendar day"""
    db = get_db_session()
    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        return {'streak_days': 0, 'longest_streak': 0, 'updated_today': False}

    today = datetime.now(timezone.utc).date()
    last_activity_date = None
    if user.last_login_date:
        if isinstance(user.last_login_date, datetime):
            last_activity_date = user.last_login_date.date()
        elif isinstance(user.last_login_date, str):
            try:
                last_activity_date = datetime.fromisoformat(user.last_login_date.replace('Z', '+00:00')).date()
            except (ValueError, TypeError):
                logging.warning(f"Could not parse last_login_date string '{user.last_login_date}' for user {user.id}. Resetting streak.")

    current_streak = user.streak_days or 0
    longest_streak = user.longest_streak or 0

    if last_activity_date == today:
        return {'streak_days': current_streak, 'longest_streak': longest_streak, 'updated_today': False}

    if last_activity_date == today - timedelta(days=1):
        current_streak += 1
    else:
        current_streak = 1

    longest_streak = max(longest_streak, current_streak)

    user.streak_days = current_streak
    user.longest_streak = longest_streak
    user.last_login_date = datetime.now(timezone.utc)
    db.commit()

    return {'streak_days': current_streak, 'longest_streak': longest_streak, 'updated_today': True}

# Add any other utility functions here

def generate_fernet_key():
    """Generate a new Fernet key for encryption."""
    from cryptography.fernet import Fernet
    return Fernet.generate_key().decode('utf-8')

def slugify(text: str) -> str:
    """Convert a string to a URL-friendly slug."""
    import re
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    text = text.strip('-')
    return text

def truncate_text(text: str, max_length: int = 200) -> str:
    """Truncate text to a maximum length with ellipsis."""
    if len(text) <= max_length:
        return text
    return text[:max_length].rsplit(' ', 1)[0] + '...'

def check_password(stored_hash: str, password: str) -> bool:
    """Check password against bcrypt or werkzeug scrypt hashes."""
    if not stored_hash:
        return False
    try:
        if stored_hash.startswith(('$2a$', '$2b$', '$2y$')):
            return bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8'))
        if stored_hash.startswith('scrypt:'):
            return werkzeug_check_password_hash(stored_hash, password)
    except Exception:
        return False
    return False

def rehash_if_needed(user, password: str) -> None:
    """Rehash password with bcrypt if it is using an old format."""
    if user and user.password and not user.password.startswith(('$2a$', '$2b$', '$2y$')):
        user.password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')