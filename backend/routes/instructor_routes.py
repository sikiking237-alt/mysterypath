from flask import request, jsonify, Blueprint, current_app, g
from ..extensions import instructor_required, token_required
import logging
import secrets
from ..database import get_db_session, User, Course, Module, Lesson, Enrollment, Notification, LiveClass, LiveClassStudent, Question, QuestionOption
from sqlalchemy.orm import joinedload
from sqlalchemy import func, select, text
from sqlalchemy import func, select, text, case
import traceback
import json
from datetime import datetime, timezone
from pydantic import ValidationError
from ..schemas import CourseCreateSchema, CourseUpdateSchema
from ..utils import log_activity


instructor_bp = Blueprint('instructor', __name__)

@instructor_bp.route('/instructor/stats', methods=['GET'])
@instructor_required
def get_instructor_stats(current_user):
    try:
        db = get_db_session()

        # Get all courses for this instructor to use in subqueries
        instructor_courses_subquery = db.query(Course.id).filter(Course.instructor_id == current_user).subquery()

        # Perform calculations for enrollments in a single query
        enrollment_stats = db.query(
            func.count(func.distinct(Enrollment.user_id)).label("total_students"),
            func.coalesce(func.sum(Course.price), 0).label("total_revenue"),
            func.coalesce(func.avg(Enrollment.progress), 0).label("avg_completion_rate"),
            func.count(func.distinct(case((Enrollment.progress > 0, Enrollment.user_id), else_=None))).label("active_learners")
        ).join(Course, Enrollment.course_id == Course.id)\
         .filter(Course.id.in_(instructor_courses_subquery))\
         .one()

        # Perform calculations for courses in a separate query
        course_stats = db.query(
            func.count(Course.id).label("total_courses"),
            func.coalesce(func.avg(Course.rating), 0).label("average_rating")
        ).filter(Course.id.in_(instructor_courses_subquery)).one()

        # Combine results
        return jsonify({
            'total_courses': course_stats.total_courses,
            'total_students': enrollment_stats.total_students,
            'total_revenue': float(enrollment_stats.total_revenue),
            'average_rating': round(float(course_stats.average_rating), 1),
            'avg_completion_rate': round(float(enrollment_stats.avg_completion_rate), 1),
            'active_learners': enrollment_stats.active_learners
        })
    except Exception as e:
        logging.error(f"Instructor stats error: {str(e)}", exc_info=True)
        return jsonify({'error': 'An internal error occurred while fetching stats.', 'success': False}), 500

@instructor_bp.route('/instructor/chart-data', methods=['GET'])
@instructor_required
def get_instructor_chart_data(current_user):
    try:
        db = get_db_session()
        dialect = db.bind.dialect.name

        if dialect == 'postgresql':
            monthly_growth_query = text('''
                SELECT 
                    to_char(COALESCE(e.enrolled_date, CURRENT_TIMESTAMP), 'YYYY-MM') as month,
                    COUNT(*) as enrollments,
                    COALESCE(SUM(c.price), 0) as revenue
                FROM enrollments e
                JOIN courses c ON e.course_id = c.id
                WHERE c.instructor_id = :instructor_id
                GROUP BY 1
                ORDER BY month ASC
                LIMIT 12
            ''')
        else: # sqlite
            monthly_growth_query = text('''
                SELECT 
                    strftime('%Y-%m', COALESCE(e.enrolled_date, CURRENT_TIMESTAMP)) as month,
                    COUNT(*) as enrollments,
                    COALESCE(SUM(c.price), 0) as revenue
                FROM enrollments e
                JOIN courses c ON e.course_id = c.id
                WHERE c.instructor_id = :instructor_id
                GROUP BY 1
                ORDER BY month ASC
                LIMIT 12
            ''')
        monthly_growth_result = db.execute(monthly_growth_query, {'instructor_id': current_user})
        monthly_growth_list = [dict(row._mapping) for row in monthly_growth_result]

        course_performance = db.execute(text('''
            SELECT 
                c.title,
                COUNT(e.id) as enrollments,
                COALESCE(AVG(e.progress), 0) as completion_rate,
                COALESCE(SUM(c.price), 0) as revenue
            FROM courses c
            LEFT JOIN enrollments e ON e.course_id = c.id
            WHERE c.instructor_id = :instructor_id
            GROUP BY c.id, c.title
            ORDER BY enrollments DESC, c.title ASC
        '''), {'instructor_id': current_user})
        
        course_performance_list = [dict(row._mapping) for row in course_performance]
        
        return jsonify({
            'coursePerformance': course_performance_list,
            'monthlyGrowth': monthly_growth_list
        }), 200
    except Exception as e:
        logging.error(f"Instructor chart data error: {str(e)}", exc_info=True)
        return jsonify({'error': str(e), 'success': False}), 500

