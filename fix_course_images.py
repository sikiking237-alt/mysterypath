import sqlite3

# Valid Unsplash image URLs that work
VALID_IMAGES = {
    "Web Development Bootcamp": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=350&fit=crop",
    "Python Data Science": "https://images.unsplash.com/photo-1526379879527-8559ecfcaec0?w=600&h=350&fit=crop",
    "UI/UX Design Masterclass": "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=350&fit=crop",
    "AWS Cloud Computing": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=350&fit=crop",
    "Digital Marketing": "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=600&h=350&fit=crop",
    "React Advanced Patterns": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=350&fit=crop",
    "JavaScript Mastery": "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=600&h=350&fit=crop",
    "Mobile App Development": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=350&fit=crop",
}

conn = sqlite3.connect('mysterypath.db')
cursor = conn.cursor()

# Update images for existing courses
for title, image_url in VALID_IMAGES.items():
    cursor.execute('''
        UPDATE courses 
        SET image_url = ? 
        WHERE title = ?
    ''', (image_url, title))
    print(f"✅ Updated image for: {title}")

# Check if any courses are missing images
cursor.execute('SELECT id, title, image_url FROM courses WHERE image_url IS NULL OR image_url = ""')
missing = cursor.fetchall()
if missing:
    print(f"\n⚠️ Found {len(missing)} courses without images:")
    for course in missing:
        print(f"   ID {course[0]}: {course[1]}")
        # Set a default image
        cursor.execute('''
            UPDATE courses 
            SET image_url = ? 
            WHERE id = ?
        ''', ("https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=350&fit=crop", course[0]))
        print(f"      → Set default image")

conn.commit()

# Show all courses with their images
print("\n📚 Courses with images:")
cursor.execute('SELECT id, title, image_url FROM courses')
for course in cursor.fetchall():
    img = course[2][:60] + "..." if course[2] and len(course[2]) > 60 else course[2]
    print(f"   ID {course[0]}: {course[1]}")
    print(f"      Image: {img}")

conn.close()
print("\n✅ Course images updated!")