# backend/routes/auth.py - Add verification code endpoint
# Add this to your existing auth.py file

@auth_bp.route('/auth/send-delete-verification', methods=['POST'])
@token_required
def send_delete_verification(current_user):
    """Send verification code for account deletion."""
    session = db_session()
    try:
        user = session.query(User).filter_by(id=current_user).first()
        if not user:
            return jsonify({'error': 'User not found', 'success': False}), 404
        
        # Generate 6-digit verification code
        import random
        code = ''.join(str(random.randint(0, 9)) for _ in range(6))
        
        # Store code in session or temporary storage
        # For simplicity, we'll return it directly (in production, store in Redis or cache)
        # You should store this with an expiry time
        session_code = code
        # In production, you'd store this in Redis with a TTL
        
        # Send email with code
        # This is a placeholder - implement your email sending logic
        # send_verification_email(user.email, code)
        
        # For now, we'll return the code (in production, only send via email)
        return jsonify({
            'success': True,
            'message': 'Verification code sent to your email',
            'code': session_code  # Remove this in production - only for testing
        }), 200
        
    except Exception as e:
        logging.error(f"Send verification error: {str(e)}")
        return jsonify({'error': str(e), 'success': False}), 500
    finally:
        session.close()