@instructor_bp.route('/instructor/courses', methods=['GET'])
@instructor_required
def get_instructor_courses(current_user):
    try:
        user = g.get('user')
        db = get_db_session()
        student_count_subquery = select(func.count(Enrollment.id)).where(Enrollment.course_id == Course.id).correlate_except(Enrollment).scalar_subquery()
        avg_completion_subquery = select(func.coalesce(func.avg(Enrollment.progress), 0)).where(Enrollment.course_id == Course.id).correlate_except(Enrollment).scalar_subquery()

        courses_with_stats = db.query(
            Course,
            student_count_subquery.label('student_count'),
            avg_completion_subquery.label('avg_completion')
        ).filter(
            Course.instructor_id == current_user
        ).options(
            joinedload(Course.instructor)
        ).order_by(Course.id.desc()).all()

        courses_list = []

        for course, student_count, avg_completion in courses_with_stats:
            course_dict = {c.name: getattr(course, c.name) for c in course.__table__.columns}
            course_dict['instructor_name'] = course.instructor.name if course.instructor else "N/A"
            course_dict['student_count'] = student_count
            course_dict['avg_completion'] = round(float(avg_completion), 1)
            
            # Handle JSON fields
            for field in ['what_you_will_learn', 'requirements', 'target_audience']:
                try:
                    course_dict[field] = json.loads(getattr(course, field)) if getattr(course, field) else []
                except (json.JSONDecodeError, TypeError):
                    course_dict[field] = []
            
            # Handle dates
            course_dict['created_at'] = course.created_at.isoformat() if course.created_at else None
            course_dict['updated_at'] = course.updated_at.isoformat() if course.updated_at else None

            courses_list.append(course_dict)
        
        return jsonify(courses_list), 200
    except Exception as e:
        logging.error(f"Error fetching instructor courses: {str(e)}", exc_info=True)
        return jsonify({'error': str(e), 'success': False}), 500

@instructor_bp.route('/instructor/courses', methods=['POST'])
@instructor_required
def create_course(current_user):
    try:
        course_data = CourseCreateSchema.model_validate(request.get_json(force=True))
    except ValidationError as e:
        return jsonify({'success': False, 'errors': e.errors()}), 400

    try:
        db = get_db_session()
        data_dict = course_data.model_dump()

        new_course = Course(
            instructor_id=current_user,
            title=data_dict['title'],
            subtitle=data_dict.get('subtitle'),
            description=data_dict['description'],
            level=data_dict['level'],
            category=data_dict['category'],
            image_url=data_dict.get('image_url'),
            price=data_dict.get('price'),
            duration=data_dict.get('duration'),
            what_you_will_learn=json.dumps(data_dict.get('what_you_will_learn', [])),
            requirements=json.dumps(data_dict.get('requirements', [])),
            target_audience=json.dumps(data_dict.get('target_audience', [])),
            xp_reward=data_dict.get('xp_reward', 100),
            is_published=data_dict.get('is_published', False),
            is_featured=data_dict.get('is_featured', False)
        )
        
        db.add(new_course)
        db.flush()

        # Handle creation of modules and lessons from a nested structure
        modules_data = data_dict.get('modules', [])

        # For backward compatibility, convert flat 'content_items' to a single module
        if not modules_data and data_dict.get('content_items'):
            modules_data = [{
                "title": "Section 1",
                "lessons": data_dict.get('content_items')
            }]

        for mod_index, mod_data in enumerate(modules_data):
            module = Module(
                course_id=new_course.id,
                title=mod_data.get('title', f'Section {mod_index + 1}'),
                order_index=mod_data.get('order_index', mod_index)
            )
            db.add(module)
            db.flush()

            for lesson_index, lesson_data in enumerate(mod_data.get('lessons', [])):
                lesson = Lesson(
                    module_id=module.id,
                    title=lesson_data.get('title'),
                    type=lesson_data.get('type'),
                    order_index=lesson_data.get('order_index', lesson_index),
                    duration=lesson_data.get('duration'),
                    content=lesson_data.get('content'),
                    video_url=lesson_data.get('video_url'),
                    slides_url=lesson_data.get('slides_url'),
                    files=lesson_data.get('files', [])
                )
                db.add(lesson)
                db.flush()

                quiz_data = lesson_data.get('quiz_data') or lesson_data.get('quizData')
                if quiz_data and quiz_data.get('questions'):
                    for q_index, q_data in enumerate(quiz_data.get('questions', [])):
                        question = Question(
                            lesson_id=lesson.id,
                            question_text=q_data.get('question', q_data.get('question_text', '')),
                            question_type=q_data.get('type', 'multiple_choice'),
                            order_index=q_index
                        )
                        db.add(question)
                        db.flush()

                        options = q_data.get('options', [])
                        correct_answer = q_data.get('correctAnswer', 0)
                        for o_index, option_text in enumerate(options):
                            question_option = QuestionOption(
                                question_id=question.id,
                                option_text=option_text,
                                is_correct=(o_index == correct_answer),
                                order_index=o_index
                            )
                            db.add(question_option)
        
        db.commit()

        return jsonify({
            'success': True,
            'message': 'Course created successfully',
            'course_id': new_course.id
        }), 201
    except Exception as e:
        db.rollback()
        logging.error(f"Error creating course: {str(e)}", exc_info=True)
        return jsonify({'error': str(e), 'success': False}), 500

