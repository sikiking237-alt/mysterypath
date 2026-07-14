import sqlite3

conn = sqlite3.connect('mysterypath.db')
cursor = conn.cursor()

# Check if image_url column exists
cursor.execute("PRAGMA table_info(courses)")
columns = [col[1] for col in cursor.fetchall()]

if 'image_url' not in columns:
    print("Adding image_url column...")
    cursor.execute("ALTER TABLE courses ADD COLUMN image_url TEXT")
    print("✅ Added image_url column")

# Check if any courses have NULL image_url
cursor.execute('SELECT COUNT(*) FROM courses WHERE image_url IS NULL OR image_url = ""')
null_count = cursor.fetchone()[0]
if null_count > 0:
    print(f"Found {null_count} courses with missing images. Setting default...")
    cursor.execute('''
        UPDATE courses 
        SET image_url = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=350&fit=crop'
        WHERE image_url IS NULL OR image_url = ""
    ''')
    print(f"✅ Updated {null_count} courses with default image")

conn.commit()
conn.close()
print("✅ Image column check complete!")