# backend/run.py
import os
import sys
from dotenv import load_dotenv

# Add project root to sys.path so backend can be imported as a package
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Load environment variables
load_dotenv()

# Set defaults if not set
if not os.getenv('SECRET_KEY'):
    os.environ['SECRET_KEY'] = 'dev-secret-key-12345-change-in-production'
if not os.getenv('JWT_SECRET_KEY'):
    os.environ['JWT_SECRET_KEY'] = 'jwt-secret-key-12345-change-in-production'
if not os.getenv('DATABASE_NAME'):
    os.environ['DATABASE_NAME'] = 'mysterypath.db'

print("✅ Environment variables loaded")

try:
    from backend.app import app, socketio
    from backend.database import Base, engine
    print("✅ App imported successfully!")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables verified/created")
except Exception as e:
    print(f"❌ Error importing app: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

if __name__ == '__main__':
    try:
        port = int(os.getenv('PORT', 5000))
        debug = os.getenv('DEBUG', 'True').lower() == 'true'
        
        print(f"""
╔═══════════════════════════════════════════════════════╗
║  🚀 MysteryPath Backend Server                        ║
║  📡 Running on: http://localhost:{port}                ║
║  🔧 Debug mode: {debug}                               ║
║  📂 API endpoints: /api/                             ║
║  🔌 Socket.IO enabled                                 ║
╚═══════════════════════════════════════════════════════╝
        """)
        
        socketio.run(app, host='0.0.0.0', port=port, debug=debug)
        
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
