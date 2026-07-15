from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
# 
from datetime import datetime, timedelta, timezone
import re
import os
import random
import string
import logging
from ..extensions import mail
try:
    from flask_mail import Message
except ImportError:
    Message = None

from ..utils import check_password, rehash_if_needed

auth_bp = Blueprint('auth', __name__)
# 

def get_db():
    from ..database import get_db_session
    return get_db_session()

def is_valid_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

# REGISTER ROUTE
@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        db = get_db()
        
        print(f"Register attempt: {data.get('email')}")
        
        if not data.get('name') or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Name, email and password are required'}), 400
        
        if not is_valid_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        if len(data['password']) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        from ..database import User
        existing_user = db.query(User).filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'error': 'User already exists'}), 400
        
        hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        user = User(
            name=data['name'],
            email=data['email'],
            password=hashed_password,
            role='user',
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        access_token = create_access_token(identity=str(user.id))
        
        print(f"User registered: {user.email}")
        
        return jsonify({
            'success': True,
            'token': access_token,
            'user': {
                'id': str(user.id),
                'name': user.name,
                'email': user.email,
                'role': user.role
            }
        }), 201
        
    except Exception as e:
        print(f"Register error: {e}")
        if 'db' in locals():
            db.rollback()
        return jsonify({'error': str(e)}), 500

# LOGIN ROUTE
@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        db = get_db()
        
        print(f"Login attempt: {data.get('email')}")
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        from ..database import User
        user = db.query(User).filter_by(email=data['email']).first()
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if not check_password(user.password, data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        rehash_if_needed(user, data['password'])
        db.commit()
        
        access_token = create_access_token(identity=str(user.id))
        
        print(f"Login successful: {user.email}")
        
        return jsonify({
            'success': True,
            'token': access_token,
            'user': {
                'id': str(user.id),
                'name': user.name,
                'email': user.email,
                'role': user.role,
                'avatar': user.profile_image or ''
            }
        }), 200
        
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': str(e)}), 500

# FORGOT PASSWORD
@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    try:
        db = get_db()
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        from ..database import User
        user = db.query(User).filter_by(email=email).first()
        
        if not user:
            return jsonify({'success': True, 'message': 'If an account with this email exists, a password reset code has been sent.'}), 200
        
        reset_code = ''.join(random.choices(string.digits, k=6))
        user.reset_code = reset_code
        user.reset_code_expires = datetime.utcnow() + timedelta(minutes=15)
        db.commit()
        
        send_reset_email(user.email, reset_code)
        
        return jsonify({'success': True, 'message': 'Password reset code sent to your email.'}), 200
        
    except Exception as e:
        if 'db' in locals():
            db.rollback()
        print(f"Forgot password error: {e}")
        return jsonify({'error': str(e)}), 500

# VERIFY RESET CODE
@auth_bp.route('/verify-reset-code', methods=['POST'])
def verify_reset_code():
    try:
        db = get_db()
        data = request.get_json()
        email = data.get('email')
        code = data.get('code')

        if not email or not code:
            return jsonify({'error': 'Email and code are required'}), 400

        from ..database import User
        user = db.query(User).filter_by(email=email).first()

        if not user or not user.reset_code or user.reset_code != code:
            return jsonify({'error': 'Invalid or expired reset code'}), 401

        if not user.reset_code_expires or datetime.utcnow() > user.reset_code_expires:
            return jsonify({'error': 'Reset code has expired'}), 401

        return jsonify({'success': True, 'message': 'Code verified successfully'}), 200

    except Exception as e:
        print(f"Verify reset code error: {e}")
        return jsonify({'error': str(e)}), 500

# RESET PASSWORD
@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        db = get_db()
        data = request.get_json()
        email = data.get('email')
        code = data.get('code')
        new_password = data.get('new_password')
        
        if not email or not code or not new_password:
            return jsonify({'error': 'Email, code, and new password are required'}), 400
        
        if len(new_password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        from ..database import User
        user = db.query(User).filter_by(email=email).first()
        
        if not user or not user.reset_code or user.reset_code != code:
            return jsonify({'error': 'Invalid or expired reset code'}), 401
        
        if not user.reset_code_expires or datetime.utcnow() > user.reset_code_expires:
            return jsonify({'error': 'Reset code has expired'}), 401
        
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user.password = hashed_password
        user.reset_code = None
        user.reset_code_expires = None
        db.commit()
        
        return jsonify({'success': True, 'message': 'Password reset successfully'}), 200
        
    except Exception as e:
        if 'db' in locals():
            db.rollback()
        print(f"Reset password error: {e}")
        return jsonify({'error': str(e)}), 500

# EMAIL HELPER
def send_reset_email(email, reset_code):
    if not Message or not mail:
        logging.warning("Flask-Mail not available, cannot send reset email")
        return False
    
    try:
        subject = "Password Reset - MysteryPath"
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4f46e5;">Password Reset Request</h2>
            <p>You requested to reset your password for your MysteryPath account.</p>
            <p>Your password reset code is:</p>
            <h1 style="background: #f3f4f6; padding: 15px; text-align: center; letter-spacing: 5px; border-radius: 8px;">{reset_code}</h1>
            <p>This code will expire in <strong>15 minutes</strong>.</p>
            <p>If you did not request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 14px;">MysteryPath Team</p>
        </body>
        </html>
        """
        text_body = f"Your password reset code is: {reset_code}\nThis code will expire in 15 minutes.\nIf you did not request this, please ignore this email."
        
        msg = Message(
            subject=subject,
            recipients=[email],
            body=text_body,
            html=html_body,
            sender=current_app.config.get('MAIL_DEFAULT_SENDER')
        )
        mail.send(msg)
        logging.info(f"Password reset email sent to {email}")
        return True
    except Exception as e:
        logging.error(f"Error sending reset email: {e}")
        return False

# GET CURRENT USER
@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        current_user_id = get_jwt_identity()
        db = get_db()
        
        from ..database import User
        user = db.query(User).filter_by(id=current_user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'user': {
                'id': str(user.id),
                'name': user.name,
                'email': user.email,
                'role': user.role,
                'avatar': user.profile_image or ''
            }
        }), 200
        
    except Exception as e:
        print(f"Get user error: {e}")
        return jsonify({'error': str(e)}), 500

# LOGOUT
@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    return jsonify({'success': True}), 200

# UPDATE USER
@auth_bp.route('/update', methods=['PUT'])
@jwt_required()
def update_user():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        db = get_db()
        
        from ..database import User
        user = db.query(User).filter_by(id=current_user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        update_data = {}
        if 'name' in data:
            update_data['name'] = data['name']
        if 'email' in data:
            update_data['email'] = data['email']
        if 'bio' in data:
            user.bio = data['bio']
        if 'avatar' in data:
            update_data['profile_image'] = data['avatar']
        
        for key, value in update_data.items():
            if hasattr(user, key):
                setattr(user, key, value)
        
        db.commit()
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        print(f"Update user error: {e}")
        if 'db' in locals():
            db.rollback()
        return jsonify({'error': str(e)}), 500