@instructor_bp.route('/instructor/courses/<int:course_id>', methods=['PUT', 'DELETE'])
@instructor_required
def manage_course_by_id(current_user, course_id):
    db = get_db_session()
    try:
        course, error = _check_course_permission(current_user, course_id)
        if error:
            return jsonify({'error': error[0], 'success': False}), error[1]

        if request.method == 'DELETE':
            db.delete(course)
            db.commit()
            log_activity(current_user, f"Deleted course '{course.title}'", status='success', log_type='course')
            return jsonify({'success': True, 'message': f'Course "{course.title}" deleted successfully'}), 200

        if request.method == 'PUT':
            try:
                update_data_model = CourseUpdateSchema.model_validate(request.get_json(force=True))
            except ValidationError as e:
                return jsonify({'success': False, 'errors': e.errors()}), 400

            update_fields = update_data_model.model_dump(exclude_unset=True)
            
            for key, value in update_fields.items():
                if key == 'modules':
                    continue
                if hasattr(course, key):
                    if key in ['what_you_will_learn', 'requirements', 'target_audience'] and isinstance(value, list):
                        setattr(course, key, json.dumps(value))
                    else:
                        setattr(course, key, value)
            
            modules_data = update_fields.get('modules', [])
            if modules_data:
                existing_modules = db.query(Module).filter_by(course_id=course_id).all()
                for module in existing_modules:
                    db.delete(module)
                db.flush()

                for mod_index, mod_data in enumerate(modules_data):
                    module = Module(
                        course_id=course_id,
                        title=mod_data.get('title', f'Section {mod_index + 1}'),
                        order_index=mod_data.get('order_index', mod_index)
                    )
                    db.add(module)
                    db.flush()

                    for lesson_index, lesson_data in enumerate(mod_data.get('lessons', [])):
                        lesson = Lesson(
                            module_id=module.id,
                            title=lesson_data.get('title'),
                            type=lesson_data.get('type'),
                            order_index=lesson_data.get('order_index', lesson_index),
                            duration=lesson_data.get('duration'),
                            content=lesson_data.get('content'),
                            video_url=lesson_data.get('video_url'),
                            slides_url=lesson_data.get('slides_url'),
                            files=lesson_data.get('files', [])
                        )
                        db.add(lesson)
                        db.flush()

                        quiz_data = lesson_data.get('quiz_data') or lesson_data.get('quizData')
                        if quiz_data and quiz_data.get('questions'):
                            for q_index, q_data in enumerate(quiz_data.get('questions', [])):
                                question = Question(
                                    lesson_id=lesson.id,
                                    question_text=q_data.get('question', q_data.get('question_text', '')),
                                    question_type=q_data.get('type', 'multiple_choice'),
                                    order_index=q_index
                                )
                                db.add(question)
                                db.flush()

                                options = q_data.get('options', [])
                                correct_answer = q_data.get('correctAnswer', 0)
                                for o_index, option_text in enumerate(options):
                                    question_option = QuestionOption(
                                        question_id=question.id,
                                        option_text=option_text,
                                        is_correct=(o_index == correct_answer),
                                        order_index=o_index
                                    )
                                    db.add(question_option)
            
            db.commit()
            log_activity(current_user, f"Updated course '{course.title}'", status='success', log_type='course')
            return jsonify({'success': True, 'message': 'Course updated successfully'}), 200
            
    except Exception as e:
        db.rollback()
        logging.error(f"Error in manage_course_by_id: {str(e)}", exc_info=True)
        return jsonify({'error': str(e), 'success': False}), 500

