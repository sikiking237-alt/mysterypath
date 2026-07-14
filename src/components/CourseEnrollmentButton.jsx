import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useEnrollInCourseMutation } from '../../coursesApi';

const CourseEnrollmentButton = ({ courseId, isEnrolled, onEnrollSuccess }) => {
  const navigate = useNavigate();
  const [enrollInCourse, { isLoading, isSuccess, isError, error }] = useEnrollInCourseMutation();

  const handleEnroll = async () => {
    try {
      const result = await enrollInCourse(courseId).unwrap();
      toast.success(result.message || 'Enrollment successful! Happy learning. 🚀');
      if (onEnrollSuccess) {
        onEnrollSuccess(courseId);
      }
      setTimeout(() => navigate(`/course-player/${courseId}`), 1000);
    } catch (err) {
      const errorMessage = err.data?.message || err.data?.error || 'Failed to enroll in course. Please try again.';
      
      if (err.status === 409 || (err.status === 400 && String(errorMessage).toLowerCase().includes('already enrolled'))) {
        toast.success('Already enrolled! Taking you to the course...');
        if (onEnrollSuccess) {
          onEnrollSuccess(courseId);
        }
        return setTimeout(() => navigate(`/course-player/${courseId}`), 1000);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  if (isEnrolled) {
    return (
      <button 
        className="w-full mt-3 py-2 bg-emerald-600 text-white dark:text-gray-100 dark:text-gray-100 rounded-lg text-sm font-medium" 
        onClick={() => navigate(`/course-player/${courseId}`)}
      >
        Go to Course
      </button>
    );
  }

  return (
    <button 
      className="w-full mt-3 py-2 bg-purple-600 text-white dark:text-gray-100 dark:text-gray-100 rounded-lg text-sm font-medium hover:bg-purple-700 transition disabled:opacity-75" 
      onClick={handleEnroll} 
      disabled={isLoading}
    >
      {isLoading ? 'Enrolling...' : 'Enroll Now (+20 XP)'}
    </button>
  );
};

export default CourseEnrollmentButton;

