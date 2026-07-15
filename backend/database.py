# backend/database.py
import os
import uuid
from datetime import datetime
from typing import Optional, Generator

from sqlalchemy import (create_engine, Column, Integer, String, Text, Boolean,
                        DateTime, Float, ForeignKey, UniqueConstraint, JSON, 
                        event, inspect)
from sqlalchemy.orm import sessionmaker, relationship, scoped_session, Session
from sqlalchemy.ext.declarative import declarative_base
try:
    from sqlalchemy import UUID as SQLUUID
    _UUIDType = SQLUUID(as_uuid=True)
except ImportError:
    from sqlalchemy.dialects.postgresql import UUID as PGUUID
    _UUIDType = PGUUID(as_uuid=True)

# Import centralized configuration
from .config import Config

# --- Database Configuration ---
DB_TYPE = Config.DB_TYPE
USE_ASYNC = os.getenv('USE_ASYNC', 'false').lower() == 'true'

# --- Environment Variable Validation ---
def validate_env_vars():
    """Validate required environment variables based on DB_TYPE."""
    if DB_TYPE == 'postgresql':
        required_vars = ['DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_NAME']
        missing_vars = [var for var in required_vars if not os.getenv(var)]
        if missing_vars:
            raise ValueError(f"Missing PostgreSQL environment variables: {', '.join(missing_vars)}. Please check your .env file.")

validate_env_vars()

# SQLite Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
db_name = os.getenv('DATABASE_NAME', 'mysterypath.db')
SQLITE_PATH = os.path.join(BASE_DIR, db_name)

if DB_TYPE == 'postgresql':
    DB_USER = Config.DB_USER
    DB_PASSWORD = Config.DB_PASSWORD
    DB_HOST = Config.DB_HOST
    DB_PORT = Config.DB_PORT
    DB_NAME = Config.DB_NAME
    
    SQLALCHEMY_DATABASE_URI = Config.SQLALCHEMY_DATABASE_URI
    ASYNC_DATABASE_URI = f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    
    engine = create_engine(
        SQLALCHEMY_DATABASE_URI,
        pool_size=int(os.getenv('DB_POOL_SIZE', 20)),
        max_overflow=int(os.getenv('DB_MAX_OVERFLOW', 10)),
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=Config.DEBUG
    )
else:
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{SQLITE_PATH}'
    ASYNC_DATABASE_URI = f'sqlite+aiosqlite:///{SQLITE_PATH}'
    
    engine = create_engine(
        SQLALCHEMY_DATABASE_URI,
        connect_args={'check_same_thread': False},
        echo=Config.DEBUG
    )

# --- Session Management ---
try:
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter('ignore')
        import eventlet
    _scopefunc = eventlet.greenlet.getcurrent
except Exception:
    _scopefunc = lambda: None

db_session = scoped_session(sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False
), scopefunc=_scopefunc)

Base = declarative_base()
Base.query = db_session.query_property()


def get_db_session() -> Session:
    """Get a new database session."""
    return db_session()


def close_db(exception=None):
    """Closes the database session."""
    db_session.remove()


# --- Mixins for Reusability ---
class TimestampMixin:
    """Adds created_at and updated_at timestamps."""
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class SoftDeleteMixin:
    """Adds soft delete functionality."""
    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    def soft_delete(self):
        """Soft delete the record."""
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()

    def restore(self):
        """Restore a soft-deleted record."""
        self.is_deleted = False
        self.deleted_at = None

class UUIDMixin:
    """Adds UUID primary key."""
    id = Column(_UUIDType, primary_key=True, default=uuid.uuid4)

    @classmethod
    def get_by_uuid(cls, session: Session, uuid_value: str):
        """Get record by UUID string."""
        try:
            uuid_obj = uuid.UUID(uuid_value)
            return session.query(cls).filter(cls.id == uuid_obj).first()
        except ValueError:
            return None


