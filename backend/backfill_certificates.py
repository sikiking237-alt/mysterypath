import uuid
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Float, UniqueConstraint, JSON
from sqlalchemy.orm import relationship

# Import existing database setup
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from .config import Config
from database import Base, Certificate, User, Course, Enrollment, engine

def backfill_certificates():
    """Generate certificates for all completed courses that don't have one."""
    session = sessionmaker(bind=engine)()
    
    try:
        # Find all completed enrollments that don't have certificates
        completed_enrollments = session.query(Enrollment).filter(
            Enrollment.progress >= 100
        ).all()
        
        created_count = 0
        skipped_count = 0
        
        for enrollment in completed_enrollments:
            # Check if certificate already exists
            existing_cert = session.query(Certificate).filter_by(
                user_id=enrollment.user_id,
                course_id=enrollment.course_id
            ).first()
            
            if existing_cert:
                skipped_count += 1
                print(f"Skipping: User {enrollment.user_id}, Course {enrollment.course_id} (certificate already exists)")
                continue
            
            # Get user and course info
            user = session.query(User).filter_by(id=enrollment.user_id).first()
            course = session.query(Course).filter_by(id=enrollment.course_id).first()
            
            if not user or not course:
                print(f"Skipping: User {enrollment.user_id} or Course {enrollment.course_id} not found")
                skipped_count += 1
                continue
            
            # Create certificate
            certificate_id = f"MP-{uuid.uuid4().hex[:10].upper()}"
            completion_date = enrollment.completed_at or datetime.now(timezone.utc)
            
            new_certificate = Certificate(
                user_id=enrollment.user_id,
                course_id=enrollment.course_id,
                certificate_id=certificate_id,
                user_name=user.name,
                course_title=course.title,
                completion_date=completion_date,
                issued_date=datetime.now(timezone.utc)
            )
            
            session.add(new_certificate)
            created_count += 1
            print(f"Created certificate: {certificate_id} for {user.name} - {course.title}")
        
        session.commit()
        
        print(f"\nBackfill complete!")
        print(f"  Created: {created_count} certificates")
        print(f"  Skipped: {skipped_count} (already existed or invalid)")
        
    except Exception as e:
        session.rollback()
        print(f"Error during backfill: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    print("Starting certificate backfill...")
    print("This will create certificates for all completed courses that don't have one.\n")
    
    response = input("Do you want to continue? (yes/no): ")
    if response.lower() in ['yes', 'y']:
        backfill_certificates()
    else:
        print("Backfill cancelled.")
