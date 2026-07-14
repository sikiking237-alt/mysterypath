# backend/check_user.py
from database import get_db_session, User, close_db
import sys
import traceback

def check_user():
    print("=== CHECKING DATABASE ===")
    session = get_db_session()
    try:
        # Check if any users exist
        total_users = session.query(User).count()
        print(f"Total users in database: {total_users}")
        
        # Check specific user
        user = session.query(User).filter_by(email='instructor@learnflow.com').first()
        if user:
            print(f"✅ User found:")
            print(f"  Name: {user.name}")
            print(f"  Email: {user.email}")
            print(f"  Role: {user.role}")
            print(f"  Active: {user.is_active}")
            print(f"  Password hash: {user.password[:30]}...")
        else:
            print("❌ User not found: instructor@learnflow.com")
            
        # List all users
        all_users = session.query(User).all()
        if all_users:
            print("\nAll users in database:")
            for u in all_users:
                print(f"  - {u.email} ({u.role})")
        else:
            print("\nNo users found in database!")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        traceback.print_exc()
    finally:
        close_db()

if __name__ == '__main__':
    check_user()