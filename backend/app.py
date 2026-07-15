# app.py - COMPLETE FIXED VERSION

# ========== ALL OTHER IMPORTS AFTER MONKEY_PATCH ==========
from .sockets import async_mode # Import async_mode after monkey_patching in run.py
from flask import Flask, request, jsonify, send_from_directory, g, render_template, url_for, redirect
import logging
try:
    from flask_mail import Message
except ImportError:
    Message = None
    logging.warning("Flask-Mail is not installed. Email functionality will be disabled.")
from werkzeug.utils import secure_filename 
from flask_socketio import emit, join_room, leave_room
from logging.handlers import RotatingFileHandler
import jwt as pyjwt
import secrets
import string
import uuid
import os
import requests
from functools import wraps
import json
import re
from datetime import datetime, timedelta, timezone
from authlib.integrations.flask_client import OAuth
import traceback
from urllib.parse import quote
from pydantic import ValidationError
from werkzeug.utils import secure_filename
import filetype

# ========== BLUEPRINT IMPORTS ==========
from .routes.auth import auth_bp
from .routes.instructor_routes import instructor_bp 
from .routes.notifications import notifications_bp
from .routes.chat import chat_bp
from .routes.two_factor import two_factor_bp
from .routes.github_oauth import github_oauth_bp
from .routes.twitter_oauth import twitter_oauth_bp
from .extensions import bcrypt, cors, mail, socketio, jwt, admin_required, token_required
from .database import (ActivityLog, Base, Certificate, Course, Enrollment, Notification, NotificationTemplate, User,
                      close_db, engine, get_db_session, ChatGroup, ChatGroupMember,
                      Message as DBMessage, MessageReaction, Module, Lesson,
                      QuizAttempt, Question, QuestionOption, LessonProgress,
                      LiveClass, LiveClassStudent, SystemSetting, Transaction, Note, PlannerTask,
                      Payout, PayoutDetail, Community, CommunityMember, Friend)
from .config import Config
from .schemas import CourseCreateSchema, CourseUpdateSchema
from .utils import encrypt_data, decrypt_data, log_activity, update_daily_streak
from sqlalchemy import func, text
from sqlalchemy.orm import joinedload
from sqlalchemy import func, text, or_, and_
from sqlalchemy.orm import joinedload, aliased

# ========== CONFIGURATION ==========
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ========== CREATE THE APP ==========
app = Flask(__name__)
app.url_map.strict_slashes = False
app.config.from_object(Config)

# Initialize mail if available
if Message:
    mail.init_app(app)

oauth = OAuth(app)

# ========== LOGGING CONFIGURATION ==========
LOG_DIR = os.path.join(BASE_DIR, 'logs')
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, 'app_errors.log')

# Create handlers
file_handler = RotatingFileHandler(LOG_FILE, maxBytes=10*1024*1024, backupCount=5)
file_handler.setLevel(logging.ERROR)
file_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(name)s - %(message)s [in %(pathname)s:%(lineno)d]')
file_handler.setFormatter(file_formatter)

console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))

# Get the root logger, clear existing handlers, and add our own
logger = logging.getLogger()
logger.setLevel(logging.INFO)
logger.handlers = []
logger.addHandler(file_handler)
logger.addHandler(console_handler)

