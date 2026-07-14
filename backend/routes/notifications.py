from flask import Blueprint, jsonify
from ..extensions import token_required
from ..database import Notification, get_db_session
from sqlalchemy import func
import logging

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/my', methods=['GET'])
@token_required
def get_my_notifications(current_user):
    try:
        db = get_db_session()
        notifications = db.query(Notification).filter_by(user_id=current_user)\
            .order_by(Notification.created_at.desc())\
            .limit(20)\
            .all()
        
        result = []
        for notif in notifications:
            result.append({
                'id': notif.id,
                'title': notif.title,
                'message': notif.message,
                'type': notif.type,
                'is_read': notif.is_read,
                'created_at': notif.created_at.isoformat() if notif.created_at else None
            })
        
        return jsonify(result), 200
    except Exception as e:
        logging.error(f"Notifications error: {str(e)}")
        return jsonify([]), 200

@notifications_bp.route('/unread/count', methods=['GET'])
@token_required
def get_unread_notification_count(current_user):
    try:
        db = get_db_session()
        count = db.query(func.count(Notification.id)).filter(
            Notification.user_id == current_user,
            Notification.is_read == False
        ).scalar() or 0
        return jsonify({'count': count}), 200
    except Exception as e:
        logging.error(f"Unread notification count error: {str(e)}")
        return jsonify({'count': 0}), 200

@notifications_bp.route('/mark-read/<int:notification_id>', methods=['PUT'])
@token_required
def mark_notification_read(current_user, notification_id):
    try:
        db = get_db_session()
        notification = db.query(Notification).filter_by(
            id=notification_id,
            user_id=current_user
        ).first()
        
        if notification:
            notification.is_read = True
            db.commit()
            return jsonify({'success': True}), 200
        return jsonify({'success': False, 'error': 'Notification not found'}), 404
    except Exception as e:
        logging.error(f"Mark notification read error: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@notifications_bp.route('/mark-all-read', methods=['PUT'])
@token_required
def mark_all_notifications_read(current_user):
    try:
        db = get_db_session()
        result = db.query(Notification).filter(
            Notification.user_id == current_user,
            Notification.is_read == False
        ).update({'is_read': True}, synchronize_session=False)
        
        db.commit()
        return jsonify({'success': True, 'message': f'{result} notifications marked as read.'}), 200
    except Exception as e:
        logging.error(f"Mark all notifications read error: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500