def _check_course_permission(user_id, course_id):
    """Check if a user has permission to modify a course."""
    db = get_db_session()
    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        return None, ('User not found.', 404)

    course = db.query(Course).filter_by(id=course_id).first()
    if not course:
        return None, ('Course not found.', 404)

    if user.role == 'admin' or course.instructor_id == user_id:
        return course, None
        
    return None, ('Permission denied.', 403)

def _check_lesson_permission(user_id, lesson_id):
    """Check if a user has permission to modify a lesson."""
    db = get_db_session()
    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        return None, ('User not found', 404)

    lesson = db.query(Lesson).options(
        joinedload(Lesson.module).joinedload(Module.course)
    ).filter(Lesson.id == lesson_id).first()

    if not lesson:
        return None, ('Lesson not found', 404)

    if user.role == 'admin':
        return lesson, None
    
    if user.role == 'instructor' and lesson.module.course.instructor_id == user_id:
        return lesson, None
        
    return None, ('Permission denied', 403)

def _check_module_permission(user_id, module_id):
    """Check if a user has permission to add a lesson to a module."""
    db = get_db_session()
    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        return None, ('User not found', 404)

    module = db.query(Module).options(
        joinedload(Module.course)
    ).filter(Module.id == module_id).first()

    if not module:
        return None, ('Module not found', 404)

    if user.role == 'admin':
        return module, None
    
    if user.role == 'instructor' and module.course.instructor_id == user_id:
        return module, None
        
    return None, ('Permission denied', 403)

@instructor_bp.route('/instructor/students', methods=['GET'])
@instructor_required
def get_instructor_students(current_user):
    try:
        db = get_db_session()
        enrollments = db.query(Enrollment)\
            .join(Course, Enrollment.course_id == Course.id)\
            .filter(Course.instructor_id == current_user)\
            .join(User, Enrollment.user_id == User.id)\
            .filter(User.role == 'user')\
            .options(joinedload(Enrollment.user), joinedload(Enrollment.course))\
            .order_by(Enrollment.enrolled_date.desc())\
            .all()

        students = []
        for enrollment in enrollments:
            students.append({
                'id': enrollment.user.id,
                'name': enrollment.user.name,
                'email': enrollment.user.email,
                'enrolled_date': enrollment.enrolled_date.isoformat() if enrollment.enrolled_date else None,
                'progress': enrollment.progress,
                'course_title': enrollment.course.title
            })
        return jsonify(students), 200

    except Exception as e:
        logging.error(f"Error fetching instructor students: {str(e)}", exc_info=True)
        return jsonify({'error': str(e), 'success': False}), 500

@instructor_bp.route('/instructor/messages/bulk', methods=['POST'])
@instructor_required
def send_bulk_announcement(current_user):
    try:
        data = request.json or {}
        student_ids = data.get('student_ids', [])
        content = data.get('content', '').strip()

        if not student_ids or not content:
            return jsonify({'error': 'Student IDs and content are required', 'success': False}), 400

        db = get_db_session()
        user = db.query(User).filter_by(id=current_user).first()
        instructor_name = user.name
        title = f"Announcement from {instructor_name}"

        notifications_sent = 0
        for student_id in student_ids:
            student = db.query(User).filter_by(id=student_id, role='user').first()
            if student:
                notification = Notification(
                    user_id=student_id,
                    title=title,
                    message=content,
                    type='info'
                )
                db.add(notification)
                db.flush()
                
                payload = {
                    'id': notification.id,
                    'title': title,
                    'message': content,
                    'type': 'info',
                    'is_read': 0,
                    'created_at': datetime.now(timezone.utc).isoformat()
                }
                # Use current_app to access extensions like socketio
                current_app.socketio.emit('new_notification', payload, room=f'user_{student_id}')
                notifications_sent += 1
        
        db.commit()

        if notifications_sent > 0:
            log_activity(current_user, "Sent bulk announcement", details=f"Sent to {notifications_sent} student(s).", status='success', log_type='communication')

        return jsonify({'success': True, 'message': f'Announcement sent to {notifications_sent} students.', 'count': notifications_sent}), 200

    except Exception as e:
        logging.error(f"Error sending bulk announcement: {str(e)}")
        if 'db' in locals():
            db.rollback()
        return jsonify({'error': str(e), 'success': False}), 500