# ========== CORS CONFIGURATION ==========
cors.init_app(
    app,
    origins=app.config.get('CORS_ORIGINS', []),
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization", "Accept", "X-Requested-With"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    max_age=3600)


jwt.init_app(app)

# ========== SOCKET.IO ==========
socketio.init_app(app, 
    cors_allowed_origins=app.config.get('CORS_ORIGINS', []),
    logger=True,
    engineio_logger=True,
    async_mode=async_mode,
    ping_timeout=60,
    ping_interval=25)

# A simple in-memory set for storing revoked JWT identifiers (JTI).
# In a production environment, this should be a persistent store like Redis.
token_blacklist = set()
app.token_blacklist = token_blacklist

# A dictionary to map session IDs to user IDs for online tracking
connected_users = {}

# ========== SOCKET.IO EVENT HANDLERS ==========
@socketio.on('connect')
def handle_connect():
    """Handle new client connections and authenticate them via JWT."""
    token = request.args.get('token')
    if not token:
        logging.warning("Socket.IO connection attempt without token.")
        return False  # Reject connection

    try:
        data = pyjwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = data.get('user_id')
        if not user_id:
            return False

        connected_users[request.sid] = user_id
        join_room(f'user_{user_id}')
        
        if data.get('role') == 'admin':
            join_room('activity-room')

        logging.info(f"Socket.IO Client connected: sid={request.sid}, user_id={user_id}")
        
        db = get_db_session()
        user = db.query(User).filter_by(id=user_id).first()
        if user:
            user.is_online = True
            user.last_seen = datetime.now(timezone.utc)
            db.commit()
            
    except (pyjwt.ExpiredSignatureError, pyjwt.InvalidTokenError) as e:
        logging.warning(f"Socket.IO connection rejected due to invalid token: {e}")
        return False

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnections and update online status."""
    user_id = connected_users.pop(request.sid, None)
    if user_id:
        def check_offline(uid):
            if uid not in connected_users.values():
                db = get_db_session()
                user = db.query(User).filter_by(id=uid).first()
                if user:
                    user.is_online = False
                    db.commit()
        socketio.sleep(5)
        check_offline(user_id)

    for room_id, participants in list(video_rooms.items()):
        if request.sid in participants:
            del participants[request.sid]
            if not participants:
                del video_rooms[room_id]
            emit('user-left', request.sid, to=room_id)

    logging.info(f"Socket.IO Client disconnected: sid={request.sid}, user_id={user_id}")

video_rooms = {}

@socketio.on('join-video-room')
def handle_join_video_room(data):
    room_id = data.get('roomId')
    user_name = data.get('userName', 'Anonymous')
    sid = request.sid

    if not room_id:
        return

    join_room(room_id)
    if room_id not in video_rooms:
        video_rooms[room_id] = {}

    video_rooms[room_id][sid] = {
        'user_name': user_name,
        'is_muted': False,
        'is_video_off': False,
        'is_hand_raised': False,
    }

    user_dict = {
        existing_sid: info['user_name']
        for existing_sid, info in video_rooms[room_id].items()
        if existing_sid != sid
    }

    emit('all-users', user_dict, to=sid)

    for existing_sid in list(video_rooms[room_id].keys()):
        if existing_sid != sid:
            emit('user-joined', {
                'callerID': sid,
                'userName': user_name,
            }, to=existing_sid)

@socketio.on('sending-signal')
def handle_sending_signal(data):
    user_to_signal = data.get('userToSignal')
    caller_id = data.get('callerID')
    signal = data.get('signal')
    emit('receiving-returned-signal', {
        'id': caller_id,
        'signal': signal,
    }, to=user_to_signal)

@socketio.on('returning-signal')
def handle_returning_signal(data):
    signal = data.get('signal')
    caller_id = data.get('callerID')
    emit('receiving-returned-signal', {
        'id': request.sid,
        'signal': signal,
    }, to=caller_id)

@socketio.on('toggle-audio')
def handle_toggle_audio(data):
    room_id = data.get('roomId')
    is_muted = data.get('isMuted', False)
    if room_id and request.sid in video_rooms.get(room_id, {}):
        video_rooms[room_id][request.sid]['is_muted'] = is_muted
    emit('audio-status-changed', {
        'userId': request.sid,
        'isMuted': is_muted,
    }, to=room_id, include_self=False)

@socketio.on('toggle-video')
def handle_toggle_video(data):
    room_id = data.get('roomId')
    is_video_off = data.get('isVideoOff', False)
    if room_id and request.sid in video_rooms.get(room_id, {}):
        video_rooms[room_id][request.sid]['is_video_off'] = is_video_off
    emit('video-status-changed', {
        'userId': request.sid,
        'isVideoOff': is_video_off,
    }, to=room_id, include_self=False)

@socketio.on('raise-hand')
def handle_raise_hand(data):
    room_id = data.get('roomId')
    is_raised = data.get('isRaised', False)
    if room_id and request.sid in video_rooms.get(room_id, {}):
        video_rooms[room_id][request.sid]['is_hand_raised'] = is_raised
    emit('hand-state-changed', {
        'userId': request.sid,
        'isRaised': is_raised,
    }, to=room_id, include_self=False)

@socketio.on('send-chat-message')
def handle_send_chat_message(data):
    room_id = data.get('roomId')
    message = data.get('message')
    if room_id and message:
        emit('chat-message', message, to=room_id, include_self=False)

@socketio.on('force-mute')
def handle_force_mute(data):
    room_id = data.get('roomId')
    if room_id and request.sid in video_rooms.get(room_id, {}):
        video_rooms[room_id][request.sid]['is_muted'] = True
    emit('force-mute', to=request.sid)

@socketio.on('toggle-spotlight')
def handle_toggle_spotlight(data):
    room_id = data.get('roomId')
    is_spotlighted = data.get('isSpotlighted', False)
    emit('spotlight-changed', {
        'userId': request.sid if is_spotlighted else None,
        'isSpotlighted': is_spotlighted,
    }, to=room_id)

@socketio.on('recording-status-changed')
def handle_recording_status(data):
    is_recording = data.get('isRecording', False)
    room_id = None
    for rid, participants in video_rooms.items():
        if request.sid in participants:
            room_id = rid
            break
    if room_id:
        emit('recording-status-changed', {
            'isRecording': is_recording,
        }, to=room_id)

@socketio.on('leave-video-room')
def handle_leave_video_room(data):
    room_id = data.get('roomId')
    if room_id and request.sid in video_rooms.get(room_id, {}):
        del video_rooms[room_id][request.sid]
        if not video_rooms[room_id]:
            del video_rooms[room_id]
    emit('user-left', request.sid, to=room_id)
    leave_room(room_id)

live_code_rooms = {}

@socketio.on('join-live-code')
def handle_join_live_code(data):
    room_id = data.get('roomId')
    if not room_id:
        return
    join_room(room_id)
    if room_id not in live_code_rooms:
        live_code_rooms[room_id] = {
            'code': {
                'html': '<h1>Live Coding Session</h1>\n<p>Start typing to collaborate!</p>',
                'css': 'body { font-family: sans-serif; padding: 20px; }\nh1 { color: #6366f1; }',
                'js': 'console.log("Live coding initialized!");',
            },
            'permissions': {'canEdit': False},
            'users': {},
        }
    live_code_rooms[room_id]['users'][request.sid] = True
    emit('sync-coding-state', {
        'code': live_code_rooms[room_id]['code'],
        'permissions': live_code_rooms[room_id]['permissions'],
    }, to=request.sid)

@socketio.on('code-update')
def handle_code_update(data):
    room_id = data.get('roomId')
    language = data.get('language')
    value = data.get('value')
    if room_id and language and room_id in live_code_rooms:
        live_code_rooms[room_id]['code'][language] = value
        emit('code-update', {
            'roomId': room_id,
            'language': language,
            'value': value,
            'userId': request.sid,
        }, to=room_id, include_self=False)

@socketio.on('update-coding-permissions')
def handle_update_coding_permissions(data):
    room_id = data.get('roomId')
    permissions = data.get('permissions')
    if room_id and room_id in live_code_rooms:
        live_code_rooms[room_id]['permissions'] = permissions
        emit('update-coding-permissions', permissions, to=room_id, include_self=False)

@socketio.on('request-coding-state')
def handle_request_coding_state(data):
    room_id = data.get('roomId')
    if room_id and room_id in live_code_rooms:
        emit('sync-coding-state', {
            'code': live_code_rooms[room_id]['code'],
            'permissions': live_code_rooms[room_id]['permissions'],
        }, to=request.sid)

@socketio.on('leave-live-code')
def handle_leave_live_code(data):
    room_id = data.get('roomId')
    if room_id and room_id in live_code_rooms:
        live_code_rooms[room_id]['users'].pop(request.sid, None)
        if not live_code_rooms[room_id]['users']:
            del live_code_rooms[room_id]

@socketio.on('disconnect')
def handle_disconnect():
    for room_id, participants in list(live_code_rooms.items()):
        if request.sid in participants.get('users', {}):
            del participants['users'][request.sid]
            if not participants['users']:
                del live_code_rooms[room_id]

MAX_IMAGE_SIZE = 5 * 1024 * 1024
MAX_FILE_SIZE = 50 * 1024 * 1024
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
ALLOWED_FILE_EXTENSIONS = {'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'zip', 'rar', 'mp4', 'webm', 'ogg', 'mp3', 'wav'}
ALLOWED_SVG_EXTENSIONS = {'svg'}

def _validate_upload_file(file, allowed_extensions, max_size, allow_svg=False):
    if not file or file.filename == '':
        return None, 'No selected file'

    original_filename = file.filename or ''
    ext = original_filename.rsplit('.', 1)[-1].lower() if '.' in original_filename else ''
    
    if ext not in allowed_extensions:
        return None, f'Invalid file type. Allowed: {", ".join(sorted(allowed_extensions))}'

    if allow_svg and ext == 'svg':
        file.seek(0, os.SEEK_END)
        size = file.tell()
        file.seek(0)
        if size > max_size:
            return None, 'File size exceeds maximum allowed size'
        kind = filetype.guess(file.read(2048))
        file.seek(0)
        if kind is None or kind.mime != 'image/svg+xml':
            return None, 'Invalid SVG file'
        return file, None

    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    if size > max_size:
        return None, 'File size exceeds maximum allowed size'
    
    kind = filetype.guess(file.read(2048))
    file.seek(0)
    if kind is None:
        return None, 'Invalid file content'
    
    if ext in {'png', 'jpg', 'jpeg', 'gif', 'webp'}:
        if not kind.mime.startswith('image/'):
            return None, 'Invalid image file'
    elif ext in {'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt'}:
        if not (kind.mime.startswith('application/') or kind.mime.startswith('text/')):
            return None, 'Invalid document file'
    elif ext in {'mp4', 'webm', 'ogg', 'mp3', 'wav'}:
        if not (kind.mime.startswith('video/') or kind.mime.startswith('audio/')):
            return None, 'Invalid media file'
    elif ext in {'zip', 'rar'}:
        if kind.mime not in ('application/zip', 'application/x-rar-compressed', 'application/octet-stream'):
            return None, 'Invalid archive file'

    return file, None

# Create upload folders
os.makedirs(app.config.get('UPLOAD_FOLDER', 'static/uploads/course_images'), exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, 'static', 'uploads'), exist_ok=True)
app.config['CONTENT_UPLOAD_FOLDER'] = os.path.join(BASE_DIR, 'static', 'uploads', 'course_content')
os.makedirs(app.config['CONTENT_UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, 'static', 'uploads', 'site'), exist_ok=True)

# ========== DATABASE FUNCTIONS ==========
@app.teardown_appcontext
def teardown_db(exception):
    close_db(exception)

def init_db():
    """Seed the database with initial data. Assumes tables are already created."""
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Seeding should only happen in development
    if app.config.get('ENV') != 'development':
        logging.info("Skipping database seeding in non-development environment.")
        return
    
    db = get_db_session()
    logging.info("Seeding database with initial data...")

    try:
        # ========== CREATE TEST USERS ==========
        test_users = [
            ('Admin User', 'admin@learnflow.com', 'admin123', 'admin'),
            ('Instructor User', 'instructor@learnflow.com', 'instructor123', 'instructor'),
            ('Student User', 'student@learnflow.com', 'student123', 'user'),
            ('Test Student', 'student@test.com', 'student123', 'user'),
            ('Prince Student', 'prince@gmail.com', 'prince123', 'user'),
        ]

        for name, email, password, role in test_users:
            if not db.query(User).filter_by(email=email).first():
                hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                new_user = User(
                    name=name, email=email, password=hashed, role=role, 
                    created_at=datetime.now(timezone.utc), is_active=True
                )
                db.add(new_user)
                logging.info(f"Created {role}: {email}")
        db.commit()

        # ========== CREATE SAMPLE COURSES ==========
        instructor = db.query(User).filter_by(email='instructor@learnflow.com').first()

        if instructor:
            sample_courses = [
                ("Web Development Bootcamp", "Beginner", "Development",
                 "Complete web development course with HTML, CSS, JavaScript, React, and Node.js.",
                 4.8, "40 hours", 1245,
                 "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&h=280&fit=crop", 49, 100),
                ("Python Data Science", "Intermediate", "Data Science",
                 "Master data science with Python, Pandas, NumPy, and Machine Learning.",
                 4.9, "50 hours", 892,
                 "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=280&fit=crop", 59, 150),
                ("UI/UX Design Masterclass", "Beginner", "Design",
                 "Learn user interface and user experience design principles.",
                 4.7, "35 hours", 567,
                 "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&h=280&fit=crop", 39, 100),
            ]

            for title, level, category, desc, rating, duration, students, img, price, xp in sample_courses:
                if not db.query(Course).filter_by(title=title).first():
                    new_course = Course(
                        title=title, instructor_id=instructor.id, level=level, category=category,
                        description=desc, rating=rating, duration=duration, students=students,
                        image_url=img, price=price, xp_reward=xp, is_published=True
                    )
                    db.add(new_course)
                    logging.info(f"Created course: {title}")
            db.commit()

        # ========== CREATE SAMPLE ENROLLMENTS ==========
        student = db.query(User).filter_by(email='student@learnflow.com').first()
        if student:
            courses_to_enroll = db.query(Course).limit(2).all()
            for course in courses_to_enroll:
                if not db.query(Enrollment).filter_by(user_id=student.id, course_id=course.id).first():
                    enrollment = Enrollment(user_id=student.id, course_id=course.id, progress=25)
                    db.add(enrollment)
                    logging.info(f"Enrolled student in course {course.id}")
            db.commit()

        logging.info("Database seeding completed for Users, Courses, and Enrollments!")
    except Exception as e:
        logging.error(f"Error during database seeding: {str(e)}")
        db.rollback()

# ========== API ROUTES ==========

@app.route('/api/health', methods=['GET'])
def health_check():
    """A simple health check endpoint to confirm the server is running."""
    return jsonify({
        'status': 'online',
        'timestamp': datetime.now(timezone.utc).isoformat()
    }), 200

@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({
        'message': 'Backend is running!',
        'db_name': app.config.get('DATABASE_NAME', 'unknown'),
        'status': 'online',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=False)

@app.route('/static/uploads/<path:filename>')
def serve_static_upload(filename):
    return send_from_directory(os.path.join(BASE_DIR, 'static', 'uploads'), filename)

# ========== TRIAL STATUS ROUTE ==========

@app.route('/api/trial-status', methods=['GET'])
@token_required
def get_trial_status(current_user):
    try:
        db = get_db_session()
        user = db.query(User).filter_by(id=current_user).first()

        if not user:
            return jsonify({'error': 'User not found', 'success': False}), 404

        trial_status = {
            'is_trial_active': user.is_trial_active and user.role == 'user',
            'trial_start': user.trial_start.isoformat() if user.trial_start else None,
            'trial_end': user.trial_end.isoformat() if user.trial_end else None,
            'days_remaining': None,
            'is_expired': False
        }

        if user.trial_start and user.trial_end and user.is_trial_active and user.role == 'user':
            trial_end = user.trial_end
            days_remaining = (trial_end - datetime.now(timezone.utc)).days
            trial_status['days_remaining'] = max(0, days_remaining)
            trial_status['is_expired'] = days_remaining <= 0

            if days_remaining <= 0:
                user.is_trial_active = False
                db.commit()
                trial_status['is_trial_active'] = False

        return jsonify({'success': True, 'trial_status': trial_status}), 200
    except Exception as e:
        logging.error(f"Error in trial-status: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

# ========== ADMIN ROUTES ==========

@app.route('/api/admin/stats', methods=['GET'])
@admin_required
def get_admin_stats(current_user):
    try:
        db = get_db_session()

        total_users = db.query(func.count(User.id)).scalar() or 0
        total_courses = db.query(func.count(Course.id)).scalar() or 0
        total_enrollments = db.query(func.count(Enrollment.id)).scalar() or 0
        active_students = db.query(func.count(User.id)).filter(User.role == 'user').scalar() or 0
        active_instructors = db.query(func.count(User.id)).filter(User.role == 'instructor').scalar() or 0
        
        total_revenue = db.query(func.sum(Course.price))\
            .join(Enrollment, Course.id == Enrollment.course_id)\
            .scalar() or 0
        
        completed_courses = db.query(func.count(Enrollment.id)).filter(Enrollment.progress >= 100).scalar() or 0
        
        avg_rating = db.query(func.avg(Course.rating)).scalar() or 0

        return jsonify({
            'totalUsers': total_users,
            'totalCourses': total_courses,
            'totalEnrollments': total_enrollments,
            'activeStudents': active_students,
            'activeInstructors': active_instructors,
            'totalRevenue': float(total_revenue),
            'completedCourses': completed_courses,
            'averageRating': round(avg_rating, 1)
        }), 200
    except Exception as e:
        logging.error(f"Error fetching admin stats: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/admin/chart-data', methods=['GET'])
@admin_required
def get_admin_chart_data(current_user):
    try:
        db = get_db_session()
        dialect = db.bind.dialect.name

        if dialect == 'postgresql':
            monthly_growth_query = text('''
                SELECT 
                    to_char(COALESCE(e.enrolled_date, CURRENT_TIMESTAMP), 'YYYY-MM') as month,
                    COUNT(*) as enrollments,
                    COALESCE(SUM(c.price), 0) as revenue
                FROM enrollments e
                JOIN courses c ON e.course_id = c.id
                GROUP BY 1
                ORDER BY month ASC
                LIMIT 12
            ''')
        else: # sqlite
            monthly_growth_query = text('''
                SELECT 
                    strftime('%Y-%m', COALESCE(e.enrolled_date, CURRENT_TIMESTAMP)) as month,
                    COUNT(*) as enrollments,
                    COALESCE(SUM(c.price), 0) as revenue
                FROM enrollments e
                JOIN courses c ON e.course_id = c.id
                GROUP BY 1
                ORDER BY month ASC
                LIMIT 12
            ''')
        monthly_growth_result = db.execute(monthly_growth_query)
        monthly_growth = [dict(row._mapping) for row in monthly_growth_result]

        top_courses_result = db.execute(text('''
            SELECT 
                c.title,
                COUNT(e.id) as enrollments,
                COALESCE(SUM(c.price), 0) as revenue
            FROM courses c
            LEFT JOIN enrollments e ON e.course_id = c.id
            GROUP BY c.id, c.title
            ORDER BY revenue DESC
            LIMIT 5
        '''))
        top_courses = [dict(row._mapping) for row in top_courses_result]

        user_dist_result = db.execute(text('''
            SELECT role, COUNT(*) as total
            FROM users
            GROUP BY role
            ORDER BY total DESC
        '''))
        user_distribution = [dict(row._mapping) for row in user_dist_result]

        return jsonify({
            'monthlyGrowth': monthly_growth,
            'topCourses': top_courses,
            'userDistribution': user_distribution
        }), 200
    except Exception as e:
        logging.error(f"Error fetching admin chart data: {e}", exc_info=True)
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/admin/users', methods=['GET', 'POST'])
@admin_required
def manage_users(current_user):
    db = get_db_session()
    if request.method == 'GET':
        try:
            users_query = db.query(User).order_by(User.created_at.desc()).all()
            users = [{
                'id': user.id, 'name': user.name, 'email': user.email,
                'role': user.role, 'xp': user.xp, 'is_active': user.is_active,
                'created_at': user.created_at.isoformat() if user.created_at else None
            } for user in users_query]
            return jsonify({'success': True, 'users': users, 'total': len(users)}), 200
        except Exception as e:
            logging.error(f"Error fetching all users: {str(e)}")
            return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

    if request.method == 'POST':
        try:
            data = request.json or {}
            email = data.get('email')
            password = data.get('password')
            name = data.get('name')
            role = data.get('role', 'user')

            if not email or not password:
                return jsonify({'error': 'Email and password are required', 'success': False}), 400

            if db.query(User).filter_by(email=email).first():
                return jsonify({'error': 'User with this email already exists', 'success': False}), 409

            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            new_user = User(
                name=name or email.split('@')[0],
                email=email,
                password=hashed_password,
                role=role,
                is_active=True
            )
            db.add(new_user)
            db.commit()

            log_activity(current_user, f"Admin created new user: {email}", details=f"Role: {role}", status='success', log_type='user')

            return jsonify({
                'success': True, 'message': 'User created successfully',
                'user': {'id': new_user.id, 'name': new_user.name, 'email': new_user.email, 'role': new_user.role}
            }), 201
        except Exception as e:
            db.rollback()
            logging.error(f"Error creating user via admin: {e}")
            return jsonify({'error': 'An internal server error occurred', 'success': False}), 500

@app.route('/api/admin/instructors', methods=['GET'])
@admin_required
def get_all_instructors(current_user):
    try:
        db = get_db_session()
        instructors_query = db.query(User).filter(User.role == 'instructor').order_by(User.created_at.desc()).all()
        instructors = []
        for user in instructors_query:
            instructors.append({
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role,
                'xp': user.xp,
                'is_active': user.is_active,
                'created_at': user.created_at.isoformat() if user.created_at else None
            })
        return jsonify({'success': True, 'instructors': instructors}), 200
    except Exception as e:
        logging.error(f"Error fetching instructors: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/users/students', methods=['GET'])
@token_required
def get_all_students(current_user):
    try:
        db = get_db_session()
        students_query = db.query(User).filter(User.role == 'user', User.id != current_user).all()
        students = [{
            'id': s.id,
            'name': s.name,
            'email': s.email,
            'profile_image': s.profile_image
        } for s in students_query]
        return jsonify({'students': students}), 200
    except Exception as e:
        logging.error(f"Error fetching all students: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/admin/all-courses', methods=['GET'])
@admin_required
def get_admin_all_courses(current_user):
    try:
        db = get_db_session()
        enrollment_counts = db.query(
            Enrollment.course_id,
            func.count(Enrollment.id).label('student_count')
        ).group_by(Enrollment.course_id).all()
        counts_map = {course_id: count for course_id, count in enrollment_counts}

        courses = db.query(Course).options(joinedload(Course.instructor)).all()
        result = []
        for course in courses:
            result.append({
                'id': course.id,
                'title': course.title,
                'description': course.description,
                'level': course.level,
                'category': course.category,
                'image_url': course.image_url,
                'price': course.price,
                'xp_reward': course.xp_reward,
                'is_published': course.is_published,
                'created_at': course.created_at.isoformat() if course.created_at else None,
                'instructor_name': course.instructor.name if course.instructor else None,
                'students': counts_map.get(course.id, 0)
            })
        return jsonify(result), 200
    except Exception as e:
        logging.error(f"Error fetching admin courses: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/admin/courses/<int:course_id>', methods=['PUT', 'DELETE'])
@admin_required
def admin_manage_course(current_user, course_id):
    db = get_db_session()
    data = request.json or {}

    try:
        course = db.query(Course).filter_by(id=course_id).first()
        if not course:
            return jsonify({'error': 'Course not found'}), 404

        if request.method == 'DELETE':
            db.delete(course)
            db.commit()
            log_activity(current_user, f"Deleted course ID: {course_id}", status='success', log_type='course')
            return jsonify({'success': True, 'message': 'Course deleted by admin'}), 200

        # PUT - Update course
        if request.method == 'PUT':
            course.title = data.get('title', course.title)
            course.description = data.get('description', course.description)
            course.level = data.get('level', course.level)
            course.category = data.get('category', course.category)
            course.image_url = data.get('image_url', course.image_url)
            course.price = data.get('price', course.price)
            course.xp_reward = data.get('xpReward', data.get('xp_reward', course.xp_reward))
            
            db.commit()
            log_activity(current_user, f"Updated course: {course.title}", details=f"Course ID: {course_id}", status='success', log_type='course')
            return jsonify({'success': True, 'message': 'Course updated by admin'}), 200

    except Exception as e:
        db.rollback()
        logging.error(f"Error in admin_manage_course: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/admin/revenue-stats', methods=['GET'])
@admin_required
def get_revenue_stats(current_user):
    try:
        db = get_db_session()
        
        total_revenue = db.query(func.sum(Course.price))\
            .join(Enrollment, Course.id == Enrollment.course_id)\
            .scalar() or 0
        
        total_enrollments = db.query(func.count(Enrollment.id)).scalar() or 0
        total_courses = db.query(func.count(Course.id)).scalar() or 0
        total_users = db.query(func.count(User.id)).scalar() or 0

        revenue_by_category = db.query(
            Course.category,
            func.sum(Course.price).label('revenue'),
            func.count(Enrollment.user_id.distinct()).label('enrollments')
        ).outerjoin(Enrollment, Course.id == Enrollment.course_id)\
         .group_by(Course.category)\
         .order_by(func.sum(Course.price).desc())\
         .all()

        return jsonify({
            'success': True,
            'total_revenue': float(total_revenue),
            'total_enrollments': total_enrollments,
            'total_courses': total_courses,
            'total_users': total_users,
            'revenue_by_category': [{'category': r.category, 'revenue': float(r.revenue), 'enrollments': r.enrollments} for r in revenue_by_category]
        }), 200
    except Exception as e:
        logging.error(f"Revenue stats error: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/admin/all-courses', methods=['POST'])
@admin_required
def admin_create_course(current_user):
    try:
        data = request.get_json() or {}
        title = data.get('title', '').strip()
        description = data.get('description', '').strip()
        instructor_id = data.get('instructor_id')
        level = data.get('level', 'Beginner')
        category = data.get('category', 'Development')
        price = data.get('price', 0)
        image_url = data.get('image_url', '')
        xp_reward = data.get('xp_reward', 100)

        if not title or not description:
            return jsonify({'error': 'Title and description are required', 'success': False}), 400

        db = get_db_session()
        new_course = Course(
            title=title,
            description=description,
            instructor_id=instructor_id,
            level=level,
            category=category,
            price=price,
            image_url=image_url,
            xp_reward=xp_reward,
            is_published=data.get('is_published', False)
        )
        db.add(new_course)
        db.commit()

        log_activity(current_user, f"Created course: {title}", status='success', log_type='course')
        return jsonify({'success': True, 'message': 'Course created successfully', 'course_id': new_course.id}), 201
    except Exception as e:
        db.rollback()
        logging.error(f"Error creating course: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@admin_required
def admin_delete_user(current_user, user_id):
    try:
        db = get_db_session()
        user = db.query(User).filter_by(id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found', 'success': False}), 404

        db.delete(user)
        db.commit()
        log_activity(current_user, f"Deleted user: {user.email}", status='success', log_type='user')
        return jsonify({'success': True, 'message': 'User deleted successfully'}), 200
    except Exception as e:
        db.rollback()
        logging.error(f"Error deleting user: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/admin/users/<int:user_id>/role', methods=['PUT'])
@admin_required
def admin_update_user_role(current_user, user_id):
    try:
        data = request.get_json() or {}
        new_role = data.get('role')

        if not new_role:
            return jsonify({'error': 'Role is required', 'success': False}), 400

        valid_roles = ['admin', 'instructor', 'user', 'moderator']
        if new_role not in valid_roles:
            return jsonify({'error': f'Invalid role. Must be one of: {", ".join(valid_roles)}', 'success': False}), 400

        db = get_db_session()
        user = db.query(User).filter_by(id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found', 'success': False}), 404

        user.role = new_role
        db.commit()
        log_activity(current_user, f"Updated role for {user.email} to {new_role}", status='success', log_type='user')
        return jsonify({'success': True, 'message': 'Role updated successfully'}), 200
    except Exception as e:
        db.rollback()
        logging.error(f"Error updating user role: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/admin/instructors/create', methods=['POST'])
@admin_required
def admin_create_instructor(current_user):
    try:
        data = request.get_json() or {}
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        bio = data.get('bio', '').strip()

        if not name or not email or not password:
            return jsonify({'error': 'Name, email, and password are required', 'success': False}), 400

        db = get_db_session()
        if db.query(User).filter_by(email=email).first():
            return jsonify({'error': 'User with this email already exists', 'success': False}), 409

        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        new_user = User(
            name=name,
            email=email,
            password=hashed_password,
            role='instructor',
            bio=bio,
            is_active=True
        )
        db.add(new_user)
        db.commit()

        log_activity(current_user, f"Created instructor: {email}", status='success', log_type='user')
        return jsonify({'success': True, 'message': 'Instructor created successfully', 'user_id': new_user.id}), 201
    except Exception as e:
        db.rollback()
        logging.error(f"Error creating instructor: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/admin/instructors/<int:instructor_id>', methods=['DELETE'])
@admin_required
def admin_delete_instructor(current_user, instructor_id):
    try:
        db = get_db_session()
        user = db.query(User).filter_by(id=instructor_id, role='instructor').first()
        if not user:
            return jsonify({'error': 'Instructor not found', 'success': False}), 404

        db.delete(user)
        db.commit()
        log_activity(current_user, f"Deleted instructor: {user.email}", status='success', log_type='user')
        return jsonify({'success': True, 'message': 'Instructor deleted successfully'}), 200
    except Exception as e:
        db.rollback()
        logging.error(f"Error deleting instructor: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/admin/courses/upload-image', methods=['POST'])
@admin_required
def admin_upload_course_image(current_user):
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part', 'success': False}), 400

        file = request.files['file']
        validated_file, error = _validate_upload_file(file, ALLOWED_IMAGE_EXTENSIONS, MAX_IMAGE_SIZE)
        if error:
            return jsonify({'error': error, 'success': False}), 400

        filename = str(uuid.uuid4()) + '_' + secure_filename(validated_file.filename or '')
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        validated_file.save(filepath)

        image_url = f"/static/uploads/course_images/{filename}"
        return jsonify({'success': True, 'image_url': image_url, 'message': 'Image uploaded successfully'}), 200
    except Exception as e:
        logging.error(f"Course image upload error: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/admin/payouts', methods=['GET', 'POST'])
@admin_required
def admin_manage_payouts(current_user):
    try:
        db = get_db_session()

        if request.method == 'GET':
            payouts = db.query(Payout)\
                .options(joinedload(Payout.instructor))\
                .order_by(Payout.created_at.desc())\
                .all()

            result = []
            for payout in payouts:
                detail = db.query(PayoutDetail).filter_by(payout_id=payout.id).first()
                result.append({
                    'id': payout.id,
                    'instructor_id': payout.instructor_id,
                    'instructor_name': payout.instructor.name if payout.instructor else 'N/A',
                    'instructor_email': payout.instructor.email if payout.instructor else 'N/A',
                    'amount': float(payout.amount),
                    'status': payout.status,
                    'payout_type': payout.payout_type,
                    'payout_details': detail.details if detail else None,
                    'updated_at': payout.updated_at.isoformat() if payout.updated_at else None,
                    'created_at': payout.created_at.isoformat() if payout.created_at else None,
                })

            return jsonify({'success': True, 'payouts': result}), 200

        if request.method == 'POST':
            data = request.get_json() or {}
            instructor_id = data.get('instructor_id')
            amount = data.get('amount')
            payout_type = data.get('payout_type', 'bank_account')
            details = data.get('details', {})

            if not instructor_id or not amount:
                return jsonify({'error': 'Instructor ID and amount are required', 'success': False}), 400

            new_payout = Payout(
                instructor_id=instructor_id,
                amount=amount,
                status='pending',
                payout_type=payout_type
            )
            db.add(new_payout)
            db.flush()

            if details:
                payout_detail = PayoutDetail(
                    payout_id=new_payout.id,
                    payout_type=payout_type,
                    details=details
                )
                db.add(payout_detail)

            db.commit()
            log_activity(current_user, f"Created payout for instructor {instructor_id}", status='success', log_type='payment')
            return jsonify({'success': True, 'message': 'Payout created successfully', 'payout_id': new_payout.id}), 201
    except Exception as e:
        db.rollback()
        logging.error(f"Error managing payouts: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/payout-details', methods=['GET', 'POST'])
@token_required
def payout_details(current_user):
    try:
        db = get_db_session()

        if request.method == 'GET':
            payouts = db.query(Payout).filter_by(instructor_id=current_user).order_by(Payout.created_at.desc()).all()
            result = []
            for payout in payouts:
                detail = db.query(PayoutDetail).filter_by(payout_id=payout.id).first()
                result.append({
                    'id': payout.id,
                    'amount': float(payout.amount),
                    'status': payout.status,
                    'payout_type': payout.payout_type,
                    'details': detail.details if detail else None,
                    'updated_at': payout.updated_at.isoformat() if payout.updated_at else None,
                })
            return jsonify({'success': True, 'payouts': result}), 200

        if request.method == 'POST':
            data = request.get_json() or {}
            payout_type = data.get('payout_type', 'bank_account')
            details = data.get('details', {})

            if not details:
                return jsonify({'error': 'Payout details are required', 'success': False}), 400

            payout = Payout(
                instructor_id=current_user,
                amount=0,
                status='pending',
                payout_type=payout_type
            )
            db.add(payout)
            db.flush()

            payout_detail = PayoutDetail(
                payout_id=payout.id,
                payout_type=payout_type,
                details=details
            )
            db.add(payout_detail)
            db.commit()

            return jsonify({'success': True, 'message': 'Payout details saved successfully'}), 201
    except Exception as e:
        db.rollback()
        logging.error(f"Error managing payout details: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/admin/recent-orders', methods=['GET'])
@admin_required
def get_recent_orders(current_user):
    try:
        db = get_db_session()
        limit = request.args.get('limit', 10, type=int)

        recent_enrollments = db.query(
            Enrollment.id,
            User.name.label('student_name'),
            User.email.label('student_email'),
            Course.title.label('course_title'),
            Course.price.label('amount'),
            Enrollment.enrolled_date.label('date'),
            Enrollment.progress
        ).join(User, Enrollment.user_id == User.id)\
         .join(Course, Enrollment.course_id == Course.id)\
         .order_by(Enrollment.enrolled_date.desc())\
         .limit(limit)\
         .all()

        orders = []
        for e in recent_enrollments:
            orders.append({
                'id': e.id,
                'student_name': e.student_name,
                'student_email': e.student_email,
                'course_title': e.course_title,
                'amount': float(e.amount) if e.amount else 0,
                'date': e.date.isoformat() if e.date else None,
                'progress': e.progress or 0
            })

        return jsonify({'success': True, 'orders': orders}), 200
    except Exception as e:
        logging.error(f"Recent orders error: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

# ========== ADMIN INVITE ROUTES ==========

@app.route('/api/admin/invite/generate', methods=['POST'])
@admin_required
def admin_generate_invite(current_user):
    try:
        data = request.json
        email = data.get('email')
        role = data.get('role', 'instructor')
        name = data.get('name', '')

        if not email:
            return jsonify({'error': 'Email is required', 'success': False}), 400

        valid_roles = ['admin', 'instructor', 'user', 'moderator']
        if role not in valid_roles:
            return jsonify({'error': f'Invalid role. Must be one of: {", ".join(valid_roles)}', 'success': False}), 400

        db = get_db_session()
        
        user = db.query(User).filter_by(email=email).first()
        
        if user and user.is_active:
            return jsonify({'error': 'User already exists and is active', 'success': False}), 409

        invite_token = str(uuid.uuid4())

        if user:
            user.role = role
            user.invitation_token = invite_token
            user.is_active = False
            if name:
                user.name = name
        else:
            placeholder_password = bcrypt.hashpw(str(uuid.uuid4(.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'))).decode('utf-8')
            new_user = User(
                name=name or 'Pending User',
                email=email,
                password=placeholder_password,
                role=role,
                invitation_token=invite_token,
                is_active=False
            )
            db.add(new_user)

        db.commit()

        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5174')
        invite_link = f"{frontend_url}/complete-registration?token={invite_token}&email={email}&role={role}"

        email_sent = False
        email_error = None
        if Message:
            email_sent, email_error = send_invite_email(email, invite_link, role, name)

        log_activity(current_user, f"Sent invitation to {email}", details=f"Role: {role}", status='success', log_type='user')

        response_data = {
            'success': True,
            'message': 'Invitation created successfully',
            'invite_link': invite_link,
            'token': invite_token,
            'email_sent': email_sent,
            'email': email,
            'role': role
        }
        if email_error:
            response_data['email_error'] = email_error

        return jsonify(response_data), 201

    except Exception as e:
        logging.error(f"Error creating invite: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/admin/invite/resend', methods=['POST'])
@admin_required
def admin_resend_invite(current_user):
    try:
        data = request.json
        email = data.get('email')

        if not email:
            return jsonify({'error': 'Email is required', 'success': False}), 400

        db = get_db_session()
        user = db.query(User).filter_by(email=email, is_active=False).first()

        if not user:
            return jsonify({'error': 'No pending invitation found for this email', 'success': False}), 404

        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5174')
        invite_link = f"{frontend_url}/complete-registration?token={user.invitation_token}&email={user.email}&role={user.role}"

        email_sent = False
        email_error = None
        if Message:
            email_sent, email_error = send_invite_email(email, invite_link, user.role, user.name)

        response_data = {
            'success': True,
            'message': 'Invitation resent successfully',
            'email_sent': email_sent,
            'email': email
        }
        if email_error:
            response_data['email_error'] = email_error

        return jsonify(response_data), 200

    except Exception as e:
        logging.error(f"Error resending invite: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/admin/test-email', methods=['POST'])
@admin_required
def test_email_sending(current_user):
    """An endpoint to send a test email, for admins only."""
    if not Message:
        return jsonify({'error': 'Flask-Mail is not installed', 'success': False}), 500
        
    data = request.json or {}
    recipient = data.get('email')

    if not recipient:
        return jsonify({'error': 'Recipient email is required in the request body', 'success': False}), 400

    try:
        subject = "MysteryPath Test Email"
        html_body = """
        <h1>Hello!</h1>
        <p>This is a test email from your <strong>MysteryPath</strong> application.</p>
        <p>If you received this, your email configuration is working correctly!</p>
        """
        text_body = "Hello! This is a test email from your MysteryPath application. If you received this, your email configuration is working correctly!"

        msg = Message(
            subject=subject,
            recipients=[recipient],
            body=text_body,
            html=html_body,
            sender=app.config.get('MAIL_DEFAULT_SENDER')
        )
        mail.send(msg)
        log_activity(current_user, f"Sent test email to {recipient}", status='success', log_type='system')
        return jsonify({'success': True, 'message': f'Test email successfully sent to {recipient}'}), 200
    except Exception as e:
        logging.error(f"Error sending test email: {e}", exc_info=True)
        return jsonify({'error': 'Failed to send email. Check server logs.', 'success': False}), 500

# ========== EMAIL FUNCTIONS ==========
def send_invite_email(email, invite_link, role, name=""):
    if not Message:
        logging.warning("Flask-Mail not installed, cannot send email")
        return False, "Flask-Mail not installed"
        
    try:
        role_names = {
            'admin': 'Administrator',
            'instructor': 'Instructor',
            'user': 'Student',
            'moderator': 'Moderator'
        }
        role_display = role_names.get(role, role.capitalize())
        subject = f"Invitation to join MysteryPath as a {role_display}"
        
        template_context = {
            "name": name,
            "role_display": role_display,
            "role": role,
            "invite_link": invite_link
        }

        html_body = render_template("invitation_email.html", **template_context)
        text_body = render_template("invitation_email.txt", **template_context)

        msg = Message(
            subject=subject,
            recipients=[email],
            body=text_body,
            html=html_body,
            sender=app.config.get('MAIL_DEFAULT_SENDER')
        )

        mail.send(msg)
        logging.info(f"Invitation email sent to {email}")
        return True, None

    except Exception as e:
        error_message = str(e)
        logging.error(f"Error sending email: {error_message}")
        return False, error_message

# ========== SYSTEM SETTINGS ROUTES ==========

@app.route('/api/admin/settings', methods=['GET', 'POST', 'PUT'])
@admin_required
def admin_settings(current_user):
    if request.method == 'GET':
        try:
            db = get_db_session()
            settings_result = db.query(SystemSetting).all()
            
            settings = {}
            for row in settings_result:
                key = row.key
                value = row.value
                if value and value.lower() == 'true':
                    settings[key] = True
                elif value and value.lower() == 'false':
                    settings[key] = False
                elif value.isdigit():
                    settings[key] = int(value)
                else:
                    settings[key] = value

            return jsonify({'settings': settings, 'success': True}), 200
        except Exception as e:
            logging.error(f"Error fetching settings: {str(e)}")
            return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

    if request.method in ['POST', 'PUT']:
        try:
            data = request.json or {}
            db = get_db_session()
            
            for key, value in data.items():
                if isinstance(value, bool):
                    db_value = 'true' if value else 'false'
                else:
                    db_value = str(value)
                
                setting = db.query(SystemSetting).filter_by(key=key).first()
                if setting:
                    setting.value = db_value
                else:
                    new_setting = SystemSetting(key=key, value=db_value)
                    db.add(new_setting)

            db.commit()
            return jsonify({'success': True, 'message': 'Settings saved successfully', 'settings': data}), 200
        except Exception as e:
            logging.error(f"Error saving settings: {str(e)}")
            return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

    return jsonify({'error': 'Method not allowed', 'success': False}), 405

# ========== TEST ROUTES ==========
@app.route('/api/test/emit-activity', methods=['POST'])
@admin_required
def test_emit_activity(current_user):
    """Test endpoint to emit a sample activity event via Socket.IO"""
    try:
        test_log = {
            'user_id': current_user,
            'user': 'Test User',
            'email': 'test@example.com',
            'action': 'Test Activity - Socket.IO Verification',
            'details': 'This is a test event to verify real-time Socket.IO connection',
            'status': 'success',
            'type': 'test',
            'ip': request.remote_addr or '127.0.0.1'
        }
        
        socketio.emit('new-activity', test_log, to='activity-room')
        
        return jsonify({
            'success': True,
            'message': 'Test activity emitted successfully',
            'log': test_log
        }), 200
        
    except Exception as e:
        logging.error(f"Error emitting test activity: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

# ========== ACTIVITY LOG ROUTE ==========

@app.route('/api/admin/activity', methods=['GET'])
@admin_required
def get_activity_logs(current_user):
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        search = request.args.get('search', '')
        status = request.args.get('status', 'all')
        log_type = request.args.get('type', 'all')

        offset = (page - 1) * limit

        db = get_db_session()
        

        query = db.query(ActivityLog)
        if search:
            query = query.filter(
                or_(
                    ActivityLog.user.like(f'%{search}%'),
                    ActivityLog.action.like(f'%{search}%'),
                    ActivityLog.email.like(f'%{search}%')
                )
            )
        if status != 'all':
            query = query.filter(ActivityLog.status == status)
        if log_type != 'all':
            query = query.filter(ActivityLog.type == log_type)
        
        total = query.count()
        
        logs_query = query.order_by(ActivityLog.created_at.desc()).offset(offset).limit(limit)
        logs = []
        
        for log in logs_query:
            log_dict = {
                'id': log.id,
                'user_id': log.user_id,
                'user': log.user,
                'email': log.email,
                'action': log.action,
                'details': log.details,
                'status': log.status,
                'type': log.type,
                'ip': log.ip,
                'timestamp': log.created_at.isoformat() if log.created_at else None
            }
            
            if log.created_at:
                try:
                    now = datetime.now(timezone.utc)
                    diff = now - log.created_at.replace(tzinfo=timezone.utc)
                    
                    if diff.days > 0:
                        log_dict['time'] = f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
                    elif diff.seconds > 3600:
                        hours = diff.seconds // 3600
                        log_dict['time'] = f"{hours} hour{'s' if hours > 1 else ''} ago"
                    elif diff.seconds > 60:
                        minutes = diff.seconds // 60
                        log_dict['time'] = f"{minutes} minute{'s' if minutes > 1 else ''} ago"
                    else:
                        log_dict['time'] = "Just now"
                except:
                    log_dict['time'] = log_dict['timestamp']
            
            logs.append(log_dict)

        return jsonify({
            'success': True,
            'logs': logs,
            'total': total,
            'page': page,
            'limit': limit,
            'totalPages': (total + limit - 1) // limit
        }), 200

    except Exception as e:
        logging.error(f"Error fetching activity logs: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500


@app.route('/api/admin/send-notification', methods=['POST'])
@admin_required
def send_notification(current_user):
    try:
        data = request.get_json() or {}
        title = data.get('title', 'Notification')
        message = data.get('message', '')
        notification_type = data.get('type', 'info')
        recipient_type = data.get('recipient_type') or data.get('target', 'all')
        recipient_ids = data.get('recipient_ids', [])
        target_user_id = data.get('targetUserId')

        if not message and not title:
            return jsonify({'error': 'Title or message is required', 'success': False}), 400

        db = get_db_session()

        if target_user_id:
            target_users = db.query(User).filter_by(id=target_user_id).all()
        elif recipient_type == 'all':
            target_users = db.query(User).filter_by(is_active=True).all()
        elif recipient_type == 'students':
            target_users = db.query(User).filter_by(role='user', is_active=True).all()
        elif recipient_type == 'instructors':
            target_users = db.query(User).filter(User.role.in_(['instructor', 'admin']), User.is_active == True).all()
        elif recipient_type == 'specific' and recipient_ids:
            target_users = db.query(User).filter(User.id.in_(recipient_ids), User.is_active == True).all()
        else:
            target_users = db.query(User).filter_by(is_active=True).all()

        notifications_created = []
        for user in target_users:
            notification = Notification(
                user_id=user.id,
                title=title,
                message=message,
                type=notification_type,
                is_read=False
            )
            db.add(notification)
            notifications_created.append(notification)

        db.commit()

        socketio.emit('new_notification', {
            'title': title,
            'message': message,
            'type': notification_type,
            'count': len(notifications_created)
        }, to='activity-room')

        return jsonify({
            'success': True,
            'message': f'Notification sent to {len(notifications_created)} user(s)',
            'count': len(notifications_created)
        }), 200

    except Exception as e:
        logging.error(f"Error sending notification: {str(e)}")
        db.rollback()
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500


@app.route('/api/notifications/send', methods=['POST'])
@admin_required
def send_notification_alias(current_user):
    return send_notification(current_user)


@app.route('/api/admin/notification-templates', methods=['GET'])
@admin_required
def get_notification_templates(current_user):
    try:
        db = get_db_session()
        templates = db.query(NotificationTemplate).order_by(NotificationTemplate.created_at.desc()).all()
        result = []
        for t in templates:
            result.append({
                'id': t.id,
                'title': t.title,
                'message': t.message,
                'type': t.type,
                'created_at': t.created_at.isoformat() if t.created_at else None,
                'updated_at': t.updated_at.isoformat() if t.updated_at else None,
            })
        return jsonify(result), 200
    except Exception as e:
        logging.error(f"Error fetching notification templates: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500


@app.route('/api/admin/notification-templates', methods=['POST'])
@admin_required
def create_notification_template(current_user):
    try:
        data = request.get_json() or {}
        title = data.get('title', '').strip()
        message = data.get('message', '').strip()
        template_type = data.get('type', 'info')

        if not title or not message:
            return jsonify({'error': 'Title and message are required', 'success': False}), 400

        db = get_db_session()
        template = NotificationTemplate(title=title, message=message, type=template_type)
        db.add(template)
        db.commit()

        return jsonify({
            'success': True,
            'id': template.id,
            'title': template.title,
            'message': template.message,
            'type': template.type,
        }), 201
    except Exception as e:
        logging.error(f"Error creating notification template: {str(e)}")
        db.rollback()
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500


@app.route('/api/admin/notification-templates/<int:template_id>', methods=['PUT'])
@admin_required
def update_notification_template(current_user, template_id):
    try:
        data = request.get_json() or {}
        title = data.get('title', '').strip()
        message = data.get('message', '').strip()
        template_type = data.get('type', 'info')

        if not title or not message:
            return jsonify({'error': 'Title and message are required', 'success': False}), 400

        db = get_db_session()
        template = db.query(NotificationTemplate).filter_by(id=template_id).first()
        if not template:
            return jsonify({'error': 'Template not found', 'success': False}), 404

        template.title = title
        template.message = message
        template.type = template_type
        db.commit()

        return jsonify({
            'success': True,
            'id': template.id,
            'title': template.title,
            'message': template.message,
            'type': template.type,
        }), 200
    except Exception as e:
        logging.error(f"Error updating notification template: {str(e)}")
        db.rollback()
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500


@app.route('/api/admin/notification-templates/<int:template_id>', methods=['DELETE'])
@admin_required
def delete_notification_template(current_user, template_id):
    try:
        db = get_db_session()
        template = db.query(NotificationTemplate).filter_by(id=template_id).first()
        if not template:
            return jsonify({'error': 'Template not found', 'success': False}), 404

        db.delete(template)
        db.commit()

        return jsonify({'success': True, 'message': 'Template deleted successfully'}), 200
    except Exception as e:
        logging.error(f"Error deleting notification template: {str(e)}")
        db.rollback()
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500


# ========== COURSE ROUTES ==========

@app.route('/api/courses', methods=['GET'])
def get_all_courses():
    try:
        db = get_db_session()
        courses = db.query(Course).options(joinedload(Course.instructor)).order_by(Course.id.desc()).all()
        
        default_image = "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&h=280&fit=crop"
        result = []
        for course in courses:
            course_dict = {
                'id': course.id,
                'title': course.title,
                'description': course.description,
                'level': course.level,
                'category': course.category,
                'image_url': course.image_url or default_image,
                'price': course.price,
                'xp_reward': course.xp_reward,
                'rating': course.rating,
                'duration': course.duration,
                'students': course.students,
                'is_published': course.is_published,
                'instructor_name': course.instructor.name if course.instructor else None,
                'created_at': course.created_at.isoformat() if course.created_at else None
            }
            result.append(course_dict)
                
        return jsonify(result), 200
    except Exception as e:
        logging.error(f"Error fetching courses: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/courses/<int:course_id>', methods=['GET'])
def get_course_by_id(course_id):
    try:
        db = get_db_session()
        course = db.query(Course).options(joinedload(Course.instructor)).filter_by(id=course_id).first()
        
        if course:
            default_image = "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&h=280&fit=crop"
            course_dict = {
                'id': course.id,
                'title': course.title,
                'description': course.description,
                'level': course.level,
                'category': course.category,
                'image_url': course.image_url or default_image,
                'price': course.price,
                'xp_reward': course.xp_reward,
                'rating': course.rating,
                'duration': course.duration,
                'students': course.students,
                'is_published': course.is_published,
                'instructor_name': course.instructor.name if course.instructor else None,
                'instructor_id': course.instructor_id,
                'created_at': course.created_at.isoformat() if course.created_at else None
            }
            return jsonify(course_dict), 200
        return jsonify({'error': 'Course not found', 'success': False}), 404
    except Exception as e:
        logging.error(f"Error fetching course: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/courses/<int:course_id>/structure', methods=['GET'])
@token_required
def get_student_course_structure(current_user, course_id):
    try:
        db = get_db_session()
        
        course = db.query(Course).filter_by(id=course_id).first()
        if not course:
            return jsonify({'error': 'Course not found', 'success': False}), 404

        enrollment = db.query(Enrollment).filter_by(user_id=current_user, course_id=course_id).first()
        if not enrollment:
            return jsonify({'error': 'You are not enrolled in this course', 'success': False}), 403

        modules = db.query(Module).filter_by(course_id=course_id).order_by(Module.order_index.asc()).all()
        lesson_ids = [lesson.id for module in modules for lesson in module.lessons]
        
        progress_map = {}
        if lesson_ids:
            progresses = db.query(LessonProgress).filter(
                LessonProgress.user_id == current_user,
                LessonProgress.lesson_id.in_(lesson_ids)
            ).all()
            progress_map = {p.lesson_id: p for p in progresses}

        quiz_map = {}
        if lesson_ids:
            attempts = db.query(QuizAttempt).filter(
                QuizAttempt.user_id == current_user,
                QuizAttempt.lesson_id.in_(lesson_ids),
                QuizAttempt.passed == True
            ).all()
            for attempt in attempts:
                quiz_map.setdefault(attempt.lesson_id, []).append(attempt)
        
        result = []
        for module in modules:
            lessons = db.query(Lesson).filter_by(module_id=module.id).order_by(Lesson.order_index.asc()).all()
            
            lesson_data = []
            for lesson in lessons:
                lesson_dict = {
                    'id': lesson.id,
                    'title': lesson.title,
                    'type': lesson.type,
                    'content': lesson.content,
                    'video_url': lesson.video_url,
                    'slides_url': lesson.slides_url,
                    'files': lesson.files or [],
                    'duration': lesson.duration,
                    'order_index': lesson.order_index
                }
                
                lesson_dict['is_completed'] = lesson.id in progress_map
                
                if lesson.type == 'quiz':
                    user_attempts = quiz_map.get(lesson.id, [])
                    lesson_dict['is_passed'] = bool(user_attempts)
                    lesson_dict['attempts'] = len(user_attempts)
                else:
                    lesson_dict['is_passed'] = None
                    lesson_dict['attempts'] = 0
                
                if lesson.questions:
                    lesson_dict['quiz'] = {
                        'questions': [
                            {
                                'id': q.id,
                                'text': q.question_text,
                                'type': q.question_type,
                                'options': [opt.option_text for opt in q.options],
                                'correctAnswer': next((i for i, opt in enumerate(q.options) if opt.is_correct), 0),
                                'explanation': ''
                            }
                            for q in lesson.questions
                        ]
                    }
                else:
                    lesson_dict['quiz'] = None
                
                lesson_data.append(lesson_dict)
            
            result.append({
                'id': module.id,
                'title': module.title,
                'order_index': module.order_index,
                'lessons': lesson_data
            })

        return jsonify({
            'course_id': course_id,
            'title': course.title,
            'sections': result,
            'success': True
        }), 200
    except Exception as e:
        logging.error(f"Error fetching student course structure for course {course_id}: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

# ========== ENROLLMENT ROUTES ==========

@app.route('/api/enroll', methods=['POST'])
@token_required
def enroll_in_course(current_user):
    data = request.json or {}
    try:
        course_id = data.get('course_id')

        if not course_id:
            return jsonify({'error': 'Course ID is required', 'success': False}), 400

        db = get_db_session()

        user = db.query(User).filter_by(id=current_user).first()
        if not user:
            return jsonify({'error': 'User not found', 'success': False}), 404
        if not user.is_active:
            return jsonify({'error': 'Inactive users cannot enroll', 'success': False}), 403
        if user.role != 'user':
            return jsonify({'error': 'Only students can enroll in courses', 'success': False}), 403

        course = db.query(Course).filter_by(id=course_id).first()
        if not course:
            return jsonify({'error': 'Course not found', 'success': False}), 404

        existing_enrollment = db.query(Enrollment).filter_by(user_id=current_user, course_id=course_id).first()
        if existing_enrollment:
            return jsonify({'error': 'Already enrolled in this course', 'success': False}), 400

        new_enrollment = Enrollment(user_id=current_user, course_id=course_id, progress=0)
        db.add(new_enrollment)

        xp_earned = course.xp_reward if course.xp_reward else 100
        user.xp = (user.xp or 0) + xp_earned

        db.commit()

        log_activity(current_user, f"Enrolled in {course.title}", details=f"Course ID: {course_id}", status='success', log_type='enrollment')

        return jsonify({
            'success': True,
            'message': f"Successfully enrolled in {course.title}",
            'xp_earned': xp_earned
        }), 200

    except Exception as e:
        logging.error(f"Enrollment error: {str(e)}")
        if 'db' in locals():
            db.rollback()
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/my-learning', methods=['GET'])
@token_required
def get_my_learning_courses(current_user):
    try:
        db = get_db_session()

        enrollments = db.query(Enrollment)\
            .filter_by(user_id=current_user)\
            .options(joinedload(Enrollment.course).joinedload(Course.instructor))\
            .order_by(Enrollment.enrolled_date.desc())\
            .all()

        enrolled_courses = []
        for e in enrollments:
            enrolled_courses.append({
                'id': e.course.id,
                'title': e.course.title,
                'description': e.course.description,
                'level': e.course.level,
                'category': e.course.category,
                'image_url': e.course.image_url,
                'price': e.course.price,
                'xp_reward': e.course.xp_reward,
                'instructor_name': e.course.instructor.name,
                'progress': e.progress,
                'enrolled_date': e.enrolled_date.isoformat() if e.enrolled_date else None,
                'completed_at': e.completed_at.isoformat() if e.completed_at else None
            })

        return jsonify(enrolled_courses), 200

    except Exception as e:
        logging.error(f"Error fetching my-learning courses: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/progress/update', methods=['POST'])
@token_required
def update_progress(current_user):
    try:
        data = request.json
        course_id = data.get('course_id')
        lesson_id = data.get('lesson_id')

        if not course_id or not lesson_id:
            return jsonify({'error': 'Course ID and Lesson ID are required', 'success': False}), 400

        db = get_db_session()

        existing = db.query(LessonProgress).filter_by(
            user_id=current_user,
            course_id=course_id,
            lesson_id=lesson_id
        ).first()
        
        if not existing:
            new_progress = LessonProgress(
                user_id=current_user,
                course_id=course_id,
                lesson_id=lesson_id
            )
            db.add(new_progress)

        total_lessons = db.query(Lesson).join(Module).filter(Module.course_id == course_id).count()
        total_lessons = total_lessons or 1
        
        completed = db.query(LessonProgress).filter_by(
            user_id=current_user,
            course_id=course_id
        ).count()
        
        progress_pct = int((completed / total_lessons) * 100)

        enrollment = db.query(Enrollment).filter_by(
            user_id=current_user,
            course_id=course_id
        ).first()
        
        if enrollment:
            enrollment.progress = progress_pct
            
            if progress_pct >= 100 and not enrollment.completed_at:
                enrollment.completed_at = datetime.now(timezone.utc)
                course = db.query(Course).filter_by(id=course_id).first()
                if course:
                    log_activity(current_user, f"Completed course: {course.title}", details=f"Course ID: {course_id}", status='success', log_type='completion')
                    
                    existing_cert = db.query(Certificate).filter_by(user_id=current_user, course_id=course_id).first()
                    if not existing_cert:
                        user = db.query(User).filter_by(id=current_user).first()
                        certificate_id = f"MP-{uuid.uuid4().hex[:10].upper()}"
                        new_certificate = Certificate(
                            user_id=current_user,
                            course_id=course_id,
                            certificate_id=certificate_id,
                            user_name=user.name if user else "Student",
                            course_title=course.title,
                            completion_date=datetime.now(timezone.utc)
                        )
                        db.add(new_certificate)

        db.commit()
        return jsonify({'success': True, 'progress': progress_pct}), 200

    except Exception as e:
        logging.error(f"Error updating progress: {str(e)}")
        if 'db' in locals():
            db.rollback()
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/student/lessons/<int:lesson_id>/quiz', methods=['GET'])
@token_required
def get_student_quiz(current_user, lesson_id):
    try:
        db = get_db_session()

        enrollment = db.query(Enrollment)\
            .join(Course, Enrollment.course_id == Course.id)\
            .join(Module, Module.course_id == Course.id)\
            .join(Lesson, Lesson.module_id == Module.id)\
            .filter(Lesson.id == lesson_id, Enrollment.user_id == current_user)\
            .first()
            
        if not enrollment:
            return jsonify({'error': 'Not enrolled in this course', 'success': False}), 403

        questions = db.query(Question).filter_by(lesson_id=lesson_id).order_by(Question.order_index.asc()).all()
        
        result = []
        for q in questions:
            options = db.query(QuestionOption).filter_by(question_id=q.id).order_by(QuestionOption.order_index.asc()).all()
            result.append({
                'id': q.id,
                'question_text': q.question_text,
                'question_type': q.question_type,
                'order_index': q.order_index,
                'options': [{
                    'id': o.id,
                    'option_text': o.option_text,
                    'order_index': o.order_index
                } for o in options]
            })

        attempts = db.query(QuizAttempt).filter_by(
            user_id=current_user,
            lesson_id=lesson_id
        ).order_by(QuizAttempt.attempted_at.desc()).all()
        
        attempts_data = [{
            'score': a.score,
            'passed': a.passed,
            'attempted_at': a.attempted_at.isoformat() if a.attempted_at else None
        } for a in attempts]

        return jsonify({'success': True, 'questions': result, 'attempts': attempts_data}), 200
    except Exception as e:
        logging.error(f"Error fetching student quiz for lesson {lesson_id}: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/student/lessons/<int:lesson_id>/submit-quiz', methods=['POST'])
@token_required
def submit_student_quiz(current_user, lesson_id):
    data = request.json or {}
    answers = data.get('answers')

    if not answers:
        return jsonify({'error': 'Answers are required', 'success': False}), 400

    try:
        db = get_db_session()

        correct_answers = db.query(
            Question.id.label('question_id'),
            QuestionOption.id.label('correct_option_id')
        ).join(QuestionOption, Question.id == QuestionOption.question_id)\
         .filter(Question.lesson_id == lesson_id, QuestionOption.is_correct == True)\
         .all()
        
        correct_dict = {qa.question_id: qa.correct_option_id for qa in correct_answers}

        lesson = db.query(Lesson).filter_by(id=lesson_id).first()
        passing_score = lesson.passing_score if lesson and lesson.passing_score is not None else 70

        if not correct_dict:
            return jsonify({'error': 'Quiz has no questions or correct answers set up.', 'success': False}), 404

        total_questions = len(correct_dict)
        correct_count = 0
        results_details = {}

        for question_id, submitted_option_id in answers.items():
            qid = int(question_id)
            is_correct = correct_dict.get(qid) == int(submitted_option_id)
            if is_correct:
                correct_count += 1
            results_details[qid] = {
                'submitted': int(submitted_option_id),
                'correct': correct_dict.get(qid),
                'is_correct': is_correct
            }

        score = (correct_count / total_questions) * 100 if total_questions > 0 else 0
        passed = score >= passing_score

        attempt = QuizAttempt(
            user_id=current_user,
            lesson_id=lesson_id,
            score=score,
            passed=passed,
            details=json.dumps(results_details)
        )
        db.add(attempt)

        if passed:
            module = db.query(Module).join(Lesson, Lesson.module_id == Module.id).filter(Lesson.id == lesson_id).first()
            if module:
                existing_progress = db.query(LessonProgress).filter_by(
                    user_id=current_user,
                    course_id=module.course_id,
                    lesson_id=lesson_id
                ).first()
                if not existing_progress:
                    progress = LessonProgress(
                        user_id=current_user,
                        course_id=module.course_id,
                        lesson_id=lesson_id,
                    completed_at=datetime.now(timezone.utc)
                    )
                    db.add(progress)
        
        db.commit()

        return jsonify({
            'success': True,
            'score': score,
            'passed': passed,
            'correct_count': correct_count,
            'total_questions': total_questions,
            'results': results_details
        }), 200
    except Exception as e:
        db.rollback()
        logging.error(f"Error submitting quiz for lesson {lesson_id}: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

# ========== STUDENT ROUTES ==========

@app.route('/api/student/enrolled-count', methods=['GET'])
@token_required
def get_student_enrolled_count(current_user):
    try:
        db = get_db_session()
        enrolled_count = db.query(func.count(Enrollment.id)).filter_by(user_id=current_user).scalar() or 0
        return jsonify({'count': enrolled_count}), 200
    except Exception as e:
        logging.error(f"Enrolled count error: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'count': 0}), 500

@app.route('/api/student/live-classes', methods=['GET'])
@token_required
def get_student_live_classes(current_user):
    try:
        db = get_db_session()
        live_classes_query = db.query(LiveClass, User.name.label('instructor_name'))\
            .join(LiveClassStudent, LiveClass.id == LiveClassStudent.live_class_id)\
            .join(User, LiveClass.creator_id == User.id)\
            .filter(LiveClassStudent.student_id == current_user)\
            .order_by(LiveClass.created_at.desc())\
            .all()

        result = [{**lc.__dict__, 'instructor_name': name} for lc, name in live_classes_query]
        # Remove SQLAlchemy internal state
        for r in result: r.pop('_sa_instance_state', None)
        return jsonify(result), 200
    except Exception as e:
        logging.error(f"Error fetching live classes: {str(e)}")
        return jsonify([]), 200

@app.route('/api/student/peer-meetings', methods=['GET'])
@token_required
def get_peer_meetings(current_user):
    try:
        db = get_db_session()
        meetings_query = db.query(LiveClass, User.name.label('creator_name'))\
            .join(LiveClassStudent, LiveClass.id == LiveClassStudent.live_class_id)\
            .join(User, LiveClass.creator_id == User.id)\
            .filter(LiveClassStudent.student_id == current_user, LiveClass.creator_type == 'student')\
            .order_by(LiveClass.created_at.desc())\
            .all()

        result = [{**m.__dict__, 'creator_name': name} for m, name in meetings_query]
        for r in result: r.pop('_sa_instance_state', None)
        return jsonify(result), 200
    except Exception as e:
        logging.error(f"Error fetching peer meetings: {str(e)}")
        return jsonify([]), 200

@app.route('/api/student/peer-meetings', methods=['POST'])
@token_required
def create_peer_meeting(current_user):
    try:
        data = request.json or {}
        title = data.get('title', '').strip()
        meeting_link = data.get('meetingLink') or data.get('meeting_link', '')
        whatsapp_link = data.get('whatsappLink') or data.get('whatsapp_link', '')
        description = data.get('description', '')
        peer_ids = data.get('peer_ids', [])

        if not title or not meeting_link:
            return jsonify({'error': 'Title and meeting link are required', 'success': False}), 400

        if not peer_ids:
            return jsonify({'error': 'Select at least one peer', 'success': False}), 400

        db = get_db_session()

        new_meeting = LiveClass(
            creator_id=current_user,
            creator_type='student',
            title=title,
            meeting_link=meeting_link,
            whatsapp_link=whatsapp_link,
            description=description
        )
        db.add(new_meeting)
        db.flush()
        meeting_id = new_meeting.id

        # Add creator to meeting
        creator_lcs = LiveClassStudent(live_class_id=meeting_id, student_id=current_user)
        db.add(creator_lcs)

        for peer_id in peer_ids:
            existing = db.query(LiveClassStudent).filter_by(live_class_id=meeting_id, student_id=peer_id).first()
            if not existing:
                lcs = LiveClassStudent(live_class_id=meeting_id, student_id=peer_id)
                db.add(lcs)

        db.commit()

        return jsonify({
            'success': True,
            'message': f'Peer meeting created and sent to {len(peer_ids)} peer(s)',
            'meeting_id': meeting_id,
            'count': len(peer_ids)
        }), 201
    except Exception as e:
        logging.error(f"Error creating peer meeting: {str(e)}")
        if 'db' in locals():
            db.rollback()
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

# ========== CERTIFICATE ROUTES ==========

@app.route('/api/certificates/my', methods=['GET'])
@token_required
def get_my_certificates(current_user):
    try:
        db = get_db_session()
        certificates = db.query(Certificate).filter_by(user_id=current_user).order_by(Certificate.issued_date.desc(), Certificate.id.desc()).all()
        
        result = [{**cert.__dict__} for cert in certificates]
        for r in result: r.pop('_sa_instance_state', None)
        return jsonify({'success': True, 'certificates': result}), 200
    except Exception as e:
        logging.error(f"Error fetching certificates: {str(e)}")
        return jsonify({'success': False, 'certificates': [], 'error': 'An internal server error occurred.'}), 500

@app.route('/api/certificates/generate', methods=['POST'])
@token_required
def generate_certificate(current_user):
    data = request.json or {}
    try:
        course_id = data.get('course_id')
        if not course_id:
            return jsonify({'error': 'Course ID is required', 'success': False}), 400

        db = get_db_session()
        
        enrollment = db.query(Enrollment).filter_by(user_id=current_user, course_id=course_id).first()
        if not enrollment:
            return jsonify({'error': 'Enrollment not found', 'success': False}), 404
        
        total_lessons = db.query(Lesson).join(Module).filter(Module.course_id == course_id).count()
        total_lessons = total_lessons or 1
        completed_lessons = db.query(LessonProgress).filter_by(user_id=current_user, course_id=course_id).count()
        actual_progress = int((completed_lessons / total_lessons) * 100)
        if actual_progress < 100:
            return jsonify({'error': 'Complete the course before generating a certificate', 'success': False}), 400
        
        existing = db.query(Certificate).filter_by(user_id=current_user, course_id=course_id).first()
        if existing:
            cert_dict = {**existing.__dict__}
            cert_dict.pop('_sa_instance_state', None)
            return jsonify({'success': True, 'certificate': cert_dict, 'message': 'Certificate already exists'}), 200
        
        user = db.query(User).filter_by(id=current_user).first()
        course = db.query(Course).filter_by(id=course_id).first()
        
        certificate_id = f"MP-{uuid.uuid4().hex[:10].upper()}"
        completion_date = enrollment.completed_at or datetime.now(timezone.utc)
        
        new_certificate = Certificate(
            user_id=current_user,
            course_id=course_id,
            certificate_id=certificate_id,
            user_name=user.name if user else "Student",
            course_title=course.title if course else "Course",
            completion_date=completion_date
        )
        db.add(new_certificate)
        db.commit()
        
        cert_dict = {**new_certificate.__dict__}
        cert_dict.pop('_sa_instance_state', None)
        return jsonify({'success': True, 'certificate': cert_dict, 'message': 'Certificate generated successfully'}), 201
    except Exception as e:
        logging.error(f"Error generating certificate: {str(e)}")
        if 'db' in locals():
            db.rollback()
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/certificates/verify/<certificate_id>', methods=['GET'])
def verify_certificate(certificate_id):
    try:
        db = get_db_session()
        certificate = db.query(Certificate).filter_by(certificate_id=certificate_id).first()

        if not certificate:
            return jsonify({'success': False, 'error': 'Certificate not found'}), 404
        
        if not certificate.is_valid:
            return jsonify({'success': False, 'error': 'Certificate has been revoked'}), 400
        
        cert_dict = {c.key: getattr(certificate, c.key) for c in certificate.__table__.columns}

        return jsonify({'success': True, 'certificate': cert_dict}), 200
    except Exception as e:
        logging.error(f"Error verifying certificate {certificate_id}: {str(e)}")
        return jsonify({'success': False, 'error': 'An internal server error occurred.'}), 500

# ========== COMMUNITY ROUTES ==========

@app.route('/api/communities', methods=['GET'])
@token_required
def get_communities(current_user):
    try:
        db = get_db_session()
        query = db.query(Community).filter(Community.is_public == True)
        communities = query.order_by(Community.member_count.desc(), Community.created_at.desc()).all()

        result = []
        for c in communities:
            is_member = db.query(CommunityMember).filter_by(community_id=c.id, user_id=current_user).first() is not None
            result.append({
                'id': c.id,
                'name': c.name,
                'description': c.description,
                'icon': c.icon,
                'subject': c.subject,
                'creator_id': c.creator_id,
                'is_public': c.is_public,
                'max_members': c.max_members,
                'member_count': c.member_count,
                'join_code': c.join_code if is_member else None,
                'chat_group_id': c.chat_group_id,
                'is_member': is_member,
                'created_at': c.created_at.isoformat() if c.created_at else None,
            })

        return jsonify({'success': True, 'communities': result}), 200
    except Exception as e:
        logging.error(f"Error fetching communities: {str(e)}")
        return jsonify({'success': False, 'communities': [], 'error': 'An internal server error occurred.'}), 500


@app.route('/api/communities/my', methods=['GET'])
@token_required
def get_my_communities(current_user):
    try:
        db = get_db_session()
        memberships = db.query(CommunityMember).filter_by(user_id=current_user).all()
        community_ids = [m.community_id for m in memberships]
        communities = db.query(Community).filter(Community.id.in_(community_ids)).order_by(Community.created_at.desc()).all()

        result = []
        for c in communities:
            result.append({
                'id': c.id,
                'name': c.name,
                'description': c.description,
                'icon': c.icon,
                'subject': c.subject,
                'creator_id': c.creator_id,
                'is_public': c.is_public,
                'max_members': c.max_members,
                'member_count': c.member_count,
                'join_code': c.join_code,
                'chat_group_id': c.chat_group_id,
                'is_member': True,
                'created_at': c.created_at.isoformat() if c.created_at else None,
            })

        return jsonify({'success': True, 'communities': result}), 200
    except Exception as e:
        logging.error(f"Error fetching my communities: {str(e)}")
        return jsonify({'success': False, 'communities': [], 'error': 'An internal server error occurred.'}), 500


@app.route('/api/communities', methods=['POST'])
@token_required
def create_community(current_user):
    try:
        data = request.json or {}
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()
        subject = data.get('subject', '').strip()
        is_public = data.get('is_public', True)
        max_members = data.get('max_members', 50)
        icon = data.get('icon', '')

        if not name:
            return jsonify({'error': 'Community name is required', 'success': False}), 400

        db = get_db_session()
        join_code = f"STUDY-{secrets.token_hex(4).upper()}"

        chat_group = ChatGroup(
            name=name,
            creator_id=current_user,
            group_icon=icon,
        )
        db.add(chat_group)
        db.flush()

        new_community = Community(
            name=name,
            description=description,
            subject=subject,
            icon=icon,
            creator_id=current_user,
            is_public=is_public,
            max_members=max_members,
            join_code=join_code,
            chat_group_id=chat_group.id,
        )
        db.add(new_community)
        db.flush()

        membership = CommunityMember(
            community_id=new_community.id,
            user_id=current_user,
            role='owner',
        )
        db.add(membership)
        new_community.member_count = 1
        db.commit()

        return jsonify({
            'success': True,
            'message': 'Community created successfully',
            'community': {
                'id': new_community.id,
                'name': new_community.name,
                'description': new_community.description,
                'icon': new_community.icon,
                'subject': new_community.subject,
                'creator_id': new_community.creator_id,
                'is_public': new_community.is_public,
                'max_members': new_community.max_members,
                'member_count': new_community.member_count,
                'join_code': new_community.join_code,
                'chat_group_id': new_community.chat_group_id,
                'created_at': new_community.created_at.isoformat() if new_community.created_at else None,
            }
        }), 201
    except Exception as e:
        if 'db' in locals():
            db.rollback()
        logging.error(f"Error creating community: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500


@app.route('/api/communities/<int:community_id>/join', methods=['POST'])
@token_required
def join_community(current_user, community_id):
    try:
        db = get_db_session()
        community = db.query(Community).filter_by(id=community_id).first()
        if not community:
            return jsonify({'error': 'Community not found', 'success': False}), 404

        existing = db.query(CommunityMember).filter_by(community_id=community_id, user_id=current_user).first()
        if existing:
            return jsonify({'error': 'You are already a member of this community', 'success': False}), 400

        if community.member_count >= community.max_members:
            return jsonify({'error': 'This community has reached its member limit', 'success': False}), 400

        data = request.json or {}
        join_code = data.get('join_code', '').strip()
        if not community.is_public and join_code.upper() != community.join_code:
            return jsonify({'error': 'Invalid join code', 'success': False}), 403

        membership = CommunityMember(
            community_id=community_id,
            user_id=current_user,
            role='member',
        )
        db.add(membership)
        community.member_count += 1

        if community.chat_group_id:
            existing_group_member = db.query(ChatGroupMember).filter_by(group_id=community.chat_group_id, user_id=current_user).first()
            if not existing_group_member:
                group_member = ChatGroupMember(group_id=community.chat_group_id, user_id=current_user)
                db.add(group_member)

        db.commit()

        return jsonify({
            'success': True,
            'message': 'Joined community successfully',
            'community': {
                'id': community.id,
                'name': community.name,
                'member_count': community.member_count,
                'join_code': community.join_code,
                'chat_group_id': community.chat_group_id,
            }
        }), 200
    except Exception as e:
        if 'db' in locals():
            db.rollback()
        logging.error(f"Error joining community: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500


@app.route('/api/communities/<int:community_id>/leave', methods=['POST'])
@token_required
def leave_community(current_user, community_id):
    try:
        db = get_db_session()
        membership = db.query(CommunityMember).filter_by(community_id=community_id, user_id=current_user).first()
        if not membership:
            return jsonify({'error': 'You are not a member of this community', 'success': False}), 404

        if membership.role == 'owner':
            return jsonify({'error': 'Owner cannot leave the community. Transfer ownership or delete the community.', 'success': False}), 400

        community = db.query(Community).filter_by(id=community_id).first()
        if community and community.member_count > 0:
            community.member_count -= 1

        db.delete(membership)
        db.commit()

        return jsonify({'success': True, 'message': 'Left community successfully'}), 200
    except Exception as e:
        if 'db' in locals():
            db.rollback()
        logging.error(f"Error leaving community: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500


@app.route('/api/communities/<int:community_id>', methods=['GET'])
@token_required
def get_community_details(current_user, community_id):
    try:
        db = get_db_session()
        community = db.query(Community).filter_by(id=community_id).first()
        if not community:
            return jsonify({'error': 'Community not found', 'success': False}), 404

        membership = db.query(CommunityMember).filter_by(community_id=community_id, user_id=current_user).first()
        is_member = membership is not None

        members = db.query(CommunityMember).filter_by(community_id=community_id).all()
        member_list = [{
            'user_id': m.user_id,
            'name': m.user.name if m.user else 'Unknown',
            'role': m.role,
            'joined_at': m.joined_at.isoformat() if m.joined_at else None,
        } for m in members]

        return jsonify({
            'success': True,
            'community': {
                'id': community.id,
                'name': community.name,
                'description': community.description,
                'icon': community.icon,
                'subject': community.subject,
                'creator_id': community.creator_id,
                'is_public': community.is_public,
                'max_members': community.max_members,
                'member_count': community.member_count,
                'join_code': community.join_code if is_member else None,
                'chat_group_id': community.chat_group_id,
                'is_member': is_member,
                'my_role': membership.role if membership else None,
                'created_at': community.created_at.isoformat() if community.created_at else None,
                'members': member_list,
            }
        }), 200
    except Exception as e:
        logging.error(f"Error fetching community details: {str(e)}")
        return jsonify({'success': False, 'error': 'An internal server error occurred.'}), 500


@app.route('/api/communities/<int:community_id>', methods=['DELETE'])
@token_required
def delete_community(current_user, community_id):
    try:
        db = get_db_session()
        community = db.query(Community).filter_by(id=community_id).first()
        if not community:
            return jsonify({'error': 'Community not found', 'success': False}), 404

        membership = db.query(CommunityMember).filter_by(community_id=community_id, user_id=current_user).first()
        if not membership or membership.role != 'owner':
            return jsonify({'error': 'Only the owner can delete this community', 'success': False}), 403

        db.query(CommunityMember).filter_by(community_id=community_id).delete()
        db.delete(community)
        db.commit()

        return jsonify({'success': True, 'message': 'Community deleted successfully'}), 200
    except Exception as e:
        if 'db' in locals():
            db.rollback()
        logging.error(f"Error deleting community: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500


@app.route('/api/communities/<int:community_id>/members', methods=['POST'])
@token_required
def add_community_member(current_user, community_id):
    try:
        db = get_db_session()
        community = db.query(Community).filter_by(id=community_id).first()
        if not community:
            return jsonify({'error': 'Community not found', 'success': False}), 404

        membership = db.query(CommunityMember).filter_by(community_id=community_id, user_id=current_user).first()
        if not membership or membership.role not in ('owner', 'admin'):
            return jsonify({'error': 'Only owner or admin can add members', 'success': False}), 403

        data = request.json or {}
        user_ids = data.get('user_ids', [])
        if not isinstance(user_ids, list) or len(user_ids) == 0:
            return jsonify({'error': 'user_ids must be a non-empty list', 'success': False}), 400

        added = 0
        for uid in user_ids:
            if community.member_count >= community.max_members:
                break
            existing = db.query(CommunityMember).filter_by(community_id=community_id, user_id=uid).first()
            if not existing:
                member = CommunityMember(community_id=community_id, user_id=uid, role='member')
                db.add(member)
                community.member_count += 1
                added += 1

        db.commit()

        return jsonify({'success': True, 'message': f'Added {added} member(s)', 'added': added}), 200
    except Exception as e:
        if 'db' in locals():
            db.rollback()
        logging.error(f"Error adding members: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500


# ========== FRIEND ROUTES ==========

@app.route('/api/friends', methods=['GET'])
@token_required
def get_friends(current_user):
    try:
        db = get_db_session()
        friends = db.query(Friend).filter(
            ((Friend.requester_id == current_user) | (Friend.addressee_id == current_user)) &
            (Friend.status == 'accepted')
        ).all()

        result = []
        for f in friends:
            friend_id = f.addressee_id if f.requester_id == current_user else f.requester_id
            friend = db.query(User).filter_by(id=friend_id).first()
            if friend:
                result.append({
                    'id': friend.id,
                    'name': friend.name,
                    'email': friend.email,
                    'role': friend.role,
                    'profile_image': friend.profile_image,
                    'is_online': friend.is_online or False,
                    'friendship_id': f.id,
                    'created_at': f.created_at.isoformat() if f.created_at else None,
                })

        return jsonify({'success': True, 'friends': result}), 200
    except Exception as e:
        logging.error(f"Error fetching friends: {str(e)}")
        return jsonify({'success': False, 'friends': [], 'error': 'An internal server error occurred.'}), 500


@app.route('/api/friends/requests', methods=['GET'])
@token_required
def get_friend_requests(current_user):
    try:
        db = get_db_session()
        requests = db.query(Friend).filter_by(addressee_id=current_user, status='pending').all()

        result = []
        for r in requests:
            requester = db.query(User).filter_by(id=r.requester_id).first()
            if requester:
                result.append({
                    'id': r.id,
                    'requester_id': r.requester_id,
                    'name': requester.name,
                    'email': requester.email,
                    'role': requester.role,
                    'profile_image': requester.profile_image,
                    'is_online': requester.is_online or False,
                    'created_at': r.created_at.isoformat() if r.created_at else None,
                })

        return jsonify({'success': True, 'requests': result}), 200
    except Exception as e:
        logging.error(f"Error fetching friend requests: {str(e)}")
        return jsonify({'success': False, 'requests': [], 'error': 'An internal server error occurred.'}), 500


@app.route('/api/friends/request', methods=['POST'])
@token_required
def send_friend_request(current_user):
    try:
        data = request.json or {}
        addressee_id = data.get('addressee_id')

        if not addressee_id:
            return jsonify({'error': 'addressee_id is required', 'success': False}), 400

        if addressee_id == current_user:
            return jsonify({'error': 'You cannot send a friend request to yourself', 'success': False}), 400

        db = get_db_session()
        addressee = db.query(User).filter_by(id=addressee_id).first()
        if not addressee:
            return jsonify({'error': 'User not found', 'success': False}), 404

        existing = db.query(Friend).filter(
            ((Friend.requester_id == current_user) & (Friend.addressee_id == addressee_id)) |
            ((Friend.requester_id == addressee_id) & (Friend.addressee_id == current_user))
        ).first()

        if existing:
            if existing.status == 'accepted':
                return jsonify({'error': 'You are already friends', 'success': False}), 400
            elif existing.status == 'pending':
                return jsonify({'error': 'Friend request already pending', 'success': False}), 400
            elif existing.status == 'blocked':
                return jsonify({'error': 'This user has blocked you', 'success': False}), 403

        new_request = Friend(
            requester_id=current_user,
            addressee_id=addressee_id,
            status='pending'
        )
        db.add(new_request)
        db.commit()

        return jsonify({
            'success': True,
            'message': 'Friend request sent successfully',
            'friendship_id': new_request.id
        }), 201
    except Exception as e:
        if 'db' in locals():
            db.rollback()
        logging.error(f"Error sending friend request: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500


@app.route('/api/friends/accept', methods=['POST'])
@token_required
def accept_friend_request(current_user):
    try:
        data = request.json or {}
        friendship_id = data.get('friendship_id')

        if not friendship_id:
            return jsonify({'error': 'friendship_id is required', 'success': False}), 400

        db = get_db_session()
        friendship = db.query(Friend).filter_by(id=friendship_id, addressee_id=current_user, status='pending').first()
        if not friendship:
            return jsonify({'error': 'Friend request not found', 'success': False}), 404

        friendship.status = 'accepted'
        db.commit()

        return jsonify({'success': True, 'message': 'Friend request accepted'}), 200
    except Exception as e:
        if 'db' in locals():
            db.rollback()
        logging.error(f"Error accepting friend request: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500


@app.route('/api/friends/reject', methods=['POST'])
@token_required
def reject_friend_request(current_user):
    try:
        data = request.json or {}
        friendship_id = data.get('friendship_id')

        if not friendship_id:
            return jsonify({'error': 'friendship_id is required', 'success': False}), 400

        db = get_db_session()
        friendship = db.query(Friend).filter_by(id=friendship_id, addressee_id=current_user, status='pending').first()
        if not friendship:
            return jsonify({'error': 'Friend request not found', 'success': False}), 404

        db.delete(friendship)
        db.commit()

        return jsonify({'success': True, 'message': 'Friend request rejected'}), 200
    except Exception as e:
        if 'db' in locals():
            db.rollback()
        logging.error(f"Error rejecting friend request: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500


@app.route('/api/friends/search', methods=['GET'])
@token_required
def search_users(current_user):
    try:
        query = request.args.get('q', '').strip()
        if not query:
            return jsonify({'success': True, 'users': []}), 200

        db = get_db_session()
        users = db.query(User).filter(
            User.id != current_user,
            User.name.ilike(f'%{query}%')
        ).limit(20).all()

        result = []
        for user in users:
            friendship = db.query(Friend).filter(
                ((Friend.requester_id == current_user) & (Friend.addressee_id == user.id)) |
                ((Friend.requester_id == user.id) & (Friend.addressee_id == current_user))
            ).first()

            status = None
            if friendship:
                status = friendship.status

            result.append({
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role,
                'profile_image': user.profile_image,
                'is_online': user.is_online or False,
                'friendship_status': status,
            })

        return jsonify({'success': True, 'users': result}), 200
    except Exception as e:
        logging.error(f"Error searching users: {str(e)}")
        return jsonify({'success': False, 'users': [], 'error': 'An internal server error occurred.'}), 500


@app.route('/api/friends/<int:friendship_id>', methods=['DELETE'])
@token_required
def remove_friend(current_user, friendship_id):
    try:
        db = get_db_session()
        friendship = db.query(Friend).filter(
            Friend.id == friendship_id,
            ((Friend.requester_id == current_user) | (Friend.addressee_id == current_user)),
            Friend.status == 'accepted'
        ).first()

        if not friendship:
            return jsonify({'error': 'Friendship not found', 'success': False}), 404

        db.delete(friendship)
        db.commit()

        return jsonify({'success': True, 'message': 'Friend removed successfully'}), 200
    except Exception as e:
        if 'db' in locals():
            db.rollback()
        logging.error(f"Error removing friend: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500


# ========== CHAT ROUTES ==========

@app.route('/api/chat/groups', methods=['POST'])
@token_required
def create_chat_group(current_user):
    data = request.json or {}
    name = data.get('name')
    member_ids = data.get('member_ids')

    if not name or not member_ids:
        return jsonify({'error': 'Group name and member IDs are required', 'success': False}), 400

    if not isinstance(member_ids, list) or len(member_ids) == 0:
        return jsonify({'error': 'member_ids must be a non-empty list', 'success': False}), 400
    
    if current_user not in member_ids:
        member_ids.append(current_user)

    try:
        db = get_db_session()
        
        new_group = ChatGroup(
            name=name,
            creator_id=current_user,
            created_at=datetime.now(timezone.utc)
        )
        db.add(new_group)
        db.flush()
        
        group_id = new_group.id
        
        unique_member_ids = set(member_ids)
        for user_id in unique_member_ids:
            user_exists = db.query(User.id).filter_by(id=user_id).first()
            if user_exists:
                member = ChatGroupMember(
                    group_id=group_id,
                    user_id=user_id
                )
                db.add(member)

        db.commit()

        group_data = {
            'id': group_id,
            'name': name,
            'creator_id': current_user,
            'created_at': new_group.created_at.isoformat(),
            'is_group': True,
            'members': list(unique_member_ids),
            'group_icon': None,
            'messages_restricted': False,
            'last_message_content': 'Group created.',
            'last_message_at': new_group.created_at.isoformat(),
            'unread_count': 1
        }
        for user_id in unique_member_ids:
            if user_id != current_user:
                socketio.emit('new_group_chat', group_data, room=f'user_{user_id}')

        return jsonify({'success': True, 'message': 'Group created successfully', 'group': group_data}), 201

    except Exception as e:
        db.rollback()
        logging.error(f"Error creating chat group: {str(e)}", exc_info=True)
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

# ========== SETTINGS ROUTES ==========

@app.route('/api/settings/logo', methods=['GET'])
def get_logo():
    try:
        db = get_db_session()
        setting = db.query(SystemSetting).filter_by(key='logo_url').first()
        logo_url = setting.value if setting else '/static/logo.png'
        return jsonify({'success': True, 'logo_url': logo_url}), 200
    except Exception as e:
        logging.error(f"Error fetching logo: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/settings/public-content', methods=['GET'])
def get_public_content():
    try:
        keys = ['siteName', 'siteDescription', 'contactEmail', 'contactPhone', 
                'contactAddress', 'supportHours', 'aboutHeadline', 'aboutBody', 
                'aboutMission', 'aboutVision', 'helpCenterTitle', 
                'helpCenterIntro', 'helpCenterFaqs']
        
        db = get_db_session()
        
        settings = {}
        for key in keys:
            setting = db.query(SystemSetting).filter_by(key=key).first()
            if setting:
                value = setting.value
                if not value: continue
                if value and value.lower() == 'true':
                    settings[key] = True
                elif value.lower() == 'false':
                    settings[key] = False
                elif key == 'helpCenterFaqs':
                    try:
                        settings[key] = json.loads(value) if value else []
                    except (json.JSONDecodeError, TypeError):
                        settings[key] = []
                elif value.isdigit():
                    settings[key] = int(value)
                else:
                    settings[key] = value

        return jsonify({'success': True, 'content': settings}), 200
    except Exception as e:
        logging.error(f"Error fetching public content: {str(e)}")
        return jsonify({'error': 'Failed to fetch public content', 'success': False}), 500

@app.route('/api/admin/settings/logo', methods=['POST'])
@admin_required
def update_logo(current_user):
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part', 'success': False}), 400

        file = request.files['file']
        validated_file, error = _validate_upload_file(file, ALLOWED_IMAGE_EXTENSIONS | ALLOWED_SVG_EXTENSIONS, MAX_IMAGE_SIZE, allow_svg=True)
        if error:
            return jsonify({'error': error, 'success': False}), 400

        upload_folder = os.path.join(BASE_DIR, 'static', 'uploads', 'site')
        os.makedirs(upload_folder, exist_ok=True)

        original_filename = validated_file.filename or ''
        filename = str(uuid.uuid4()) + '_' + secure_filename(original_filename)
        filepath = os.path.join(upload_folder, filename)
        validated_file.save(filepath)

        if original_filename.rsplit('.', 1)[-1].lower() == 'svg':
            svg_path = os.path.join(upload_folder, filename)
            with open(svg_path, 'r', encoding='utf-8') as f:
                content = f.read()
            content = re.sub(r'<script[\s\S]*?</script>', '', content, flags=re.IGNORECASE)
            content = re.sub(r'\son\w+\s*=', '', content)
            with open(svg_path, 'w', encoding='utf-8') as f:
                f.write(content)

        image_url = f"/static/uploads/site/{filename}"
        
        db = get_db_session()
        setting = db.query(SystemSetting).filter_by(key='logo_url').first()
        if setting:
            setting.value = image_url
        else:
            new_setting = SystemSetting(key='logo_url', value=image_url)
            db.add(new_setting)
        db.commit()

        log_activity(current_user, "Updated site logo", status='success', log_type='system')

        return jsonify({'success': True, 'image_url': image_url, 'message': 'Logo updated successfully'}), 200
    except Exception as e:
        logging.error(f"Logo upload error: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/admin/settings/logo', methods=['DELETE'])
@admin_required
def delete_logo(current_user):
    try:
        db = get_db_session()
        setting = db.query(SystemSetting).filter_by(key='logo_url').first()
        if setting and setting.value:
            filepath = os.path.join(BASE_DIR, setting.value.lstrip('/'))
            if os.path.exists(filepath):
                os.remove(filepath)
            setting.value = None
            db.commit()

        log_activity(current_user, "Removed site logo", status='success', log_type='system')

        return jsonify({'success': True, 'message': 'Logo removed successfully'}), 200
    except Exception as e:
        logging.error(f"Logo delete error: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

# ========== UPLOAD ROUTES ==========

@app.route('/api/upload/image', methods=['POST'])
@token_required
def upload_image(current_user):
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part', 'success': False}), 400

        file = request.files['file']
        validated_file, error = _validate_upload_file(file, ALLOWED_IMAGE_EXTENSIONS, MAX_IMAGE_SIZE)
        if error:
            return jsonify({'error': error, 'success': False}), 400

        filename = str(uuid.uuid4()) + '_' + secure_filename(validated_file.filename or '')
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        validated_file.save(filepath)

        image_url = f"/static/uploads/course_images/{filename}"
        logging.info(f"Image uploaded by user {current_user}: {image_url}")

        return jsonify({
            'success': True,
            'image_url': image_url,
            'message': 'Image uploaded successfully'
        }), 200

    except Exception as e:
        logging.error(f"Upload error: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/instructor/upload/file', methods=['POST'])
@token_required
def upload_course_file(current_user):
    try:
        db = get_db_session()
        user = db.query(User).filter_by(id=current_user).first()
        if not user or user.role not in ['instructor', 'admin']:
            return jsonify({'error': 'Instructor or admin access required', 'success': False}), 403

        if 'file' not in request.files:
            return jsonify({'error': 'No file part', 'success': False}), 400

        file = request.files['file']
        validated_file, error = _validate_upload_file(file, ALLOWED_FILE_EXTENSIONS, MAX_FILE_SIZE)
        if error:
            return jsonify({'error': error, 'success': False}), 400

        filename = str(uuid.uuid4()) + '_' + secure_filename(validated_file.filename or '')
        filepath = os.path.join(app.config['CONTENT_UPLOAD_FOLDER'], filename)
        validated_file.save(filepath)

        file_url = f"/static/uploads/course_content/{filename}"
        logging.info(f"File uploaded by user {current_user}: {file_url}")

        return jsonify({
            'success': True,
            'file_url': file_url,
            'message': 'File uploaded successfully'
        }), 200

    except Exception as e:
        logging.error(f"Content file upload error: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/payment/initialize', methods=['POST'])
@token_required
def initialize_payment(current_user):
    data = request.json
    course_id = data.get('course_id')

    if not course_id:
        return jsonify({'error': 'Course ID is required', 'success': False}), 400

    db = get_db_session()

    user = db.query(User).filter_by(id=current_user).first()
    if not user:
        return jsonify({'error': 'User not found', 'success': False}), 404

    course = db.query(Course).filter_by(id=course_id).first()
    if not course:
        return jsonify({'error': 'Course not found', 'success': False}), 404

    amount = course.price
    if not amount or amount <= 0:
        try:
            existing_enrollment = db.query(Enrollment).filter_by(user_id=current_user, course_id=course_id).first()
            if not existing_enrollment:
                new_enrollment = Enrollment(user_id=current_user, course_id=course_id, progress=0)
                db.add(new_enrollment)
                db.commit()
                log_activity(current_user, f"Enrolled in free course: {course.title}", status='success', log_type='enrollment')
            return jsonify({'success': True, 'enrolled': True, 'message': 'Successfully enrolled in this free course!'}), 200
        except Exception as e:
            logging.error(f"Free enrollment error: {e}")
            db.rollback()
            return jsonify({'error': 'Failed to enroll in free course.', 'success': False}), 500

    amount_in_subunit = int(amount * 100)
    
    paystack_secret = os.environ.get('PAYSTACK_SECRET_KEY')
    if not paystack_secret:
        logging.error("PAYSTACK_SECRET_KEY not set.")
        return jsonify({'error': 'Payment processor not configured.', 'success': False}), 500

    url = "https://api.paystack.co/transaction/initialize"
    reference = f"mp_{uuid.uuid4().hex[:12]}"

    headers = {
        "Authorization": f"Bearer {paystack_secret}",
        "Content-Type": "application/json"
    }
    payload = {
        "email": user.email,
        "amount": amount_in_subunit,
        "reference": reference,
        "metadata": {
            "user_id": current_user,
            "course_id": course_id,
            "course_title": course.title
        },
        "callback_url": f"{os.environ.get('FRONTEND_URL', 'http://localhost:5174')}/payment-status"
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        payment_data = response.json()

        if payment_data.get('status'):            
            new_transaction = Transaction(
                user_id=current_user,
                course_id=course_id,
                reference=reference,
                amount=amount,
                status='pending'
            )
            db.add(new_transaction)
            db.commit()
            return jsonify({'success': True, 'authorization_url': payment_data['data']['authorization_url']}), 200
        else:
            return jsonify({'error': payment_data.get('message', 'Failed to initialize payment'), 'success': False}), 500

    except requests.exceptions.RequestException as e:
        logging.error(f"Paystack API error: {e}")
        return jsonify({'error': 'Could not connect to payment processor.', 'success': False}), 503
    except Exception as e:
        logging.error(f"Payment initialization error: {e}")
        return jsonify({'error': 'An internal error occurred.', 'success': False}), 500

# ========== PROFILE ROUTES ==========

@app.route('/api/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    try:
        db = get_db_session()
        user = db.query(User).filter_by(id=current_user).first()
        if not user:
            return jsonify({'error': 'User not found', 'success': False}), 404
        
        return jsonify({
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role,
            'xp': user.xp or 0,
            'streak_days': user.streak_days or 0,
            'bio': user.bio or '',
            'profile_image': user.profile_image or '',
            'is_active': user.is_active,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'last_login_date': user.last_login_date.isoformat() if user.last_login_date else None,
        }), 200
    except Exception as e:
        logging.error(f"Error fetching profile: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/profile/update', methods=['PUT'])
@token_required
def update_profile(current_user):
    try:
        db = get_db_session()
        user = db.query(User).filter_by(id=current_user).first()
        if not user:
            return jsonify({'error': 'User not found', 'success': False}), 404
        
        data = request.get_json() or {}
        name = data.get('name')
        bio = data.get('bio')
        
        if name is not None:
            user.name = name
        if bio is not None:
            user.bio = bio
        
        db.commit()
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully',
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role,
                'xp': user.xp or 0,
                'streak_days': user.streak_days or 0,
                'bio': user.bio or '',
                'profile_image': user.profile_image or '',
            }
        }), 200
    except Exception as e:
        db.rollback()
        logging.error(f"Error updating profile: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

# ========== NOTES ROUTES ==========

@app.route('/api/notes', methods=['GET'])
@token_required
def get_notes(current_user):
    try:
        db = get_db_session()
        notes_query = db.query(Note).filter_by(user_id=current_user).order_by(Note.created_at.desc()).all()
        result = []
        for note in notes_query:
            result.append({
                'id': note.id,
                'title': note.title,
                'content': note.content,
                'course_name': note.course_name,
                'image_url': note.image_url,
                'created_at': note.created_at.isoformat() if note.created_at else None
            })
        return jsonify({'success': True, 'notes': result}), 200
    except Exception as e:
        logging.error(f"Error fetching notes: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/notes', methods=['POST'])
@token_required
def create_note(current_user):
    try:
        data = request.get_json() or {}
        title = data.get('title', '').strip()
        content = data.get('content', '').strip()
        course_name = data.get('course_name', '').strip()
        image_url = data.get('image_url', '').strip()

        if not title:
            return jsonify({'error': 'Title is required', 'success': False}), 400

        db = get_db_session()
        note = Note(
            user_id=current_user,
            title=title,
            content=content or None,
            course_name=course_name or None,
            image_url=image_url or None
        )
        db.add(note)
        db.commit()

        return jsonify({
            'success': True,
            'note': {
                'id': note.id,
                'title': note.title,
                'content': note.content,
                'course_name': note.course_name,
                'image_url': note.image_url,
                'created_at': note.created_at.isoformat() if note.created_at else None
            }
        }), 201
    except Exception as e:
        db.rollback()
        logging.error(f"Error creating note: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/notes/<int:note_id>', methods=['DELETE'])
@token_required
def delete_note(current_user, note_id):
    try:
        db = get_db_session()
        note = db.query(Note).filter_by(id=note_id, user_id=current_user).first()
        if not note:
            return jsonify({'error': 'Note not found', 'success': False}), 404

        db.delete(note)
        db.commit()
        return jsonify({'success': True, 'message': 'Note deleted successfully'}), 200
    except Exception as e:
        db.rollback()
        logging.error(f"Error deleting note: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

# ========== PLANNER ROUTES ==========

@app.route('/api/planner', methods=['GET'])
@token_required
def get_planner_tasks(current_user):
    try:
        db = get_db_session()
        tasks_query = db.query(PlannerTask).filter_by(user_id=current_user).order_by(PlannerTask.created_at.desc()).all()
        result = []
        for task in tasks_query:
            result.append({
                'id': task.id,
                'title': task.title,
                'description': task.description,
                'due_date': task.due_date,
                'completed': task.completed,
                'created_at': task.created_at.isoformat() if task.created_at else None
            })
        return jsonify({'success': True, 'tasks': result}), 200
    except Exception as e:
        logging.error(f"Error fetching planner tasks: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/planner', methods=['POST'])
@token_required
def create_planner_task(current_user):
    try:
        data = request.get_json() or {}
        title = data.get('title', '').strip()
        description = data.get('description', '').strip()
        due_date = data.get('due_date', '').strip()

        if not title:
            return jsonify({'error': 'Title is required', 'success': False}), 400

        db = get_db_session()
        task = PlannerTask(
            user_id=current_user,
            title=title,
            description=description or None,
            due_date=due_date or None
        )
        db.add(task)
        db.commit()

        return jsonify({
            'success': True,
            'task': {
                'id': task.id,
                'title': task.title,
                'description': task.description,
                'due_date': task.due_date,
                'completed': task.completed,
                'created_at': task.created_at.isoformat() if task.created_at else None
            }
        }), 201
    except Exception as e:
        db.rollback()
        logging.error(f"Error creating planner task: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/planner/<int:task_id>', methods=['PUT'])
@token_required
def update_planner_task(current_user, task_id):
    try:
        data = request.get_json() or {}
        db = get_db_session()
        task = db.query(PlannerTask).filter_by(id=task_id, user_id=current_user).first()
        if not task:
            return jsonify({'error': 'Task not found', 'success': False}), 404

        if 'title' in data:
            task.title = data['title'].strip()
        if 'description' in data:
            task.description = data['description'].strip() or None
        if 'due_date' in data:
            task.due_date = data['due_date'].strip() or None
        if 'completed' in data:
            task.completed = bool(data['completed'])

        db.commit()

        return jsonify({
            'success': True,
            'task': {
                'id': task.id,
                'title': task.title,
                'description': task.description,
                'due_date': task.due_date,
                'completed': task.completed,
                'created_at': task.created_at.isoformat() if task.created_at else None
            }
        }), 200
    except Exception as e:
        db.rollback()
        logging.error(f"Error updating planner task: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

@app.route('/api/planner/<int:task_id>', methods=['DELETE'])
@token_required
def delete_planner_task(current_user, task_id):
    try:
        db = get_db_session()
        task = db.query(PlannerTask).filter_by(id=task_id, user_id=current_user).first()
        if not task:
            return jsonify({'error': 'Task not found', 'success': False}), 404

        db.delete(task)
        db.commit()
        return jsonify({'success': True, 'message': 'Task deleted successfully'}), 200
    except Exception as e:
        db.rollback()
        logging.error(f"Error deleting planner task: {str(e)}")
        return jsonify({'error': 'An internal server error occurred.', 'success': False}), 500

def call_gemini(messages, max_tokens=500):
    api_key = Config.GEMINI_API_KEY
    if not api_key:
        return None
    model = Config.GEMINI_MODEL or 'gemini-2.0-flash'
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    contents = []
    for msg in messages:
        role = msg.get('role')
        text = msg.get('content') or msg.get('text') or ''
        if not text:
            continue
        if role == 'system':
            contents.append({'role': 'user', 'parts': [{'text': f"[System instruction]\n{text}"}]})
        elif role == 'assistant':
            contents.append({'role': 'model', 'parts': [{'text': text}]})
        else:
            contents.append({'role': 'user', 'parts': [{'text': text}]})
    payload = {'contents': contents, 'generationConfig': {'maxOutputTokens': max_tokens, 'temperature': 0.7}}
    response = requests.post(url, json=payload, headers={'Content-Type': 'application/json'}, timeout=20)
    result = response.json()
    if response.status_code != 200 or 'candidates' not in result:
        logging.error(f"Gemini error: {result}")
        return None
    return result['candidates'][0]['content']['parts'][0]['text'].strip()

# ========== AI TUTOR ROUTE ==========

@app.route('/api/ai/tutor', methods=['POST'])
@token_required
def ai_tutor_chat(current_user):
    data = request.json or {}
    message = data.get('message', '').strip()
    history = data.get('history', [])
    
    if not message:
        return jsonify({'error': 'Message is required', 'success': False}), 400

    try:
        db = get_db_session()
        enrollments = db.query(Enrollment).filter_by(user_id=current_user).all()
        courses = []
        for enrollment in enrollments:
            course = db.query(Course).filter_by(id=enrollment.course_id).first()
            if course:
                courses.append({
                    'title': course.title,
                    'progress': enrollment.progress or 0,
                    'level': course.level or 'Beginner'
                })
        db.close()
    except Exception:
        courses = []

    course_context = "\n".join(
        f"- {c['title']} ({c['progress']}% complete, {c['level']})" for c in courses[:5]
    ) or "No enrolled courses found."

    system_prompt = (
        "You are an expert, friendly AI tutor for MysteryPath. "
        "Use the student's enrolled course context below to give personalized, actionable study guidance. "
        "Keep replies concise, structured, and focused on learning. "
        "If the student asks for a plan, quiz, or explanation, tailor it to their courses.\n\n"
        f"Student's enrolled courses:\n{course_context}"
    )

    messages = [{"role": "system", "content": system_prompt}]
    for msg in history[-8:]:
        role = "assistant" if msg.get("role") == "assistant" or msg.get("sender") == "ai" else "user"
        content = msg.get("content") or msg.get("text") or ""
        if content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": message})

    try:
        reply = call_gemini(messages, max_tokens=500)
        if reply:
            return jsonify({'success': True, 'reply': reply, 'context': {'enrolled_courses': courses}}), 200

        api_key = Config.OPENAI_API_KEY
        if not api_key:
            reply = "The AI tutor is not configured yet. Please add an AI API key in the backend .env file. In the meantime, use the study tips and resources on this page."
            return jsonify({'success': True, 'reply': reply, 'context': {'enrolled_courses': courses}}), 200

        response = requests.post(
            f"{Config.OPENAI_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": Config.OPENAI_MODEL,
                "messages": messages,
                "max_tokens": 500,
                "temperature": 0.7,
            },
            timeout=20,
        )
        result = response.json()
        if response.status_code != 200 or "choices" not in result:
            logging.error(f"OpenAI error: {result}")
            reply = "AI tutor is temporarily unavailable due to a service limit. Please try again later."
            return jsonify({'success': True, 'reply': reply, 'context': {'enrolled_courses': courses}}), 200

        reply = result["choices"][0]["message"]["content"].strip()
        return jsonify({'success': True, 'reply': reply, 'context': {'enrolled_courses': courses}}), 200
    except Exception as e:
        logging.error(f"AI tutor error: {e}")
        reply = "AI tutor is temporarily unavailable. Please try again in a moment."
        return jsonify({'success': True, 'reply': reply, 'context': {'enrolled_courses': courses}}), 200

@app.route('/api/ai/explain-topic', methods=['POST'])
@token_required
def ai_explain_topic(current_user):
    data = request.json or {}
    topic = data.get('topic', '').strip()
    
    if not topic:
        return jsonify({'error': 'Topic is required', 'success': False}), 400

    messages = [
        {
            "role": "system",
            "content": "You are a concise, friendly tutor. Explain the requested topic clearly with a definition, why it matters, one practical example, and one common mistake."
        },
        {"role": "user", "content": f"Explain this topic: {topic}"}
    ]

    try:
        explanation = call_gemini(messages, max_tokens=400)
        if explanation:
            return jsonify({'success': True, 'explanation': explanation}), 200

        api_key = Config.OPENAI_API_KEY
        if not api_key:
            explanation = (
                "The AI explainer is not configured yet. Please add an AI API key in the backend .env file. "
                "Meanwhile, try breaking the topic into definitions, examples, and common mistakes."
            )
            return jsonify({'success': True, 'explanation': explanation}), 200

        response = requests.post(
            f"{Config.OPENAI_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": Config.OPENAI_MODEL,
                "messages": messages,
                "max_tokens": 400,
                "temperature": 0.7,
            },
            timeout=20,
        )
        result = response.json()
        if response.status_code != 200 or "choices" not in result:
            logging.error(f"OpenAI error: {result}")
            explanation = "Topic explainer is temporarily unavailable due to a service limit. Please try again later."
            return jsonify({'success': True, 'explanation': explanation}), 200

        explanation = result["choices"][0]["message"]["content"].strip()
        return jsonify({'success': True, 'explanation': explanation}), 200
    except Exception as e:
        logging.error(f"AI explain-topic error: {e}")
        explanation = "Topic explainer is temporarily unavailable. Please try again in a moment."
        return jsonify({'success': True, 'explanation': explanation}), 200

# ========== ERROR HANDLERS ==========

@app.errorhandler(404)
def handle_404(e):
    return jsonify({'error': 'Endpoint not found. Check your URL and HTTP method.', 'success': False}), 404

@app.errorhandler(405)
def handle_405(e):
    return jsonify({'error': 'Method not allowed for this route.', 'success': False}), 405

@app.errorhandler(500)
def handle_500(e):
    logging.error(f"Internal Server Error: {e}", exc_info=True)
    return jsonify({'error': 'Internal Server Error. Check server logs.', 'success': False}), 500

@app.errorhandler(Exception)
def handle_unexpected_error(e):
    logging.error(f"Unhandled Exception: {e}", exc_info=True)
    return jsonify({'error': 'An unexpected error occurred.', 'success': False}), 500

# ========== REGISTER BLUEPRINTS ==========
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(instructor_bp, url_prefix='/api')
app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
app.register_blueprint(chat_bp, url_prefix='/api/chat')
app.register_blueprint(two_factor_bp, url_prefix='/api')
app.register_blueprint(github_oauth_bp, url_prefix='/api/auth')
app.register_blueprint(twitter_oauth_bp, url_prefix='/api/auth')

# ========== MAIN EXECUTION ==========
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)

from .root_routes import register_root_routes
register_root_routes(app)

# ========== TEST ROUTES ==========
from .test_route import register_test_routes
register_test_routes(app)

# ========== DIRECT TEST ROUTE ==========
@app.route('/ping')
def ping():
    return {"status": "alive", "message": "Server is responding!"}
