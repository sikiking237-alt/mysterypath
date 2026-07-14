# backend/fix_all_users.py
from database import db_session, User
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

def fix_all_users():
    session = db_session()
    try:
        # Get all users
        users = session.query(User).all()
        print(f"Found {len(users)} users in database\n")
        
        for user in users:
            print(f"User: {user.email}")
            print(f"  Role: {user.role}")
            print(f"  Password hash: {user.password[:30] if user.password else 'EMPTY'}...")
            
            # Check if password is valid
            try:
                is_valid = check_password_hash(user.password, 'password123')
                if is_valid:
                    print("  ✅ Password is valid\n")
                    continue
            except:
                pass
            
            # Fix password
            print("  🔧 Fixing password...")
            user.password = generate_password_hash('password123')
            session.commit()
            
            # Verify
            is_valid = check_password_hash(user.password, 'password123')
            if is_valid:
                print("  ✅ Password fixed!\n")
            else:
                print("  ❌ Password fix failed\n")
        
        print("=" * 50)
        print("All users fixed!")
        print("Default password for all users: password123")
        print("=" * 50)
        
    except Exception as e:
        print(f"Error: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == '__main__':
    fix_all_users()