@instructor_bp.route('/instructor/live-classes', methods=['GET'])
@instructor_required
def get_instructor_live_classes(current_user):
    try:
        db = get_db_session()
        live_classes = db.query(LiveClass)\
            .filter(LiveClass.creator_id == current_user, LiveClass.creator_type == 'instructor')\
            .order_by(LiveClass.created_at.desc())\
            .all()

        result = []
        for lc in live_classes:
            student_count = db.query(LiveClassStudent).filter_by(live_class_id=lc.id).count()
            result.append({
                'id': lc.id,
                'title': lc.title,
                'meeting_link': lc.meeting_link,
                'whatsapp_link': lc.whatsapp_link,
                'social_link': lc.social_link,
                'description': lc.description,
                'expires_after_class': lc.expires_after_class,
                'created_at': lc.created_at.isoformat() if lc.created_at else None,
                'student_count': student_count
            })

        return jsonify({'success': True, 'live_classes': result}), 200
    except Exception as e:
        logging.error(f"Error fetching instructor live classes: {str(e)}", exc_info=True)
        return jsonify({'error': str(e), 'success': False}), 500

@instructor_bp.route('/instructor/live-classes', methods=['POST'])
@instructor_required
def create_live_class(current_user):
    try:
        data = request.json or {}
        student_ids = data.get('student_ids', [])
        title = data.get('title', '').strip()
        meeting_link = data.get('meetingLink', '').strip()
        whatsapp_link = data.get('whatsappLink', '').strip()
        social_link = data.get('socialLink', '').strip()
        description = data.get('description', '').strip()
        expires_after_class = data.get('expiresAfterClass', False)

        if not student_ids or not title or not meeting_link:
            return jsonify({'error': 'Student IDs, title, and meeting link are required', 'success': False}), 400

        db = get_db_session()
        user = db.query(User).filter_by(id=current_user).first()
        instructor_name = user.name

        new_live_class = LiveClass(
            creator_id=current_user,
            creator_type='instructor',
            title=title,
            meeting_link=meeting_link,
            whatsapp_link=whatsapp_link,
            social_link=social_link,
            description=description,
            expires_after_class=expires_after_class
        )
        db.add(new_live_class)
        db.flush()

        live_class_id = new_live_class.id
        
        notification_title = f"Live Class Invitation: {title}"
        notification_message = f"You're invited to a live class by {instructor_name}. Meeting Link: {meeting_link}"
        if description:
            notification_message += f"\n\nDescription: {description}"

        notifications_sent = 0
        for student_id in student_ids:
            student = db.query(User).filter_by(id=student_id, role='user').first()
            if student:
                existing = db.query(LiveClassStudent).filter_by(live_class_id=live_class_id, student_id=student_id).first()
                if not existing:
                    lcs = LiveClassStudent(live_class_id=live_class_id, student_id=student_id)
                    db.add(lcs)
                
                notification = Notification(
                    user_id=student_id,
                    title=notification_title,
                    message=notification_message,
                    type='info'
                )
                db.add(notification)
                db.flush()
                
                payload = {
                    'id': notification.id,
                    'title': notification_title,
                    'message': notification_message,
                    'type': 'info',
                    'is_read': 0,
                    'created_at': datetime.now(timezone.utc).isoformat()
                }
                current_app.socketio.emit('new_notification', payload, room=f'user_{student_id}')
                notifications_sent += 1
        
        db.commit()
        log_activity(current_user, "Organized a live class", details=f"Class: '{title}', sent to {notifications_sent} student(s).", status='success', log_type='communication')
        return jsonify({
            'success': True,
            'message': f'Live class created and {notifications_sent} students notified.',
            'count': notifications_sent,
            'live_class': {
                'id': new_live_class.id,
                'title': new_live_class.title,
                'meeting_link': new_live_class.meeting_link,
                'whatsapp_link': new_live_class.whatsapp_link,
                'social_link': new_live_class.social_link,
                'description': new_live_class.description,
                'expires_after_class': new_live_class.expires_after_class,
                'created_at': new_live_class.created_at.isoformat() if new_live_class.created_at else None,
                'student_count': notifications_sent,
            }
        }), 201
    except Exception as e:
        logging.error(f"Error creating live class: {str(e)}")
        if 'db' in locals():
            db.rollback()
        return jsonify({'error': str(e), 'success': False}), 500

