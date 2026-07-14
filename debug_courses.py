import sqlite3
import os

DB_PATH = 'mysterypath.db'

if not os.path.exists(DB_PATH):
    print(f"❌ Database file {DB_PATH} not found!")
    exit(1)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Check all courses
cursor.execute('SELECT id, title, instructor_id FROM courses')
courses = cursor.fetchall()

print("📚 Current courses in database:")
if courses:
    for course in courses:
        print(f"   ID {course[0]}: {course[1]} (Instructor ID: {course[2]})")
    
    # Check if course 8 exists
    cursor.execute('SELECT id, title FROM courses WHERE id = 8')
    course_8 = cursor.fetchone()
    if course_8:
        print(f"\n✅ Course 8 exists: {course_8[1]}")
    else:
        print("\n❌ Course 8 does NOT exist")
else:
    print("❌ No courses found!")

# Check instructors
cursor.execute('SELECT id, name, email FROM users WHERE role = "instructor"')
instructors = cursor.fetchall()
print("\n👨‍🏫 Instructors:")
for inst in instructors:
    print(f"   ID {inst[0]}: {inst[1]} ({inst[2]})")

conn.close()