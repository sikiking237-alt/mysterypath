# backend/check_messages.py
from database import db_session, Message, User

def check_messages():
    session = db_session()
    messages = session.query(Message).all()
    print(f'Total messages: {len(messages)}\n')
    
    for msg in messages[:10]:
        sender = session.query(User).filter_by(id=msg.sender_id).first()
        receiver = session.query(User).filter_by(id=msg.receiver_id).first()
        sender_name = sender.name if sender else "Unknown"
        receiver_name = receiver.name if receiver else "Unknown"
        print(f'  - From: {sender_name} -> To: {receiver_name}: {msg.content[:40]}...')
    
    session.close()

if __name__ == '__main__':
    check_messages()
