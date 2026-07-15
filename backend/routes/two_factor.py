# backend/routes/two_factor.py
from flask import Blueprint, request, jsonify, current_app
from flask_cors import cross_origin
from ..extensions import token_required
from ..database import db_session, User
import logging
import pyotp
import qrcode
import io
import base64
from datetime import datetime, timedelta

two_factor_bp = Blueprint('two_factor', __name__)

@two_factor_bp.route('/two-factor/setup', methods=['POST'])
@token_required
@cross_origin()
def setup_two_factor(current_user):
    """Setup 2FA for a user."""
    session = db_session()
    try:
        user = session.query(User).filter_by(id=current_user).first()
        if not user:
            return jsonify({'error': 'User not found', 'success': False}), 404
        
        # Generate secret key
        secret = pyotp.random_base32()
        
        user.two_factor_secret = secret
        session.commit()
        
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(user.email, issuer_name="MysteryPath")
        
        # Create QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        qr_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        return jsonify({
            'success': True,
            'secret': secret,
            'qr_code': qr_base64,
            'provisioning_uri': provisioning_uri
        }), 200
        
    except Exception as e:
        logging.error(f"2FA setup error: {str(e)}")
        return jsonify({'error': str(e), 'success': False}), 500
    finally:
        session.close()

@two_factor_bp.route('/two-factor/verify', methods=['POST'])
@token_required
@cross_origin()
def verify_two_factor(current_user):
    """Verify 2FA code."""
    session = db_session()
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided', 'success': False}), 400
        
        secret = data.get('secret')
        code = data.get('code')
        
        if not secret or not code:
            return jsonify({'error': 'Secret and code are required', 'success': False}), 400
        
        user = session.query(User).filter_by(id=current_user).first()
        if not user or not user.two_factor_secret:
            return jsonify({'error': '2FA not set up', 'success': False}), 400
        
        if secret != user.two_factor_secret:
            return jsonify({'error': 'Invalid secret', 'success': False}), 400
        
        totp = pyotp.TOTP(secret)
        is_valid = totp.verify(code)
        
        if is_valid:
            # Store the secret in user record (you'll need to add a column)
            # For demo, we'll just return success
            return jsonify({
                'success': True,
                'message': '2FA verification successful'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Invalid 2FA code'
            }), 400
        
    except Exception as e:
        logging.error(f"2FA verify error: {str(e)}")
        return jsonify({'error': str(e), 'success': False}), 500
    finally:
        session.close()

@two_factor_bp.route('/two-factor/disable', methods=['POST'])
@token_required
@cross_origin()
def disable_two_factor(current_user):
    """Disable 2FA for a user."""
    session = db_session()
    try:
        user = session.query(User).filter_by(id=current_user).first()
        if not user:
            return jsonify({'error': 'User not found', 'success': False}), 404
        
        user.two_factor_secret = None
        session.commit()
        
        return jsonify({
            'success': True,
            'message': '2FA has been disabled'
        }), 200
        
    except Exception as e:
        logging.error(f"2FA disable error: {str(e)}")
        return jsonify({'error': str(e), 'success': False}), 500
    finally:
        session.close()

@two_factor_bp.route('/two-factor/status', methods=['GET'])
@token_required
@cross_origin()
def get_two_factor_status(current_user):
    """Check if 2FA is enabled for a user."""
    session = db_session()
    try:
        user = session.query(User).filter_by(id=current_user).first()
        if not user:
            return jsonify({'error': 'User not found', 'success': False}), 404
        
        is_enabled = bool(user.two_factor_secret)
        
        return jsonify({
            'success': True,
            'is_enabled': is_enabled
        }), 200
        
    except Exception as e:
        logging.error(f"2FA status error: {str(e)}")
        return jsonify({'error': str(e), 'success': False}), 500
    finally:
        session.close()
