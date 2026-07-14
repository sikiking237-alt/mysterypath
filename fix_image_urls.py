import sqlite3

conn = sqlite3.connect('mysterypath.db')
cursor = conn.cursor()

# Updated working Unsplash image URLs
image_urls = {
    "Web Development Bootcamp": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=350&fit=crop",
    "Python Data Science": "https://images.unsplash.com/photo-1526379879527-8559ecfcaec0?w=600&h=350&fit=crop",
    "UI/UX Design Masterclass": "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=350&fit=crop",
    "React Advanced Patterns": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=350&fit=crop",
    "AWS Cloud Computing": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=350&fit=crop",
    "Digital Marketing": "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=600&h=350&fit=crop",
    "JavaScript Mastery": "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=600&h=350&fit=crop",
    "Mobile App Development": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=350&fit=crop",
}

print("📚 Updating course images...")
for title, url in image_urls.items():
    cursor.execute('''
        UPDATE courses 
        SET image_url = ? 
        WHERE title = ?
    ''', (url, title))
    if cursor.rowcount > 0:
        print(f"   ✅ Updated: {title}")
    else:
        print(f"   ⚠️ Course not found: {title}")

# Also set default image for any course without one
cursor.execute('''
    UPDATE courses 
    SET image_url = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=350&fit=crop'
    WHERE image_url IS NULL OR image_url = '' OR image_url LIKE 'data:%'
''')
print(f"\n✅ Updated {cursor.rowcount} courses with default image")

conn.commit()

# Show all courses with their images
print("\n📚 All courses:")
cursor.execute('SELECT id, title, image_url FROM courses')
for course in cursor.fetchall():
    # Access columns by index: 0=id, 1=title, 2=image_url
    img_url = course[2] if course[2] else ""
    img_display = img_url[:50] + "..." if len(img_url) > 50 else img_url
    print(f"   ID {course[0]}: {course[1]}")
    print(f"      Image: {img_display}")

conn.close()
print("\n✅ Done!")