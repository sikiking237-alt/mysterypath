from database import db_session, User
from werkzeug.security import generate_password_hash, check_password_hash

def create_new_user():
    session = db_session()
    try:
        existing = session.query(User).filter_by(email='instructor@learnflow.com').first()
        if existing:
            print(f"Deleting existing user: {existing.email}")
            session.delete(existing)
            session.commit()
            print("✅ Existing user deleted")
        
        print("Creating new user...")
        new_user = User(
            email='instructor@learnflow.com',
            name='Instructor User',
            password=generate_password_hash('password123'),
            role='instructor',
            is_active=True,
            xp=0,
            streak_days=0
        )
        session.add(new_user)
        session.commit()
        
        print("✅ New user created successfully!")
        print(f"Email: {new_user.email}")
        print(f"Name: {new_user.name}")
        print(f"Role: {new_user.role}")
        
        verify_user = session.query(User).filter_by(email='instructor@learnflow.com').first()
        if verify_user:
            is_valid = check_password_hash(verify_user.password, 'password123')
            print(f"Password verification: {is_valid}")
            
    except Exception as e:
        print(f"Error: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == '__main__':
    create_new_user()
