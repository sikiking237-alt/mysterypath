# backend/fix_user.py
from database import db_session, User
from werkzeug.security import generate_password_hash, check_password_hash

def fix_user():
    session = db_session()
    try:
        user = session.query(User).filter_by(email='instructor@learnflow.com').first()
        
        if user:
            print("Found user:", user.email)
            print("Current password hash:", user.password[:30] + "..." if user.password else "EMPTY")
            
            # Generate new password hash
            new_password = 'password123'
            user.password = generate_password_hash(new_password)
            session.commit()
            
            print("After update:", user.password[:30] + "...")
            
            # Verify it works
            is_valid = check_password_hash(user.password, new_password)
            print("Password verification:", is_valid)
            
            if is_valid:
                print("✅ Password is valid!")
            else:
                print("❌ Password is still invalid")
        else:
            print("User not found. Creating new user...")
            from datetime import datetime
            new_user = User(
                email='instructor@learnflow.com',
                name='Instructor User',
                password=generate_password_hash('password123'),
                role='instructor',
                is_active=True,
                created_at=datetime.utcnow()
            )
            session.add(new_user)
            session.commit()
            print("✅ New user created!")
            print("   Email: instructor@learnflow.com")
            print("   Password: password123")
            
    except Exception as e:
        print("Error:", e)
        session.rollback()
    finally:
        session.close()

if __name__ == '__main__':
    fix_user()
