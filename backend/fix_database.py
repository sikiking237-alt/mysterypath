# backend/fix_database.py
import sqlite3
import os
try:
    from database import SQLITE_PATH
except ImportError:
    # Fallback for environments where database.py might not be in the path
    SQLITE_PATH = 'mysterypath.db'

def fix_database():
    print("=== FIXING DATABASE SCHEMA ===")
    
    # Check if database exists
    db_path = SQLITE_PATH
    if not os.path.exists(db_path):
        print(f"❌ Database file not found at '{db_path}'. Please run: python database.py --init")
        return
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get existing columns
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]
    print(f"Current columns: {columns}")
    
    # List of missing columns to add
    missing_columns = []
    
    # Check for google_id
    if 'google_id' not in columns:
        missing_columns.append(('google_id', 'VARCHAR(255)'))
    
    # Check for updated_at
    if 'updated_at' not in columns:
        missing_columns.append(('updated_at', 'DATETIME'))
    
    # Check for created_at if it's missing
    if 'created_at' not in columns:
        missing_columns.append(('created_at', 'DATETIME'))
    
    # Add missing columns
    if missing_columns:
        print(f"\nAdding {len(missing_columns)} missing columns...")
        for col_name, col_type in missing_columns:
            try:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
                print(f"✅ Added column: {col_name}")
            except Exception as e:
                print(f"❌ Error adding {col_name}: {e}")
        conn.commit()
        print("\n✅ Database schema updated successfully!")
    else:
        print("\n✅ All columns are present. No changes needed.")
    
    # Show updated columns
    cursor.execute("PRAGMA table_info(users)")
    updated_columns = [col[1] for col in cursor.fetchall()]
    print(f"\nUpdated columns: {updated_columns}")
    
    conn.close()

if __name__ == '__main__':
    fix_database()