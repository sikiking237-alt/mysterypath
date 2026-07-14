# backend/run.py - New version without Eventlet
import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env file at the very beginning
load_dotenv()

import logging
from backend import create_app

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_server():
    """Create and run the Flask application."""
    app = create_app()
    try:
        port = int(os.environ.get('PORT', 5000))
        debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
        threads = int(os.environ.get('WAITRESS_THREADS', 4))
        
        print(f"""
========================================
  MysteryPath Backend Server
  Running on: http://localhost:{port}
  Debug mode: {debug}
  API endpoints: /api/
========================================
        """)
        
        # Try using waitress first (production-ready)
        try:
            from waitress import serve
            logger.info(f"Starting waitress server on port {port}")
            serve(app, host='0.0.0.0', port=port, threads=threads)
        except ImportError:
            # Fallback to Flask development server
            logger.info(f"Starting Flask development server on port {port}")
            app.run(host='0.0.0.0', port=port, debug=debug)
            
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        sys.exit(1)

if __name__ == '__main__':
    run_server()