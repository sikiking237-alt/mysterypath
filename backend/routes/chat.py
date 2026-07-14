# backend/routes/chat.py
from flask import Blueprint, jsonify, request
from ..extensions import token_required, instructor_required
from ..database import db_session, User, ChatGroup, ChatGroupMember, Message as DBMessage, InstructorChatSettings, ChatAccess
from sqlalchemy import func, or_, and_
import logging
import traceback
from datetime import datetime, timezone

chat_bp = Blueprint('chat', __name__)


def _get_chat_settings(session, instructor_id):
    return session.query(InstructorChatSettings).filter_by(instructor_id=instructor_id).first()


def _is_chat_allowed(session, instructor_id, user_id):
    settings = _get_chat_settings(session, instructor_id)
    if not settings:
        return True
    access = session.query(ChatAccess).filter_by(instructor_id=instructor_id, user_id=user_id).first()
    
    if settings.messages_blocked:
        return access is not None and access.status == 'allowed'
    else:
        return not access or access.status != 'blocked'


@chat_bp.route('/contacts', methods=['GET'])
@token_required
def get_chat_contacts(current_user):
    """Get all contacts for the current user."""
    session = db_session()
    try:
        logging.info(f"Fetching contacts for user: {current_user}")
        
        users = session.query(User).filter(User.id != current_user).all()
        logging.info(f"Found {len(users)} other users")
        
        contacts = []
        current_user_obj = session.query(User).filter_by(id=current_user).first()
        current_user_role = current_user_obj.role if current_user_obj else 'user'
        
        current_user_settings = _get_chat_settings(session, current_user) if current_user_role == 'instructor' else None
        
        for user in users:
            last_message = session.query(DBMessage).filter(
                or_(
                    and_(DBMessage.sender_id == current_user, DBMessage.receiver_id == user.id),
                    and_(DBMessage.sender_id == user.id, DBMessage.receiver_id == current_user)
                )
            ).order_by(DBMessage.created_at.desc()).first()
            
            contact = {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role,
                'profile_image': user.profile_image,
                'is_online': user.is_online or False,
                'last_message': last_message.content if last_message else None,
                'last_message_time': last_message.created_at.isoformat() if last_message else None,
                'unread_count': 0
            }
            
            if current_user_role == 'instructor' and user.role != 'instructor':
                contact['chat_messages_blocked'] = current_user_settings.messages_blocked if current_user_settings else False
                access = session.query(ChatAccess).filter_by(instructor_id=current_user, user_id=user.id).first()
                contact['chat_access_status'] = access.status if access else 'allowed'
                contact['is_instructor'] = False
            elif user.role == 'instructor':
                instructor_settings = _get_chat_settings(session, user.id)
                contact['chat_messages_blocked'] = instructor_settings.messages_blocked if instructor_settings else False
                access = session.query(ChatAccess).filter_by(instructor_id=user.id, user_id=current_user).first()
                contact['chat_access_status'] = access.status if access else 'allowed'
                contact['is_instructor'] = True
            
            contacts.append(contact)
        
        return jsonify({
            'success': True,
            'contacts': contacts
        }), 200
        
    except Exception as e:
        logging.error(f"Error fetching contacts: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({
            'error': str(e),
            'success': False
        }), 500
    finally:
        session.close()

