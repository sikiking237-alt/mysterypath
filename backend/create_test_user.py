# backend/create_test_user.py
from database import get_db_session, close_db, User
from flask import Flask
from extensions import bcrypt
from .config import Config
from datetime import datetime


def create_test_user():
    print("=== CREATING/VERIFYING TEST USER ===")

    # A minimal Flask app is needed to provide context for extensions like Bcrypt
    app = Flask(__name__)
    app.config.from_object(Config)
    

    # Run database operations within the app context
    with app.app_context():
        session = get_db_session()
        try:
            user = session.query(User).filter_by(email='instructor@learnflow.com').first()

            if user:
                is_correct = False
                try:
                    # This will fail if user.password is not a valid hash (e.g., plaintext or from another library)
                    is_correct = bcrypt.checkpw('password123'.encode('utf-8'), user.password.encode('utf-8'))
                except (ValueError, TypeError):
                    print("⚠️ Stored password for 'instructor@learnflow.com' is not a valid bcrypt hash.")
                    is_correct = False

                if is_correct:
                    print(f"✅ User 'instructor@learnflow.com' already exists with the correct password.")
                    return
                else:
                    print("User exists but with an incorrect or malformed password. Updating password...")
                    user.password = bcrypt.hashpw('password123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                    session.commit()
                    print("✅ Password updated successfully!")
                    return

            # If user does not exist, create them
            print("User 'instructor@learnflow.com' not found. Creating new user...")
            new_user = User(
                email='instructor@learnflow.com',
                name='Instructor User',
                password=bcrypt.hashpw('password123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
                role='instructor',
                is_active=True,
                xp=0,
                streak_days=0,
                longest_streak=0,
                total_activities=0,
                is_trial_active=True,
                created_at=datetime.utcnow()
            )
            session.add(new_user)
            session.commit()
            print("✅ User created successfully!")
            print("   Email: instructor@learnflow.com")
            print("   Password: password123")
        finally:
            close_db()


if __name__ == '__main__':
    create_test_user()