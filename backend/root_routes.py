# backend/root_routes.py
from flask import jsonify

def register_root_routes(app):
    @app.route('/')
    def index():
        return jsonify({
            "message": "Welcome to MysteryPath API",
            "status": "running",
            "version": "1.0.0",
            "documentation": "/api/health",
            "endpoints": {
                "auth": "/api/auth",
                "courses": "/api/courses",
                "profile": "/api/profile",
                "admin": "/api/admin",
                "health": "/api/health"
            }
        })
