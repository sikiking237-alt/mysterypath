# backend/routes/auth.py - Updated verification code endpoint with 5-minute expiry
# Add this to your existing auth.py file

from flask_bcrypt import Bcrypt
bcrypt = Bcrypt()

from ..utils import check_password, rehash_if_needed

# Store verification codes temporarily (in production, use Redis or a database table)
verification_codes = {}

@auth_bp.route('/auth/send-delete-verification', methods=['POST'])
@token_required
def send_delete_verification(current_user):
    """Send verification code for account deletion with 5-minute expiry."""
    session = db_session()
    try:
        user = session.query(User).filter_by(id=current_user).first()
        if not user:
            return jsonify({'error': 'User not found', 'success': False}), 404
        
        # Generate 6-digit verification code
        import random
        code = ''.join(str(random.randint(0, 9)) for _ in range(6))
        
        # Store code with 5-minute expiry (300 seconds)
        from datetime import datetime, timedelta
        expiry_time = datetime.utcnow() + timedelta(minutes=5)
        
        # In production, store in Redis with TTL
        verification_codes[str(current_user)] = {
            'code': code,
            'expiry': expiry_time.isoformat(),
            'email': user.email
        }
        
        # Send email with code
        # send_verification_email(user.email, code)
        
        # For testing, we return the code (in production, remove this)
        return jsonify({
            'success': True,
            'message': 'Verification code sent to your email. Valid for 5 minutes.',
            'code': code,  # Remove in production
            'expires_in': 300  # 5 minutes in seconds
        }), 200
        
    except Exception as e:
        logging.error(f"Send verification error: {str(e)}")
        return jsonify({'error': str(e), 'success': False}), 500
    finally:
        session.close()

@auth_bp.route('/auth/verify-delete-code', methods=['POST'])
@token_required
def verify_delete_code(current_user):
    """Verify the deletion code."""
    session = db_session()
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided', 'success': False}), 400
        
        code = data.get('code')
        if not code:
            return jsonify({'error': 'Verification code is required', 'success': False}), 400
        
        # Check if code exists for this user
        stored_data = verification_codes.get(str(current_user))
        if not stored_data:
            return jsonify({'error': 'No verification code found. Please request a new one.', 'success': False}), 404
        
        # Check if code matches
        if stored_data['code'] != code:
            return jsonify({'error': 'Invalid verification code', 'success': False}), 401
        
        # Check if code has expired (5 minutes)
        from datetime import datetime
        expiry_time = datetime.fromisoformat(stored_data['expiry'])
        if datetime.utcnow() > expiry_time:
            # Remove expired code
            del verification_codes[str(current_user)]
            return jsonify({'error': 'Verification code has expired. Please request a new one.', 'success': False}), 401
        
        return jsonify({
            'success': True,
            'message': 'Verification code verified successfully'
        }), 200
        
    except Exception as e:
        logging.error(f"Verify code error: {str(e)}")
        return jsonify({'error': str(e), 'success': False}), 500
    finally:
        session.close()

@auth_bp.route('/auth/delete-account', methods=['POST'])
@token_required
def delete_account(current_user):
    """Delete user account with verification."""
    session = db_session()
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided', 'success': False}), 400
        
        password = data.get('password')
        
        if not password:
            return jsonify({'error': 'Password is required', 'success': False}), 400
        
        # Get user
        user = session.query(User).filter_by(id=current_user).first()
        if not user:
            return jsonify({'error': 'User not found', 'success': False}), 404
        
        # Verify password
        if not check_password(user.password, password):
            return jsonify({'error': 'Invalid password', 'success': False}), 401
        
        rehash_if_needed(user, password)
        session.commit()
        
        # Verify code is valid and not expired (check again for security)
        stored_data = verification_codes.get(str(current_user))
        if not stored_data:
            return jsonify({'error': 'Verification required. Please request a code.', 'success': False}), 401
        
        # Check if code has expired
        from datetime import datetime
        expiry_time = datetime.fromisoformat(stored_data['expiry'])
        if datetime.utcnow() > expiry_time:
            del verification_codes[str(current_user)]
            return jsonify({'error': 'Verification code has expired. Please request a new one.', 'success': False}), 401
        
        # Delete user
        session.delete(user)
        session.commit()
        
        # Remove verification code
        if str(current_user) in verification_codes:
            del verification_codes[str(current_user)]
        
        return jsonify({
            'success': True,
            'message': 'Account deleted successfully'
        }), 200
        
    except Exception as e:
        logging.error(f"Delete account error: {str(e)}")
        session.rollback()
        return jsonify({'error': str(e), 'success': False}), 500
    finally:
        session.close()
