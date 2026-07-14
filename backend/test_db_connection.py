# backend/test_db_connection.py
from database import get_db_session, engine, close_db
from sqlalchemy import text, inspect, MetaData
import traceback

def test_db():
    print("=== DATABASE CONNECTION TEST ===")
    
    # Check engine
    print(f"Engine URL: {engine.url}")
    
    session = get_db_session()
    try:
        inspector = inspect(engine)
        print(f"Tables: {inspector.get_table_names()}")
        
        # Test connection
        result = session.execute(text("SELECT 1")).scalar()
        print(f"✅ Connection successful: {result}")
        
        # Check users table
        metadata = MetaData()
        metadata.reflect(bind=engine)
        
        if 'users' in metadata.tables:
            print("✅ Users table exists")
            # Check columns
            users_table = metadata.tables['users']
            print(f"Columns: {[c.name for c in users_table.columns]}")
        else:
            print("❌ Users table does not exist!")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        traceback.print_exc()
    finally:
        close_db()

if __name__ == '__main__':
    test_db()