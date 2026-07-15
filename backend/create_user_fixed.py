# backend/create_user_fixed.py
from database import get_db_session, User, close_db
from extensions import bcrypt
import sys
import traceback

def create_user():
    print("=== CREATING TEST USER ===")
    session = get_db_session()
    try:
        # Check if user exists
        user = session.query(User).filter_by(email='instructor@learnflow.com').first()
        if user:
            print(f"✅ User already exists: {user.email}")
            print(f"  Role: {user.role}")
            return
        
        # Create user
        new_user = User(
            email='instructor@learnflow.com',
            name='Instructor User',
            password=bcrypt.hashpw('password123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
            role='instructor',
            is_active=True
        )
        session.add(new_user)
        session.commit()
        print("✅ User created successfully!")
        print("Email: instructor@learnflow.com")
        print("Password: password123")
        print("Role: instructor")
        
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        traceback.print_exc()
    finally:
        close_db()

if __name__ == '__main__':
    create_user()