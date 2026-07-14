import sqlite3

conn = sqlite3.connect('mysterypath.db')
cursor = conn.cursor()

cursor.execute('SELECT id, title, image_url FROM courses WHERE image_url LIKE "/uploads/%"')
courses = cursor.fetchall()

print("📸 Uploaded images:")
for course in courses:
    print(f"ID {course[0]}: {course[1]}")
    print(f"   Image URL: {course[2]}")
    print(f"   Full URL: http://127.0.0.1:5000{course[2]}")

conn.close()