@instructor_bp.route('/instructor/schedule-class', methods=['POST'])
@instructor_required
def schedule_live_class(current_user):
    try:
        data = request.json or {}
        course_id = data.get('course_id')
        class_time = data.get('class_time') or data.get('time')
        title = data.get('title', '').strip()
        description = data.get('description', '').strip()

        if not course_id or not class_time:
            return jsonify({'error': 'Course ID and class time are required', 'success': False}), 400

        db = get_db_session()
        course, error = _check_course_permission(current_user, course_id)
        if error:
            return jsonify({'error': error[0], 'success': False}), error[1]

        if not title:
            title = f"Live Class: {course.title}"

        try:
            scheduled_time = datetime.fromisoformat(class_time.replace('Z', '+00:00'))
        except (ValueError, TypeError, AttributeError):
            return jsonify({'error': 'Invalid class time format', 'success': False}), 400

        meeting_link = f"https://meet.example.com/{secrets.token_urlsafe(12)}"

        new_live_class = LiveClass(
            creator_id=current_user,
            creator_type='instructor',
            title=title,
            meeting_link=meeting_link,
            description=description or f"Scheduled live class for {course.title}",
            expires_after_class=False
        )
        db.add(new_live_class)
        db.flush()

        enrollments = db.query(Enrollment).filter_by(course_id=course_id).all()
        notification_title = f"Scheduled Live Class: {title}"
        notification_message = f"You have a scheduled live class: {title}\n\nMeeting Link: {meeting_link}"
        if description:
            notification_message += f"\n\nDescription: {description}"

        notifications_sent = 0
        for enrollment in enrollments:
            student_id = enrollment.user_id
            student = db.query(User).filter_by(id=student_id, role='user').first()
            if student:
                existing = db.query(LiveClassStudent).filter_by(live_class_id=new_live_class.id, student_id=student_id).first()
                if not existing:
                    lcs = LiveClassStudent(live_class_id=new_live_class.id, student_id=student_id)
                    db.add(lcs)

                notification = Notification(
                    user_id=student_id,
                    title=notification_title,
                    message=notification_message,
                    type='info'
                )
                db.add(notification)
                db.flush()

                payload = {
                    'id': notification.id,
                    'title': notification_title,
                    'message': notification_message,
                    'type': 'info',
                    'is_read': 0,
                    'created_at': datetime.now(timezone.utc).isoformat()
                }
                current_app.socketio.emit('new_notification', payload, room=f'user_{student_id}')
                notifications_sent += 1

        db.commit()
        log_activity(current_user, f"Scheduled live class '{title}'", details=f"Course ID: {course_id}, Time: {class_time}, Students notified: {notifications_sent}", status='success', log_type='communication')

        return jsonify({
            'success': True,
            'message': f'Live class scheduled successfully. {notifications_sent} students notified.',
            'live_class': {
                'id': new_live_class.id,
                'title': new_live_class.title,
                'meeting_link': new_live_class.meeting_link,
                'description': new_live_class.description,
                'created_at': new_live_class.created_at.isoformat() if new_live_class.created_at else None,
                'student_count': notifications_sent,
            }
        }), 201
    except Exception as e:
        if 'db' in locals():
            db.rollback()
        logging.error(f"Error scheduling live class: {str(e)}", exc_info=True)
        return jsonify({'error': str(e), 'success': False}), 500

