# backend/add_messages.py
from database import db_session, User, Message
from datetime import datetime
import random

def add_messages():
    session = db_session()
    
    # Get the main user
    main_user = session.query(User).filter_by(email='oduro7688@gmail.com').first()
    if not main_user:
        print('Main user not found!')
        return
    
    # Get other users
    other_users = session.query(User).filter(User.id != main_user.id).all()
    if not other_users:
        print('No other users found!')
        return
    
    messages_text = [
        'Hello! Welcome to MysteryPath!',
        'How are you doing today?',
        'I love this platform!',
        'Have you checked the new courses?',
        'Lets schedule a study session.',
        'Great job on your progress!',
        'I need help with the Python course.',
        'The new UI looks amazing!',
        'When is the next live class?',
        'Keep up the good work!'
    ]
    
    count = 0
    for user in other_users:
        # Send messages from other users to main user
        for i in range(random.randint(1, 3)):
            msg = Message(
                sender_id=user.id,
                receiver_id=main_user.id,
                content=random.choice(messages_text),
                type='user',
                is_read=False,
                created_at=datetime.utcnow()
            )
            session.add(msg)
            count += 1
    
    session.commit()
    print(f'Added {count} messages!')
    session.close()

if __name__ == '__main__':
    add_messages()
