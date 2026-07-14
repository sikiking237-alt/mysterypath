# backend/routes/auth.py - Add change password endpoint
# Add this to your existing auth.py file

from flask_bcrypt import Bcrypt
bcrypt = Bcrypt()

from ..utils import check_password, rehash_if_needed

@auth_bp.route('/auth/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    """Change user password."""
    session = db_session()
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided', 'success': False}), 400
        
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Current password and new password are required', 'success': False}), 400
        
        # Get user
        user = session.query(User).filter_by(id=current_user).first()
        if not user:
            return jsonify({'error': 'User not found', 'success': False}), 404
        
        # Verify current password
        if not check_password(user.password, current_password):
            return jsonify({'error': 'Current password is incorrect', 'success': False}), 401
        
        rehash_if_needed(user, current_password)
        
        # Validate new password
        if len(new_password) < 8:
            return jsonify({'error': 'New password must be at least 8 characters long', 'success': False}), 400
        
        # Update password
        user.password = bcrypt.generate_password_hash(new_password).decode('utf-8')
        session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Password changed successfully'
        }), 200
        
    except Exception as e:
        logging.error(f"Change password error: {str(e)}")
        session.rollback()
        return jsonify({'error': str(e), 'success': False}), 500
    finally:
        session.close()