@chat_bp.route('/messages', methods=['GET'])
@token_required
def get_chat_messages(current_user):
    """Get messages between current user and another user."""
    session = db_session()
    try:
        other_user_id = request.args.get('user_id', type=int)
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 50, type=int)
        offset = (page - 1) * limit
        
        if not other_user_id:
            return jsonify({'error': 'User ID is required', 'success': False}), 400
        
        messages = session.query(DBMessage).filter(
            or_(
                and_(DBMessage.sender_id == current_user, DBMessage.receiver_id == other_user_id),
                and_(DBMessage.sender_id == other_user_id, DBMessage.receiver_id == current_user)
            )
        ).order_by(DBMessage.created_at.desc()).offset(offset).limit(limit).all()
        
        # Mark messages as read
        unread_messages = session.query(DBMessage).filter(
            DBMessage.sender_id == other_user_id,
            DBMessage.receiver_id == current_user,
            DBMessage.is_read == False
        ).all()
        
        for msg in unread_messages:
            msg.is_read = True
        
        session.commit()
        
        messages_list = [{
            'id': msg.id,
            'sender_id': msg.sender_id,
            'receiver_id': msg.receiver_id,
            'content': msg.content,
            'created_at': msg.created_at.isoformat() if msg.created_at else None,
            'is_read': msg.is_read,
            'type': msg.type
        } for msg in messages]
        
        return jsonify({
            'success': True,
            'messages': messages_list,
            'total': len(messages_list)
        }), 200
        
    except Exception as e:
        logging.error(f"Error fetching messages: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({'error': str(e), 'success': False}), 500
    finally:
        session.close()

@chat_bp.route('/messages', methods=['POST'])
@token_required
def send_message(current_user):
    """Send a message to another user."""
    session = db_session()
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided', 'success': False}), 400
        
        receiver_id = data.get('receiver_id')
        content = data.get('content', '').strip()
        message_type = data.get('type', 'user')
        
        if not receiver_id:
            return jsonify({'error': 'Receiver ID is required', 'success': False}), 400
        
        if not content:
            return jsonify({'error': 'Message content is required', 'success': False}), 400
        
        receiver = session.query(User).filter_by(id=receiver_id).first()
        if not receiver:
            return jsonify({'error': 'Receiver not found', 'success': False}), 404
        
        if receiver.role == 'instructor':
            if not _is_chat_allowed(session, receiver_id, current_user):
                return jsonify({'error': 'This instructor is not accepting messages right now.', 'success': False}), 403
        
        # created_at is auto-added by TimestampMixin
        new_message = DBMessage(
            sender_id=current_user,
            receiver_id=receiver_id,
            content=content,
            type=message_type
        )
        session.add(new_message)
        session.commit()
        
        from ..extensions import socketio
        message_data = {
            'id': new_message.id,
            'sender_id': new_message.sender_id,
            'receiver_id': new_message.receiver_id,
            'content': new_message.content,
            'created_at': new_message.created_at.isoformat() if new_message.created_at else None,
            'type': new_message.type,
            'is_read': new_message.is_read
        }
        
        socketio.emit('new_message', message_data, room=f'user_{receiver_id}')
        socketio.emit('message_sent', message_data, room=f'user_{current_user}')
        
        return jsonify({
            'success': True,
            'message': 'Message sent successfully',
            'data': message_data
        }), 201
        
    except Exception as e:
        logging.error(f"Error sending message: {str(e)}")
        logging.error(traceback.format_exc())
        session.rollback()
        return jsonify({'error': str(e), 'success': False}), 500
    finally:
        session.close()

@chat_bp.route('/unread/count', methods=['GET'])
@token_required
def get_unread_count(current_user):
    """Get unread message count for current user."""
    session = db_session()
    try:
        count = session.query(func.count(DBMessage.id)).filter(
            DBMessage.receiver_id == current_user,
            DBMessage.is_read == False
        ).scalar() or 0
        
        return jsonify({
            'success': True,
            'count': count
        }), 200
        
    except Exception as e:
        logging.error(f"Error getting unread count: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({'error': str(e), 'success': False}), 500
    finally:
        session.close()

@chat_bp.route('/groups', methods=['GET'])
@token_required
def get_chat_groups(current_user):
    """Get all chat groups for current user."""
    session = db_session()
    try:
        groups = session.query(ChatGroup).join(
            ChatGroupMember, ChatGroup.id == ChatGroupMember.group_id
        ).filter(ChatGroupMember.user_id == current_user).all()
        
        groups_list = []
        for group in groups:
            members = session.query(ChatGroupMember).filter_by(group_id=group.id).all()
            member_ids = [m.user_id for m in members]
            
            groups_list.append({
                'id': group.id,
                'name': group.name,
                'creator_id': group.creator_id,
                'group_icon': group.group_icon,
                'members': member_ids,
                'created_at': group.created_at.isoformat() if group.created_at else None
            })
        
        return jsonify({
            'success': True,
            'groups': groups_list
        }), 200
        
    except Exception as e:
        logging.error(f"Error fetching groups: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({'error': str(e), 'success': False}), 500
    finally:
        session.close()

@chat_bp.route('/groups', methods=['POST'])
@token_required
def create_chat_group(current_user):
    """Create a new chat group."""
    session = db_session()
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided', 'success': False}), 400
        
        name = data.get('name', '').strip()
        member_ids = data.get('member_ids', [])
        
        if not name:
            return jsonify({'error': 'Group name is required', 'success': False}), 400
        
        if current_user not in member_ids:
            member_ids.append(current_user)
        
        from datetime import datetime
        new_group = ChatGroup(
            name=name,
            creator_id=current_user,
            created_at=datetime.utcnow()
        )
        session.add(new_group)
        session.flush()
        
        for member_id in member_ids:
            member = ChatGroupMember(
                group_id=new_group.id,
                user_id=member_id
            )
            session.add(member)
        
        session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Group created successfully',
            'group': {
                'id': new_group.id,
                'name': new_group.name,
                'creator_id': new_group.creator_id,
                'members': member_ids,
                'created_at': new_group.created_at.isoformat()
            }
        }), 201
        
    except Exception as e:
        logging.error(f"Error creating group: {str(e)}")
        logging.error(traceback.format_exc())
        session.rollback()
        return jsonify({'error': str(e), 'success': False}), 500
    finally:
        session.close()


# ========== INSTRUCTOR CHAT ACCESS CONTROL ==========

@chat_bp.route('/instructor/chat/access', methods=['GET'])
@instructor_required
def get_instructor_chat_access(current_user):
    """Get chat access settings and list of users with their access status."""
    session = db_session()
    try:
        settings = _get_chat_settings(session, current_user)
        if not settings:
            settings = InstructorChatSettings(instructor_id=current_user, messages_blocked=False)
            session.add(settings)
            session.commit()
        
        access_rules = session.query(ChatAccess).filter_by(instructor_id=current_user).all()
        access_list = []
        for rule in access_rules:
            user = session.query(User).filter_by(id=rule.user_id).first()
            if user:
                access_list.append({
                    'user_id': user.id,
                    'name': user.name,
                    'email': user.email,
                    'role': user.role,
                    'status': rule.status,
                    'updated_at': rule.updated_at.isoformat() if rule.updated_at else None
                })
        
        return jsonify({
            'success': True,
            'messages_blocked': settings.messages_blocked,
            'access_list': access_list
        }), 200
        
    except Exception as e:
        logging.error(f"Error fetching instructor chat access: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({'error': str(e), 'success': False}), 500
    finally:
        session.close()


@chat_bp.route('/instructor/chat/access', methods=['POST'])
@instructor_required
def update_instructor_chat_access(current_user):
    """Allow or block a specific user from chatting with the instructor."""
    session = db_session()
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided', 'success': False}), 400
        
        user_id = data.get('user_id')
        status = data.get('status')  # 'allowed' or 'blocked'
        
        if not user_id or not status:
            return jsonify({'error': 'user_id and status are required', 'success': False}), 400
        
        if status not in ['allowed', 'blocked']:
            return jsonify({'error': "status must be 'allowed' or 'blocked'", 'success': False}), 400
        
        user = session.query(User).filter_by(id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found', 'success': False}), 404
        
        access = session.query(ChatAccess).filter_by(instructor_id=current_user, user_id=user_id).first()
        if access:
            access.status = status
            access.updated_at = datetime.now(timezone.utc)
        else:
            access = ChatAccess(instructor_id=current_user, user_id=user_id, status=status)
            session.add(access)
        
        session.commit()
        
        return jsonify({
            'success': True,
            'message': f"User {user.name} has been {status}",
            'access': {
                'user_id': user_id,
                'name': user.name,
                'status': status
            }
        }), 200
        
    except Exception as e:
        logging.error(f"Error updating instructor chat access: {str(e)}")
        logging.error(traceback.format_exc())
        session.rollback()
        return jsonify({'error': str(e), 'success': False}), 500
    finally:
        session.close()


@chat_bp.route('/instructor/chat/block-all', methods=['POST'])
@instructor_required
def block_all_instructor_messages(current_user):
    """Block all incoming messages for the instructor."""
    session = db_session()
    try:
        settings = _get_chat_settings(session, current_user)
        if not settings:
            settings = InstructorChatSettings(instructor_id=current_user, messages_blocked=False)
            session.add(settings)
            session.commit()
        settings.messages_blocked = True
        session.commit()
        
        return jsonify({
            'success': True,
            'message': 'All incoming messages have been blocked.',
            'messages_blocked': True
        }), 200
        
    except Exception as e:
        logging.error(f"Error blocking all messages: {str(e)}")
        logging.error(traceback.format_exc())
        session.rollback()
        return jsonify({'error': str(e), 'success': False}), 500
    finally:
        session.close()


@chat_bp.route('/instructor/chat/unblock-all', methods=['POST'])
@instructor_required
def unblock_all_instructor_messages(current_user):
    """Unblock all incoming messages for the instructor."""
    session = db_session()
    try:
        settings = _get_chat_settings(session, current_user)
        if not settings:
            settings = InstructorChatSettings(instructor_id=current_user, messages_blocked=False)
            session.add(settings)
            session.commit()
        settings.messages_blocked = False
        session.commit()
        
        return jsonify({
            'success': True,
            'message': 'All incoming messages have been unblocked.',
            'messages_blocked': False
        }), 200
        
    except Exception as e:
        logging.error(f"Error unblocking all messages: {str(e)}")
        logging.error(traceback.format_exc())
        session.rollback()
        return jsonify({'error': str(e), 'success': False}), 500
    finally:
        session.close()
