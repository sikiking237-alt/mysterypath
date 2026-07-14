import sqlite3
import os

conn = sqlite3.connect('mysterypath.db')
cursor = conn.cursor()

# Default fallback images
default_images = [
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=350&fit=crop",
    "https://images.unsplash.com/photo-1526379879527-8559ecfcaec0?w=600&h=350&fit=crop",
    "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=350&fit=crop",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=350&fit=crop",
    "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=600&h=350&fit=crop",
]

# Get all courses
cursor.execute('SELECT id, title, image_url FROM courses')
courses = cursor.fetchall()

print("📚 Checking course images...")
for i, course in enumerate(courses):
    course_id, title, image_url = course
    
    # If no image or image is invalid, set a default
    if not image_url or image_url == '' or image_url == 'null' or image_url.startswith('data:'):
        default_img = default_images[i % len(default_images)]
        cursor.execute('UPDATE courses SET image_url = ? WHERE id = ?', (default_img, course_id))
        print(f"   ✅ Set default image for: {title}")
    else:
        print(f"   ✅ Has image: {title} -> {image_url[:50]}...")

conn.commit()
conn.close()
print("✅ Course images fixed!")