# --- Models ---
class User(Base, TimestampMixin):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role = Column(String(50), default='user', nullable=False)
    xp = Column(Integer, default=0)
    streak_days = Column(Integer, default=0)
    bio = Column(Text)
    profile_image = Column(String(255))
    invitation_token = Column(String(255))
    is_active = Column(Boolean, default=True)
    last_login_date = Column(DateTime, nullable=True)
    longest_streak = Column(Integer, default=0)
    total_activities = Column(Integer, default=0)
    trial_start = Column(DateTime, nullable=True)
    trial_end = Column(DateTime, nullable=True)
    is_trial_active = Column(Boolean, default=True)
    reset_code = Column(String(255))
    reset_code_expires = Column(DateTime)
    last_seen = Column(DateTime)
    is_online = Column(Boolean, default=False)
    google_id = Column(String(255), unique=True)
    github_id = Column(String(255), unique=True)
    two_factor_secret = Column(String(255), nullable=True)

    # Relationships
    courses = relationship('Course', back_populates='instructor', cascade="all, delete-orphan")
    enrollments = relationship('Enrollment', back_populates='user', cascade="all, delete-orphan")
    notifications = relationship('Notification', back_populates='user', cascade="all, delete-orphan")
    activity_logs = relationship('ActivityLog', back_populates='user_obj', cascade="all, delete-orphan")
    sent_messages = relationship('Message', foreign_keys='Message.sender_id', back_populates='sender', cascade="all, delete-orphan")
    received_messages = relationship('Message', foreign_keys='Message.receiver_id', back_populates='receiver', cascade="all, delete-orphan")
    created_chat_groups = relationship('ChatGroup', foreign_keys='ChatGroup.creator_id', back_populates='creator', cascade="all, delete-orphan")
    chat_group_memberships = relationship('ChatGroupMember', back_populates='user', cascade="all, delete-orphan")
    message_reactions = relationship('MessageReaction', back_populates='user', cascade="all, delete-orphan")
    transactions = relationship('Transaction', back_populates='user', cascade="all, delete-orphan")
    quiz_attempts = relationship('QuizAttempt', back_populates='user', cascade="all, delete-orphan")
    lesson_progress = relationship('LessonProgress', back_populates='user', cascade="all, delete-orphan")
    certificates = relationship('Certificate', back_populates='user', cascade="all, delete-orphan")
    live_classes_attending = relationship('LiveClassStudent', back_populates='student', cascade="all, delete-orphan")
    live_classes_created = relationship('LiveClass', back_populates='creator', cascade="all, delete-orphan")
    instructor_chat_settings = relationship('InstructorChatSettings', back_populates='instructor', uselist=False, cascade="all, delete-orphan")
    chat_access_rules = relationship('ChatAccess', foreign_keys='ChatAccess.instructor_id', back_populates='instructor', cascade="all, delete-orphan")
    chat_access_for = relationship('ChatAccess', foreign_keys='ChatAccess.user_id', back_populates='user', cascade="all, delete-orphan")
    notes = relationship('Note', back_populates='user', cascade="all, delete-orphan")
    planner_tasks = relationship('PlannerTask', back_populates='user', cascade="all, delete-orphan")
    created_communities = relationship('Community', foreign_keys='Community.creator_id', back_populates='creator', cascade="all, delete-orphan")
    community_memberships = relationship('CommunityMember', back_populates='user', cascade="all, delete-orphan")
    sent_friend_requests = relationship('Friend', foreign_keys='Friend.requester_id', back_populates='requester', cascade="all, delete-orphan")
    received_friend_requests = relationship('Friend', foreign_keys='Friend.addressee_id', back_populates='addressee', cascade="all, delete-orphan")
    payouts = relationship('Payout', back_populates='instructor', cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', name='{self.name}')>"

    def to_dict(self):
        """Convert user to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'xp': self.xp,
            'streak_days': self.streak_days,
            'bio': self.bio,
            'profile_image': self.profile_image,
            'is_active': self.is_active,
            'last_login_date': self.last_login_date.isoformat() if self.last_login_date else None,
            'is_online': self.is_online,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def update_last_seen(self):
        """Update the last seen timestamp."""
        self.last_seen = datetime.utcnow()
        self.is_online = True

    def go_offline(self):
        """Set user as offline."""
        self.is_online = False


class Course(Base, TimestampMixin):
    __tablename__ = 'courses'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    instructor_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    level = Column(String(50), nullable=False)
    category = Column(String(100))
    description = Column(Text)
    rating = Column(Float, default=4.5)
    duration = Column(String(50))
    students = Column(Integer, default=0)
    image_url = Column(String(255))
    xp_reward = Column(Integer, default=100)
    price = Column(Integer, default=0)
    subtitle = Column(Text)
    what_you_will_learn = Column(Text)
    requirements = Column(Text)
    target_audience = Column(Text)
    is_published = Column(Boolean, default=False)
    is_featured = Column(Boolean, default=False)

    # Relationships
    instructor = relationship('User', back_populates='courses')
    enrollments = relationship('Enrollment', back_populates='course', cascade="all, delete-orphan")
    modules = relationship('Module', back_populates='course', cascade="all, delete-orphan", order_by='Module.order_index')
    transactions = relationship('Transaction', back_populates='course')
    certificates = relationship('Certificate', back_populates='course', cascade="all, delete-orphan")
    lesson_progress = relationship('LessonProgress', back_populates='course', cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Course(id={self.id}, title='{self.title}', instructor_id={self.instructor_id})>"

    def increment_students(self):
        """Increment the student count."""
        self.students += 1

    def decrement_students(self):
        """Decrement the student count."""
        if self.students > 0:
            self.students -= 1


class Enrollment(Base, TimestampMixin):
    __tablename__ = 'enrollments'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    course_id = Column(Integer, ForeignKey('courses.id', ondelete='CASCADE'), nullable=False)
    progress = Column(Integer, default=0)
    enrolled_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    user = relationship('User', back_populates='enrollments')
    course = relationship('Course', back_populates='enrollments')
    
    __table_args__ = (UniqueConstraint('user_id', 'course_id', name='_user_course_uc'),)

    def __repr__(self):
        return f"<Enrollment(user_id={self.user_id}, course_id={self.course_id}, progress={self.progress})>"

    def update_progress(self, new_progress: int):
        """Update enrollment progress."""
        self.progress = min(max(new_progress, 0), 100)
        if self.progress == 100 and not self.completed_at:
            self.completed_at = datetime.utcnow()
        return self.progress


class Notification(Base, TimestampMixin):
    __tablename__ = 'notifications'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default='info')
    is_read = Column(Boolean, default=False)

    user = relationship('User', back_populates='notifications')

    def __repr__(self):
        return f"<Notification(id={self.id}, user_id={self.user_id}, type='{self.type}')>"

    def mark_as_read(self):
        """Mark notification as read."""
        self.is_read = True


class NotificationTemplate(Base, TimestampMixin):
    __tablename__ = 'notification_templates'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default='info')

    def __repr__(self):
        return f"<NotificationTemplate(id={self.id}, title='{self.title}', type='{self.type}')>"


class ActivityLog(Base, TimestampMixin):
    __tablename__ = 'activity_logs'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    user = Column(String(255), nullable=False)  # User's name at the time of logging
    email = Column(String(255), nullable=False)  # User's email at the time of logging
    action = Column(String(255), nullable=False)
    details = Column(Text)
    status = Column(String(50), default='info')
    type = Column(String(50), default='general')  # Corresponds to log_type in the function
    ip = Column(String(100))

    user_obj = relationship('User', back_populates='activity_logs')

    def __repr__(self):
        return f"<ActivityLog(id={self.id}, user_id={self.user_id}, action='{self.action}')>"


class ChatGroup(Base, TimestampMixin):
    __tablename__ = 'chat_groups'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    creator_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    group_icon = Column(String(255))
    messages_restricted = Column(Boolean, default=False)

    creator = relationship('User', back_populates='created_chat_groups')
    members = relationship('ChatGroupMember', back_populates='group', cascade="all, delete-orphan")
    messages = relationship('Message', back_populates='group', cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ChatGroup(id={self.id}, name='{self.name}', creator_id={self.creator_id})>"

    def add_member(self, user_id: int):
        """Add a member to the chat group."""
        existing = ChatGroupMember.query.filter_by(group_id=self.id, user_id=user_id).first()
        if not existing:
            member = ChatGroupMember(group_id=self.id, user_id=user_id)
            return member
        return None

    def remove_member(self, user_id: int):
        """Remove a member from the chat group."""
        member = ChatGroupMember.query.filter_by(group_id=self.id, user_id=user_id).first()
        if member:
            return member
        return None


class ChatGroupMember(Base):
    __tablename__ = 'chat_group_members'
    
    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey('chat_groups.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    last_read_timestamp = Column(DateTime, nullable=True)

    group = relationship('ChatGroup', back_populates='members')
    user = relationship('User', back_populates='chat_group_memberships')

    __table_args__ = (UniqueConstraint('group_id', 'user_id', name='_group_user_uc'),)

    def __repr__(self):
        return f"<ChatGroupMember(group_id={self.group_id}, user_id={self.user_id})>"

    def update_last_read(self):
        """Update the last read timestamp to current time."""
        self.last_read_timestamp = datetime.utcnow()


class Community(Base, TimestampMixin):
    __tablename__ = 'communities'

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    icon = Column(String(255))
    subject = Column(String(255))
    creator_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    is_public = Column(Boolean, default=True)
    max_members = Column(Integer, default=50)
    join_code = Column(String(50), unique=True)
    member_count = Column(Integer, default=0)
    chat_group_id = Column(Integer, ForeignKey('chat_groups.id', ondelete='SET NULL'), nullable=True)

    creator = relationship('User')
    members = relationship('CommunityMember', back_populates='community', cascade="all, delete-orphan")
    chat_group = relationship('ChatGroup', foreign_keys='Community.chat_group_id')

    def __repr__(self):
        return f"<Community(id={self.id}, name='{self.name}', creator_id={self.creator_id})>"


class CommunityMember(Base):
    __tablename__ = 'community_members'

    id = Column(Integer, primary_key=True)
    community_id = Column(Integer, ForeignKey('communities.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    role = Column(String(50), default='member')
    joined_at = Column(DateTime, default=datetime.utcnow)

    community = relationship('Community', back_populates='members')
    user = relationship('User')

    __table_args__ = (UniqueConstraint('community_id', 'user_id', name='_community_user_uc'),)

    def __repr__(self):
        return f"<CommunityMember(community_id={self.community_id}, user_id={self.user_id}, role='{self.role}')>"


class Friend(Base, TimestampMixin):
    __tablename__ = 'friends'

    id = Column(Integer, primary_key=True)
    requester_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    addressee_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    status = Column(String(50), default='pending')

    requester = relationship('User', foreign_keys=[requester_id], back_populates='sent_friend_requests')
    addressee = relationship('User', foreign_keys=[addressee_id], back_populates='received_friend_requests')

    __table_args__ = (UniqueConstraint('requester_id', 'addressee_id', name='_friend_uc'),)

    def __repr__(self):
        return f"<Friend(requester={self.requester_id}, addressee={self.addressee_id}, status='{self.status}')>"


class Message(Base, TimestampMixin):
    __tablename__ = 'messages'
    
    id = Column(Integer, primary_key=True)
    sender_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    receiver_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=True)
    group_id = Column(Integer, ForeignKey('chat_groups.id', ondelete='CASCADE'), nullable=True)
    content = Column(Text, nullable=False)
    type = Column(String(50), default='user')
    is_read = Column(Boolean, default=False, index=True)
    edited_at = Column(DateTime, nullable=True)

    sender = relationship('User', foreign_keys=[sender_id], back_populates='sent_messages')
    receiver = relationship('User', foreign_keys=[receiver_id], back_populates='received_messages')
    group = relationship('ChatGroup', back_populates='messages')
    reactions = relationship('MessageReaction', back_populates='message', cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Message(id={self.id}, sender_id={self.sender_id}, type='{self.type}')>"

    def mark_as_read(self):
        """Mark message as read."""
        self.is_read = True

    def edit(self, new_content: str):
        """Edit message content."""
        self.content = new_content
        self.edited_at = datetime.utcnow()

    def add_reaction(self, user_id: int, emoji: str):
        """Add a reaction to the message."""
        existing = MessageReaction.query.filter_by(
            message_id=self.id, 
            user_id=user_id, 
            emoji=emoji
        ).first()
        if not existing:
            reaction = MessageReaction(message_id=self.id, user_id=user_id, emoji=emoji)
            return reaction
        return None

    def remove_reaction(self, user_id: int, emoji: str):
        """Remove a reaction from the message."""
        reaction = MessageReaction.query.filter_by(
            message_id=self.id, 
            user_id=user_id, 
            emoji=emoji
        ).first()
        if reaction:
            return reaction
        return None


class MessageReaction(Base, TimestampMixin):
    __tablename__ = 'message_reactions'
    
    id = Column(Integer, primary_key=True)
    message_id = Column(Integer, ForeignKey('messages.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    emoji = Column(String(50), nullable=False)

    message = relationship('Message', back_populates='reactions')
    user = relationship('User', back_populates='message_reactions')

    __table_args__ = (UniqueConstraint('message_id', 'user_id', 'emoji', name='_message_user_emoji_uc'),)

    def __repr__(self):
        return f"<MessageReaction(message_id={self.message_id}, user_id={self.user_id}, emoji='{self.emoji}')>"


class InstructorChatSettings(Base, TimestampMixin):
    __tablename__ = 'instructor_chat_settings'
    
    id = Column(Integer, primary_key=True)
    instructor_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True)
    messages_blocked = Column(Boolean, default=False, nullable=False)
    
    instructor = relationship('User', back_populates='instructor_chat_settings')
    
    def __repr__(self):
        return f"<InstructorChatSettings(instructor_id={self.instructor_id}, messages_blocked={self.messages_blocked})>"


class ChatAccess(Base, TimestampMixin):
    __tablename__ = 'chat_access'
    
    id = Column(Integer, primary_key=True)
    instructor_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    status = Column(String(50), default='allowed', nullable=False)
    
    instructor = relationship('User', foreign_keys=[instructor_id], back_populates='chat_access_rules')
    user = relationship('User', foreign_keys=[user_id], back_populates='chat_access_for')
    
    __table_args__ = (UniqueConstraint('instructor_id', 'user_id', name='_instructor_user_uc'),)
    
    def __repr__(self):
        return f"<ChatAccess(instructor_id={self.instructor_id}, user_id={self.user_id}, status='{self.status}')>"


class Module(Base, TimestampMixin):
    __tablename__ = 'modules'
    
    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey('courses.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    order_index = Column(Integer, default=0)

    course = relationship('Course', back_populates='modules')
    lessons = relationship('Lesson', back_populates='module', cascade="all, delete-orphan", order_by='Lesson.order_index')

    def __repr__(self):
        return f"<Module(id={self.id}, title='{self.title}', course_id={self.course_id})>"

    def get_total_lessons(self):
        """Get the total number of lessons in this module."""
        return len(self.lessons)

    def get_completed_lessons(self, user_id: int):
        """Get the number of completed lessons for a user in this module."""
        from sqlalchemy import func
        completed = LessonProgress.query.filter(
            LessonProgress.user_id == user_id,
            LessonProgress.lesson_id.in_([lesson.id for lesson in self.lessons])
        ).count()
        return completed


class Lesson(Base, TimestampMixin):
    __tablename__ = 'lessons'
    
    id = Column(Integer, primary_key=True)
    module_id = Column(Integer, ForeignKey('modules.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # e.g., 'video', 'text', 'quiz'
    content = Column(Text)
    duration = Column(String(50))
    video_url = Column(String(255))
    slides_url = Column(String(255))
    files = Column(JSON, nullable=True)
    is_required_to_pass = Column(Boolean, default=False)
    passing_score = Column(Integer, default=70)
    order_index = Column(Integer, default=0)

    module = relationship('Module', back_populates='lessons')
    questions = relationship('Question', back_populates='lesson', cascade="all, delete-orphan", order_by='Question.order_index')
    quiz_attempts = relationship('QuizAttempt', back_populates='lesson', cascade="all, delete-orphan")
    lesson_progress = relationship('LessonProgress', back_populates='lesson', cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Lesson(id={self.id}, title='{self.title}', type='{self.type}')>"

    def is_completed_by_user(self, user_id: int) -> bool:
        """Check if this lesson is completed by a user."""
        return LessonProgress.query.filter_by(
            user_id=user_id, 
            lesson_id=self.id
        ).first() is not None

    def get_user_quiz_attempts(self, user_id: int):
        """Get all quiz attempts for this lesson by a user."""
        return QuizAttempt.query.filter_by(
            user_id=user_id,
            lesson_id=self.id
        ).order_by(QuizAttempt.attempted_at.desc()).all()

    def get_best_quiz_score(self, user_id: int) -> Optional[float]:
        """Get the best quiz score for this lesson by a user."""
        best = QuizAttempt.query.filter_by(
            user_id=user_id,
            lesson_id=self.id,
            passed=True
        ).order_by(QuizAttempt.score.desc()).first()
        return best.score if best else None


class Question(Base, TimestampMixin):
    __tablename__ = 'questions'
    
    id = Column(Integer, primary_key=True)
    lesson_id = Column(Integer, ForeignKey('lessons.id', ondelete='CASCADE'), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), default='multiple_choice')
    points = Column(Integer, default=1)
    order_index = Column(Integer, default=0)

    lesson = relationship('Lesson', back_populates='questions')
    options = relationship('QuestionOption', back_populates='question', cascade="all, delete-orphan", order_by='QuestionOption.order_index')

    def __repr__(self):
        return f"<Question(id={self.id}, lesson_id={self.lesson_id}, type='{self.question_type}')>"

    def get_correct_options(self):
        """Get all correct options for this question."""
        return [opt for opt in self.options if opt.is_correct]

    def check_answer(self, selected_option_ids: list) -> bool:
        """Check if the selected options are correct."""
        correct_ids = [opt.id for opt in self.get_correct_options()]
        return set(selected_option_ids) == set(correct_ids)


class QuestionOption(Base, TimestampMixin):
    __tablename__ = 'question_options'
    
    id = Column(Integer, primary_key=True)
    question_id = Column(Integer, ForeignKey('questions.id', ondelete='CASCADE'), nullable=False)
    option_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False)
    order_index = Column(Integer, default=0)

    question = relationship('Question', back_populates='options')

    def __repr__(self):
        return f"<QuestionOption(id={self.id}, question_id={self.question_id}, is_correct={self.is_correct})>"


class QuizAttempt(Base, TimestampMixin):
    __tablename__ = 'quiz_attempts'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    lesson_id = Column(Integer, ForeignKey('lessons.id', ondelete='CASCADE'), nullable=False)
    score = Column(Float, nullable=False)
    passed = Column(Boolean, nullable=False)
    details = Column(Text)  # JSON string of answers and results
    attempted_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship('User', back_populates='quiz_attempts')
    lesson = relationship('Lesson', back_populates='quiz_attempts')

    def __repr__(self):
        return f"<QuizAttempt(id={self.id}, user_id={self.user_id}, lesson_id={self.lesson_id}, score={self.score})>"


class LessonProgress(Base, TimestampMixin):
    __tablename__ = 'lesson_progress'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    course_id = Column(Integer, ForeignKey('courses.id', ondelete='CASCADE'), nullable=False)
    lesson_id = Column(Integer, ForeignKey('lessons.id', ondelete='CASCADE'), nullable=False)
    completed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship('User', back_populates='lesson_progress')
    course = relationship('Course', back_populates='lesson_progress')
    lesson = relationship('Lesson', back_populates='lesson_progress')

    __table_args__ = (UniqueConstraint('user_id', 'lesson_id', name='_user_lesson_uc'),)

    def __repr__(self):
        return f"<LessonProgress(user_id={self.user_id}, lesson_id={self.lesson_id})>"


class LiveClass(Base, TimestampMixin):
    __tablename__ = 'live_classes'
    
    id = Column(Integer, primary_key=True)
    creator_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    creator_type = Column(String(50), nullable=False, default='instructor')
    title = Column(String(255), nullable=False)
    meeting_link = Column(String(255), nullable=False)
    whatsapp_link = Column(String(255), nullable=True)
    social_link = Column(String(255), nullable=True)
    description = Column(Text)
    expires_after_class = Column(Boolean, default=False)

    creator = relationship('User', back_populates='live_classes_created')
    students = relationship('LiveClassStudent', back_populates='live_class', cascade="all, delete-orphan")

    def __repr__(self):
        return f"<LiveClass(id={self.id}, title='{self.title}', creator_id={self.creator_id})>"

    def add_student(self, student_id: int):
        """Add a student to the live class."""
        existing = LiveClassStudent.query.filter_by(
            live_class_id=self.id, 
            student_id=student_id
        ).first()
        if not existing:
            student = LiveClassStudent(live_class_id=self.id, student_id=student_id)
            return student
        return None


class LiveClassStudent(Base):
    __tablename__ = 'live_class_students'
    
    id = Column(Integer, primary_key=True)
    live_class_id = Column(Integer, ForeignKey('live_classes.id', ondelete='CASCADE'), nullable=False)
    student_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    live_class = relationship('LiveClass', back_populates='students')
    student = relationship('User', back_populates='live_classes_attending')

    __table_args__ = (UniqueConstraint('live_class_id', 'student_id', name='_live_class_student_uc'),)

    def __repr__(self):
        return f"<LiveClassStudent(live_class_id={self.live_class_id}, student_id={self.student_id})>"


class Certificate(Base, TimestampMixin):
    __tablename__ = 'certificates'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    course_id = Column(Integer, ForeignKey('courses.id', ondelete='CASCADE'), nullable=False)
    certificate_id = Column(String(255), unique=True, nullable=False)
    user_name = Column(String(255), nullable=False)
    course_title = Column(String(255), nullable=False)
    completion_date = Column(DateTime, nullable=False)
    issued_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_valid = Column(Boolean, default=True)

    user = relationship('User', back_populates='certificates')
    course = relationship('Course', back_populates='certificates')

    def __repr__(self):
        return f"<Certificate(id={self.id}, certificate_id='{self.certificate_id}', user_id={self.user_id})>"

    def revoke(self):
        """Revoke the certificate."""
        self.is_valid = False


class SystemSetting(Base):
    __tablename__ = 'system_settings'
    
    key = Column(String(255), primary_key=True)
    value = Column(Text, nullable=False)

    def __repr__(self):
        return f"<SystemSetting(key='{self.key}', value='{self.value}')>"

    @classmethod
    def get_setting(cls, session: Session, key: str, default=None):
        """Get a system setting by key."""
        setting = session.query(cls).filter_by(key=key).first()
        return setting.value if setting else default

    @classmethod
    def set_setting(cls, session: Session, key: str, value: str):
        """Set a system setting."""
        setting = session.query(cls).filter_by(key=key).first()
        if setting:
            setting.value = value
        else:
            setting = cls(key=key, value=value)
            session.add(setting)
        return setting


class Transaction(Base, TimestampMixin):
    __tablename__ = 'transactions'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey('courses.id', ondelete='SET NULL'), nullable=True, index=True)
    reference = Column(String(255), unique=True, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    status = Column(String(50), nullable=False, default='pending')
    gateway = Column(String(50), default='paystack')

    user = relationship('User', back_populates='transactions')
    course = relationship('Course', back_populates='transactions')

    def __repr__(self):
        return f"<Transaction(id={self.id}, reference='{self.reference}', status='{self.status}')>"

    def mark_as_completed(self):
        """Mark transaction as completed."""
        self.status = 'completed'

    def mark_as_failed(self):
        """Mark transaction as failed."""
        self.status = 'failed'

    def mark_as_refunded(self):
        """Mark transaction as refunded."""
        self.status = 'refunded'


class Payout(Base, TimestampMixin):
    __tablename__ = 'payouts'

    id = Column(Integer, primary_key=True)
    instructor_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    status = Column(String(50), default='pending', nullable=False)
    payout_type = Column(String(50), default='bank_account', nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    instructor = relationship('User', back_populates='payouts')
    details = relationship('PayoutDetail', back_populates='payout', cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Payout(id={self.id}, instructor_id={self.instructor_id}, status='{self.status}')>"


class PayoutDetail(Base, TimestampMixin):
    __tablename__ = 'payout_details'

    id = Column(Integer, primary_key=True)
    payout_id = Column(Integer, ForeignKey('payouts.id', ondelete='CASCADE'), nullable=False, index=True)
    payout_type = Column(String(50), nullable=False)
    details = Column(JSON, nullable=True)

    payout = relationship('Payout', back_populates='details')

    def __repr__(self):
        return f"<PayoutDetail(id={self.id}, payout_id={self.payout_id}, type='{self.payout_type}')>"


class Note(Base, TimestampMixin):
    __tablename__ = 'notes'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)
    course_name = Column(String(255), nullable=True)
    image_url = Column(String(255), nullable=True)

    user = relationship('User', back_populates='notes')

    def __repr__(self):
        return f"<Note(id={self.id}, user_id={self.user_id}, title='{self.title}')>"


class PlannerTask(Base, TimestampMixin):
    __tablename__ = 'planner_tasks'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(String(50), nullable=True)
    completed = Column(Boolean, default=False, nullable=False)

    user = relationship('User', back_populates='planner_tasks')

    def __repr__(self):
        return f"<PlannerTask(id={self.id}, user_id={self.user_id}, title='{self.title}', completed={self.completed})>"


# --- Audit Log Model ---
class AuditLog(Base, TimestampMixin):
    """Audit trail for sensitive operations."""
    __tablename__ = 'audit_logs'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    action = Column(String(255), nullable=False)
    table_name = Column(String(255), nullable=False)
    record_id = Column(String(255), nullable=False)  # Can store integer or UUID
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    ip_address = Column(String(45))  # IPv6 compatible
    user_agent = Column(String(255))

    user = relationship('User', foreign_keys=[user_id])

    def __repr__(self):
        return f"<AuditLog(id={self.id}, action='{self.action}', table='{self.table_name}')>"


# --- Database Event Listeners ---
@event.listens_for(User, 'before_insert')
def user_before_insert(mapper, connection, target):
    """Set default values before inserting a user."""
    if not target.created_at:
        target.created_at = datetime.utcnow()
    if not target.last_seen:
        target.last_seen = datetime.utcnow()


@event.listens_for(Enrollment, 'after_insert')
def enrollment_after_insert(mapper, connection, target):
    """Atomically increment course student count after enrollment."""
    course_table = Course.__table__
    connection.execute(
        course_table.update().
        where(course_table.c.id == target.course_id).
        values(students=course_table.c.students + 1)
    )


@event.listens_for(Enrollment, 'after_delete')
def enrollment_after_delete(mapper, connection, target):
    """Atomically decrement course student count after enrollment deletion."""
    course_table = Course.__table__
    connection.execute(
        course_table.update().
        where(course_table.c.id == target.course_id).
        values(students=course_table.c.students - 1)
    )


def init_db():
    """Initializes the database and creates tables from models."""
    print("Initializing database...")
    session = get_db_session()
    try:
        Base.metadata.create_all(bind=engine)
        print("âœ… Database initialized successfully!")
        
        # Create default system settings if they don't exist
        inspector = inspect(engine)
        if 'system_settings' in inspector.get_table_names():
            default_settings = [
                {'key': 'site_name', 'value': 'MysteryPath'},
                {'key': 'site_description', 'value': 'Learn with MysteryPath'},
                {'key': 'default_xp_reward', 'value': '100'},
                {'key': 'trial_duration_days', 'value': '14'},
                {'key': 'max_course_upload_size', 'value': '500'},
                {'key': 'supported_video_formats', 'value': 'mp4,webm,ogg'},
                {'key': 'max_quiz_attempts', 'value': '3'},
            ]
            
            for setting in default_settings:
                existing = session.query(SystemSetting).filter_by(key=setting['key']).first()
                if not existing:
                    session.add(SystemSetting(**setting))
            session.commit()
            print("âœ… Default system settings created/verified!")
                
    except Exception as e:
        print(f"âŒ Error initializing database: {e}")
        session.rollback()
        raise
    finally:
        session.close()


def reset_db():
    """Drops all tables and recreates them. USE WITH CAUTION!"""
    confirm = input("âš ï¸ This will delete all data. Are you sure? (yes/no): ")
    if confirm.lower() == 'yes':
        print("Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        print("âœ… Tables dropped!")
        init_db()
    else:
        print("Operation cancelled.")


def get_table_names():
    """Get list of all table names in the database."""
    from sqlalchemy import inspect
    inspector = inspect(engine)
    return inspector.get_table_names()


def get_database_info():
    """Get information about the current database connection."""
    info = {
        'db_type': DB_TYPE,
        'uri': SQLALCHEMY_DATABASE_URI,
        'tables': get_table_names(),
        'engine': str(engine),
    }
    return info


def create_admin_user(session: Session, email: str, password: str, name: str = "Admin"):
    """Create an admin user if one doesn't exist."""
    # Local import to avoid circular dependency with extensions.py
    from extensions import bcrypt
    
    existing = session.query(User).filter_by(email=email).first()
    if existing:
        print(f"Admin user with email {email} already exists.")
        return existing
    
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    admin = User(
        email=email,
        name=name,
        password=hashed_password,
        role='admin',
        is_active=True
    )
    session.add(admin)
    session.commit()
    print(f"âœ… Admin user created: {email}")
    return admin


# --- Async Support (Optional) ---
if USE_ASYNC:
    try:
        from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
        
        async_engine = create_async_engine(
            ASYNC_DATABASE_URI,
            echo=os.getenv('SQL_ECHO', 'false').lower() == 'true',
            pool_size=int(os.getenv('DB_POOL_SIZE', 20)),
            max_overflow=int(os.getenv('DB_MAX_OVERFLOW', 10))
        )
        
        AsyncSessionLocal = async_sessionmaker(
            async_engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
        
        async def get_async_db() -> AsyncSession:
            """Get async database session."""
            async with AsyncSessionLocal() as session:
                try:
                    yield session
                finally:
                    await session.close()
                    
    except ImportError:
        print("âš ï¸ Async dependencies not installed. Install with: pip install asyncpg aiosqlite")
        USE_ASYNC = False


# --- Main Execution ---
if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Database management tool')
    parser.add_argument('--init', action='store_true', help='Initialize database')
    parser.add_argument('--reset', action='store_true', help='Reset database (WARNING: deletes all data)')
    parser.add_argument('--info', action='store_true', help='Show database information')
    parser.add_argument('--create-admin', action='store_true', help='Create admin user')
    parser.add_argument('--admin-email', type=str, help='Admin email')
    parser.add_argument('--admin-password', type=str, help='Admin password')
    parser.add_argument('--admin-name', type=str, default='Admin', help='Admin name')
    
    args = parser.parse_args()
    
    if args.reset:
        reset_db()
    elif args.init:
        init_db()
    elif args.info:
        import json
        print(json.dumps(get_database_info(), indent=2, default=str))
    elif args.create_admin:
        if not args.admin_email or not args.admin_password:
            print("âŒ Please provide --admin-email and --admin-password")
        else:
            init_db()
            session = get_db_session()
            try:
                create_admin_user(session, args.admin_email, args.admin_password, args.admin_name)
            except Exception as e:
                print(f"âŒ Error creating admin user: {e}")
                session.rollback()
            finally:
                session.close()
    else:
        init_db()

