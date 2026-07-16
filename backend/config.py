# backend/config.py
import os
from dotenv import load_dotenv
import json

load_dotenv()

class Config:
    """Application configuration."""
    
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY')
    if not SECRET_KEY:
        raise ValueError("SECRET_KEY is not set in the environment or .env file. Please generate a key and add it.")
    
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    PORT = int(os.getenv('PORT', 5000))
    ENV = os.getenv('ENV', 'development')
    
    # Database
    DB_TYPE = os.getenv('DB_TYPE', 'sqlite')
    DATABASE_NAME = os.getenv('DATABASE_NAME', 'mysterypath.db')
    
    if DB_TYPE == 'postgresql':
        DB_USER = os.getenv('DB_USER', 'postgres')
        DB_PASSWORD = os.getenv('DB_PASSWORD', 'password')
        DB_HOST = os.getenv('DB_HOST', 'localhost')
        DB_PORT = os.getenv('DB_PORT', '5432')
        DB_NAME = os.getenv('DB_NAME', 'mysterypath')
        SQLALCHEMY_DATABASE_URI = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    else:
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{DATABASE_NAME}"
    
    # SQLAlchemy settings
    SQLALCHEMY_ECHO = os.getenv('SQLALCHEMY_ECHO', 'False').lower() == 'true'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours
    
    # CORS
    CORS_ORIGINS = json.loads(os.getenv('CORS_ORIGINS', '["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "https://mysterypath.netlify.app"]'))
    
    # File Upload
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'static/uploads/course_images')
    MAX_FILE_SIZE = int(os.getenv('MAX_FILE_SIZE', 50 * 1024 * 1024))  # 50MB
    
    # Frontend
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5174')
    
    # Encryption
    FERNET_KEY = os.getenv('FERNET_KEY', '')
    
    # Email (optional)
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
    MAIL_USERNAME = os.getenv('MAIL_USERNAME', '')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', '')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', '')
    
    # Paystack (optional)
    PAYSTACK_SECRET_KEY = os.getenv('PAYSTACK_SECRET_KEY', '')
    PAYSTACK_PUBLIC_KEY = os.getenv('PAYSTACK_PUBLIC_KEY', '')
    
    # Google OAuth (optional)
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET', '')
    
    # Twitter/X OAuth (optional)
    TWITTER_CLIENT_ID = os.getenv('TWITTER_CLIENT_ID', '')
    TWITTER_CLIENT_SECRET = os.getenv('TWITTER_CLIENT_SECRET', '')
    
    # AI Tutor
    AI_PROVIDER = os.getenv('AI_PROVIDER', 'gemini')
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
    OPENAI_MODEL = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')
    OPENAI_BASE_URL = os.getenv('OPENAI_BASE_URL', 'https://api.openai.com/v1')
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
    GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-2.0-flash')
    
    @staticmethod
    def get_allowed_extensions():
        return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf', 'doc', 'docx', 'mp4', 'webm']
