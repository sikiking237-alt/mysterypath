import sqlite3

conn = sqlite3.connect('mysterypath.db')
cursor = conn.cursor()

# Check what image URLs are stored
cursor.execute('SELECT id, title, image_url FROM courses')
courses = cursor.fetchall()

print("📚 Course Images:")
for course in courses:
    print(f"ID {course[0]}: {course[1]}")
    print(f"   Image URL: {course[2]}")
    
    # If URL starts with /uploads/, it should be served from the backend
    if course[2] and course[2].startswith('/uploads/'):
        print(f"   ✅ Local upload: http://127.0.0.1:5000{course[2]}")
    elif course[2] and course[2].startswith('http'):
        print(f"   ✅ External URL: {course[2]}")
    else:
        print(f"   ⚠️ Unknown format: {course[2]}")

conn.close()