# Flask extensions
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
import bcrypt  # Changed from flask_bcrypt

# Initialize extensions
cors = CORS()
jwt = JWTManager()
socketio = SocketIO(cors_allowed_origins="*")
# bcrypt is now imported directly - no need to initialize it