@instructor_bp.route('/instructor/courses/<int:course_id>/structure', methods=['GET'])
@token_required
def get_course_structure(current_user, course_id):
    try:
        db = get_db_session()
        course, error = _check_course_permission(current_user, course_id)
        if error:
            return jsonify({'error': error[0], 'success': False}), error[1]

        course = db.query(Course).options(
            joinedload(Course.modules).joinedload(Module.lessons)
        ).filter(Course.id == course_id).first()

        sections = []
        for module in course.modules:
            sections.append({
                'id': module.id,
                'course_id': module.course_id,
                'title': module.title,
                'order_index': module.order_index,
                'created_at': module.created_at.isoformat() if module.created_at else None,
                'lessons': [{
                    'id': lesson.id,
                    'module_id': lesson.module_id,
                    'title': lesson.title,
                    'type': lesson.type,
                    'content': lesson.content,
                    'duration': lesson.duration,
                    'video_url': lesson.video_url,
                    'slides_url': lesson.slides_url,
                    'is_required_to_pass': lesson.is_required_to_pass,
                    'passing_score': lesson.passing_score,
                    'order_index': lesson.order_index,
                    'created_at': lesson.created_at.isoformat() if lesson.created_at else None,
                } for lesson in module.lessons]
            })

        structure = {
            "course_id": course.id,
            "title": course.title,
            "sections": sections
        }
        return jsonify(structure), 200
    except Exception as e:
        logging.error(f"Error fetching structure for course {course_id}: {str(e)}", exc_info=True)
        return jsonify({'error': str(e), 'success': False}), 500

@instructor_bp.route('/instructor/modules/<int:module_id>/lessons', methods=['POST'])
@token_required
def create_lesson_in_module(current_user, module_id):
    """Creates a new lesson within a specific module."""
    module, error = _check_module_permission(current_user, module_id)
    if error:
        return jsonify({'error': error[0], 'success': False}), error[1]

    data = request.json or {}
    title = data.get('title')
    lesson_type = data.get('type', 'text')

    if not title:
        return jsonify({'error': 'Lesson title is required', 'success': False}), 400

    try:
        db = get_db_session()

        max_order = db.query(func.max(Lesson.order_index)).filter(Lesson.module_id == module_id).scalar()
        order_index = (max_order or -1) + 1

        new_lesson = Lesson(
            module_id=module_id,
            title=title,
            type=lesson_type,
            order_index=order_index,
            content=data.get('content', ''),
            video_url=data.get('video_url', ''),
            duration=data.get('duration', ''),
            slides_url=data.get('slides_url', ''),
            files=data.get('files', []),
            is_required_to_pass=data.get('is_required_to_pass', False),
            passing_score=data.get('passing_score', 70)
        )
        
        db.add(new_lesson)
        db.commit()

        lesson_dict = {
            'id': new_lesson.id,
            'module_id': new_lesson.module_id,
            'title': new_lesson.title,
            'type': new_lesson.type,
            'content': new_lesson.content,
            'duration': new_lesson.duration,
            'video_url': new_lesson.video_url,
            'slides_url': new_lesson.slides_url,
            'files': new_lesson.files or [],
            'is_required_to_pass': new_lesson.is_required_to_pass,
            'passing_score': new_lesson.passing_score,
            'order_index': new_lesson.order_index,
            'created_at': new_lesson.created_at.isoformat() if new_lesson.created_at else None,
        }

        log_activity(current_user, f"Created lesson '{title}'", details=f"Lesson ID: {new_lesson.id}", status='success', log_type='course')

        return jsonify({'success': True, 'lesson': lesson_dict}), 201
    except Exception as e:
        db.rollback()
        logging.error(f"Error creating lesson: {str(e)}", exc_info=True)
        return jsonify({'error': str(e), 'success': False}), 500

