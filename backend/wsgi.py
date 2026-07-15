# backend/wsgi.py - WSGI entry point for Gunicorn
import os
import sys
from dotenv import load_dotenv

# Add project root to sys.path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Load environment variables
load_dotenv()

# Set defaults if not set
if not os.getenv('SECRET_KEY'):
    os.environ['SECRET_KEY'] = 'dev-secret-key-12345-change-in-production'
if not os.getenv('JWT_SECRET_KEY'):
    os.environ['JWT_SECRET_KEY'] = 'jwt-secret-key-12345-change-in-production'
if not os.getenv('DATABASE_NAME'):
    os.environ['DATABASE_NAME'] = 'mysterypath.db'

# Import app for Gunicorn
try:
    from backend.app import app as application
    from backend.database import Base, engine
    print("✅ WSGI app imported successfully!")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables verified/created")
except Exception as e:
    print(f"❌ Error importing app: {e}")
    import traceback
    traceback.print_exc()
    raise

# Gunicorn expects 'application' variable
app = application
