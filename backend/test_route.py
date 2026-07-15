# backend/test_route.py - Simple test route for debugging
def register_test_routes(app):
    @app.route('/test-direct')
    def test_direct():
        return {"status": "ok", "message": "Direct route works!"}
    
    @app.route('/test-auth')
    def test_auth():
        return {"status": "ok", "message": "Auth blueprint is registered!"}
