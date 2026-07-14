# Use centralized DB helper for consistent DB path
from database import get_db, Course

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

db = get_db()

# Update images for existing courses
for title, image_url in VALID_IMAGES.items():
    course = db.query(Course).filter_by(title=title).first()
    if course:
        course.image_url = image_url
        print(f"✅ Updated image for: {title}")

# Check if any courses are missing images
missing_courses = db.query(Course).filter((Course.image_url == None) | (Course.image_url == "")).all()
if missing_courses:
    print(f"\n⚠️ Found {len(missing_courses)} courses without images:")
    for course in missing_courses:
        print(f"   ID {course.id}: {course.title}")
        # Set a default image
        course.image_url = "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=350&fit=crop"
        print(f"      → Set default image")

db.commit()

# Show all courses with their images
print("\n📚 Courses with images:")
all_courses = db.query(Course).all()
for course in all_courses:
    img = course.image_url[:60] + "..." if course.image_url and len(course.image_url) > 60 else course.image_url
    print(f"   ID {course.id}: {course.title}")
    print(f"      Image: {img}")

# The session is managed by scoped_session, so no need to close.
print("\n✅ Course images updated!")