@instructor_bp.route('/instructor/lessons/<int:lesson_id>', methods=['GET', 'PUT', 'DELETE'])
@token_required
def manage_lesson(current_user, lesson_id):
    """Manages a single lesson (GET, PUT, DELETE)."""
    lesson, error = _check_lesson_permission(current_user, lesson_id)
    if error:
        return jsonify({'error': error[0], 'success': False}), error[1]

    if not lesson:
        return jsonify({'error': 'Lesson not found', 'success': False}), 404

    if request.method == 'GET':
        lesson_dict = {
            'id': lesson.id, 'module_id': lesson.module_id, 'title': lesson.title,
            'type': lesson.type, 'content': lesson.content, 'duration': lesson.duration,
            'video_url': lesson.video_url, 'slides_url': lesson.slides_url,
            'files': lesson.files or [],
            'is_required_to_pass': lesson.is_required_to_pass,
            'passing_score': lesson.passing_score, 'order_index': lesson.order_index,
            'created_at': lesson.created_at.isoformat() if lesson.created_at else None,
        }
        return jsonify(lesson_dict), 200

    if request.method == 'DELETE':
        db = get_db_session()
        lesson_title = lesson.title
        db.delete(lesson)
        db.commit()
        log_activity(current_user, f"Deleted lesson '{lesson_title}'", details=f"Lesson ID: {lesson_id}", status='success', log_type='course')
        return jsonify({'success': True, 'message': 'Lesson deleted successfully'}), 200

    if request.method == 'PUT':
        db = get_db_session()
        data = request.json or {}
        
        fields = ['title', 'type', 'content', 'duration', 'video_url', 'order_index', 'slides_url', 'files', 'is_required_to_pass', 'passing_score']
        
        updated = False
        for field in fields:
            if field in data:
                setattr(lesson, field, data[field])
                updated = True
        
        if not updated:
            return jsonify({'error': 'No update data provided', 'success': False}), 400

        try:
            db.commit()
            
            updated_lesson_dict = {
                'id': lesson.id, 'module_id': lesson.module_id, 'title': lesson.title,
                'type': lesson.type, 'content': lesson.content, 'duration': lesson.duration,
                'video_url': lesson.video_url, 'slides_url': lesson.slides_url,
                'files': lesson.files or [],
                'is_required_to_pass': lesson.is_required_to_pass,
                'passing_score': lesson.passing_score, 'order_index': lesson.order_index,
                'created_at': lesson.created_at.isoformat() if lesson.created_at else None,
            }

            log_activity(current_user, f"Updated lesson '{updated_lesson_dict['title']}'", details=f"Lesson ID: {lesson_id}", status='success', log_type='course')

            return jsonify({'success': True, 'lesson': updated_lesson_dict}), 200
        except Exception as e:
            db.rollback()
            logging.error(f"Error updating lesson {lesson_id}: {str(e)}", exc_info=True)
            return jsonify({'error': str(e), 'success': False}), 500

@instructor_bp.route('/instructor/lessons/<int:lesson_id>/quiz', methods=['GET', 'POST'])
@instructor_required
def manage_lesson_quiz(current_user, lesson_id):
    has_perm, error = _check_lesson_permission(current_user, lesson_id)
    if error:
        return jsonify({'error': error[0], 'success': False}), error[1]

    db = get_db_session()

    if request.method == 'GET':
        try:
            questions = db.query(Question).filter_by(lesson_id=lesson_id).order_by(Question.order_index.asc()).all()
            
            result = []
            for q in questions:
                options = db.query(QuestionOption).filter_by(question_id=q.id).order_by(QuestionOption.order_index.asc()).all()
                result.append({
                    'id': q.id,
                    'question_text': q.question_text,
                    'question_type': q.question_type,
                    'points': q.points,
                    'order_index': q.order_index,
                    'options': [{
                        'id': o.id,
                        'option_text': o.option_text,
                        'is_correct': o.is_correct,
                        'order_index': o.order_index
                    } for o in options]
                })

            return jsonify({'success': True, 'questions': result}), 200
        except Exception as e:
            logging.error(f"Error fetching quiz for lesson {lesson_id}: {str(e)}")
            return jsonify({'error': str(e), 'success': False}), 500

    if request.method == 'POST':
        data = request.json or {}
        questions_data = data.get('questions', [])

        try:
            # A more efficient way would be to update/delete/add based on IDs, but for simplicity, we'll delete and recreate.
            db.query(QuestionOption).join(Question).filter(Question.lesson_id == lesson_id).delete()
            db.query(Question).filter_by(lesson_id=lesson_id).delete()

            for q_index, q_data in enumerate(questions_data):
                question = Question(
                    lesson_id=lesson_id,
                    question_text=q_data.get('question_text', ''),
                    question_type='multiple_choice',
                    points=q_data.get('points', 1),
                    order_index=q_index
                )
                db.add(question)
                db.flush()
                
                for o_index, o_data in enumerate(q_data.get('options', [])):
                    option = QuestionOption(question_id=question.id, option_text=o_data.get('option_text', ''), is_correct=o_data.get('is_correct', False), order_index=o_index)
                    db.add(option)

            db.commit()
            return jsonify({'success': True, 'message': 'Quiz updated successfully'}), 200
        except Exception as e:
            db.rollback()
            logging.error(f"Error saving quiz for lesson {lesson_id}: {str(e)}")
            return jsonify({'error': str(e), 'success': False}), 500
