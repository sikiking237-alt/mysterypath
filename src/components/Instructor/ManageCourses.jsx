// src/components/Instructor/ManageCourses.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus, Trash2, X, RefreshCw, Edit2, Star, Clock, Layers,
  Search, Grid3x3, List, Sparkles, BookOpen, Users,
  CheckCircle, AlertCircle, Loader2, FileText,
  ChevronRight, ChevronLeft, Check, Image, Rocket,
  DollarSign, Globe, Zap
} from 'lucide-react';
import BlockBasedCourseCreator from './BlockBasedCourseCreator';
import StepMedia from './StepMedia';
import {
  useGetInstructorCoursesQuery,
  useCreateInstructorCourseMutation,
  useUpdateInstructorCourseMutation,
  useDeleteInstructorCourseMutation,
} from '../../features/courses/coursesApi';

const ManageCourses = ({ darkMode }) => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  const [course, setCourse] = useState({
    title: '',
    subtitle: '',
    description: '',
    level: 'Beginner',
    category: 'Development',
    price: 0,
    image_url: '',
    xpReward: 100,
    duration: '',
    whatYouWillLearn: [],
    requirements: [],
    contentItems: [],
    isPublished: false,
    isFeatured: false
  });

  const { data: courses = [], isLoading, refetch } = useGetInstructorCoursesQuery();
  const [createCourse] = useCreateInstructorCourseMutation();
  const [updateCourse] = useUpdateInstructorCourseMutation();
  const [deleteCourse] = useDeleteInstructorCourseMutation();

  const isEditing = !!courseId;
  const editingCourseData = courses.find(c => c.id === parseInt(courseId));
  const hasLoadedCourse = useRef(false);

  const showNotification = (message, type) => {
    setNotification({ message, type: type || 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (courseId && !editingCourseData && !isLoading) {
      showNotification('Course not found', 'error');
      navigate('/instructor-courses');
    }
  }, [courseId, editingCourseData, isLoading, navigate, showNotification]);

  useEffect(() => {
    if (editingCourseData && !hasLoadedCourse.current) {
      hasLoadedCourse.current = true;
      setEditingCourse(editingCourseData);
      setCourse({
        title: editingCourseData.title || '',
        subtitle: editingCourseData.subtitle || '',
        description: editingCourseData.description || '',
        level: editingCourseData.level || 'Beginner',
        category: editingCourseData.category || 'Development',
        price: editingCourseData.price || 0,
        image_url: editingCourseData.image_url || '',
        xpReward: editingCourseData.xp_reward || 100,
        duration: editingCourseData.duration || '',
        whatYouWillLearn: Array.isArray(editingCourseData.what_you_will_learn) ? editingCourseData.what_you_will_learn : [],
        requirements: Array.isArray(editingCourseData.requirements) ? editingCourseData.requirements : [],
        contentItems: Array.isArray(editingCourseData.contentItems) ? editingCourseData.contentItems : [],
        isPublished: editingCourseData.is_published || false,
        isFeatured: editingCourseData.is_featured || false
      });
      setShowCreateModal(true);
    }
    if (!courseId) {
      hasLoadedCourse.current = false;
    }
  }, [editingCourseData, courseId]);

  const steps = [
    { id: 1, title: 'Basic Info', icon: BookOpen },
    { id: 2, title: 'Content', icon: Layers },
    { id: 3, title: 'Media', icon: Image },
    { id: 4, title: 'Pricing and Publish', icon: Rocket }
  ];

  const resetForm = () => {
    setCourse({
      title: '',
      subtitle: '',
      description: '',
      level: 'Beginner',
      category: 'Development',
      price: 0,
      image_url: '',
      xpReward: 100,
      duration: '',
      whatYouWillLearn: [],
      requirements: [],
      contentItems: [],
      isPublished: false,
      isFeatured: false
    });
    setCurrentStep(1);
  };

  const handleCreateCourse = async () => {
    if (!course.title.trim()) {
      showNotification('Course Title is required.', 'error');
      setCurrentStep(1);
      return;
    }
    if (!course.description.trim()) {
      showNotification('Course Description is required.', 'error');
      setCurrentStep(1);
      return;
    }
    setIsSaving(true);
    try {
      const modules = (course.contentItems || []).map((block, blockIndex) => ({
        title: block.title || `Section ${blockIndex + 1}`,
        order_index: block.order_index || blockIndex,
        lessons: (block.subTopics || []).map((subTopic, lessonIndex) => ({
          title: subTopic.title || 'Untitled Lesson',
          type: subTopic.type || 'text',
          content: subTopic.content || '',
          duration: subTopic.duration || '',
          order_index: subTopic.order_index || lessonIndex,
          video_url: subTopic.video_url || '',
          slides_url: subTopic.slides_url || '',
          files: subTopic.files || [],
          has_quiz: subTopic.hasQuiz || false,
          quiz_data: subTopic.hasQuiz && subTopic.quizData ? {
            title: subTopic.quizData.title || '',
            questions: subTopic.quizData.questions || [],
            passing_score: subTopic.quizData.passingScore || 70,
            time_limit: subTopic.quizData.timeLimit || 0,
          } : null,
        }))
      }));

      const courseData = {
        ...course,
        what_you_will_learn: course.whatYouWillLearn,
        modules: modules,
        is_published: course.isPublished,
        is_featured: course.isFeatured,
      };
      delete courseData.contentItems;

      if (isEditing) {
        await updateCourse({ id: parseInt(courseId), ...courseData }).unwrap();
        showNotification('Course updated successfully!');
      } else {
        await createCourse(courseData).unwrap();
        showNotification('Course created successfully!');
      }
      setShowCreateModal(false);
      resetForm();
      refetch();
      if (isEditing) {
        navigate('/instructor-courses');
      }
    } catch (error) {
      const errorMsg = error?.message || 'Failed to save course';
      showNotification('Error: ' + errorMsg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (window.confirm('Delete this course?')) {
      try {
        await deleteCourse(id).unwrap();
        showNotification('Course deleted');
        refetch();
      } catch (error) {
        const errorMsg = error?.message || 'Failed to delete course';
        showNotification('Error: ' + errorMsg, 'error');
      }
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Course Title *
              </label>
              <input
                type="text"
                value={course.title}
                onChange={(e) => setCourse({ ...course, title: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter course title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Description *
              </label>
              <textarea
                value={course.description}
                onChange={(e) => setCourse({ ...course, description: e.target.value })}
                rows="4"
                className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Course description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Level
                </label>
                <select
                  value={course.level}
                  onChange={(e) => setCourse({ ...course, level: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <select
                  value={course.category}
                  onChange={(e) => setCourse({ ...course, category: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Development">Development</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Business">Business</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Price ($)
                </label>
                <input
                  type="number"
                  value={course.price}
                  onChange={(e) => setCourse({ ...course, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Duration
                </label>
                <input
                  type="text"
                  value={course.duration}
                  onChange={(e) => setCourse({ ...course, duration: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., 40 hours"
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <BlockBasedCourseCreator
            darkMode={darkMode}
            onSave={(items) => {
              setCourse({ ...course, contentItems: items });
              showNotification('Content saved!');
            }}
            initialContent={course.contentItems}
          />
        );
      case 3:
        return <StepMedia darkMode={darkMode} course={course} setCourse={setCourse} />;
      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={course.isPublished}
                onChange={(e) => setCourse({ ...course, isPublished: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Publish Course Immediately
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={course.isFeatured}
                onChange={(e) => setCourse({ ...course, isFeatured: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Feature this course
              </label>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Course Summary</h3>
              <div className="mt-2 space-y-1 text-sm">
                <p><span className="text-gray-500">Title:</span> {course.title || 'Not set'}</p>
                <p><span className="text-gray-500">Level:</span> {course.level}</p>
                <p><span className="text-gray-500">Price:</span> ${course.price}</p>
                <p><span className="text-gray-500">Content Items:</span> {course.contentItems?.length || 0}</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const stats = {
    total: courses.length,
    published: courses.filter(c => c.is_published).length,
    draft: courses.filter(c => !c.is_published).length,
    totalStudents: courses.reduce((acc, c) => acc + (c.student_count || 0), 0)
  };

  return (
    <div className="min-h-screen p-6 pt-24 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {notification && (
          <div className={'mb-4 p-4 rounded-lg ' + (
            notification.type === 'error'
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
              : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
          )}>
            {notification.message}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Courses</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Create and manage your courses</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Course
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl shadow-lg bg-white dark:bg-gray-800">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Courses</p>
          </div>
          <div className="p-4 rounded-xl shadow-lg bg-white dark:bg-gray-800">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.published}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Published</p>
          </div>
          <div className="p-4 rounded-xl shadow-lg bg-white dark:bg-gray-800">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.draft}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Drafts</p>
          </div>
          <div className="p-4 rounded-xl shadow-lg bg-white dark:bg-gray-800">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStudents}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Students</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search your courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800">
            <button
              onClick={() => setViewMode('grid')}
              className={'p-2 rounded ' + (viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow' : '')}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={'p-2 rounded ' + (viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow' : '')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
            <p className="mt-2 text-gray-500 dark:text-gray-400">Loading courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white">No courses yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Create your first course</p>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Create Course
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="rounded-xl shadow-lg overflow-hidden bg-white dark:bg-gray-800 hover:shadow-xl transition"
              >
                <div className="relative h-48">
                  <img
                    src={course.image_url || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&h=280&fit=crop'}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <span className={'px-2 py-1 text-xs rounded-full ' + (
                      course.is_published
                        ? 'bg-green-500 text-white'
                        : 'bg-yellow-500 text-white'
                    )}>
                      {course.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{course.title}</h3>
                  <p className="text-sm mt-1 line-clamp-2 text-gray-600 dark:text-gray-400">
                    {course.description}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      <Users className="w-4 h-4 inline mr-1" />
                      {course.student_count || 0}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      <Star className="w-4 h-4 inline mr-1 text-amber-500" />
                      {course.rating || 0}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      {course.price}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => navigate(`/instructor/edit-course/${course.id}`)}
                      className="flex-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className={'max-w-5xl w-full max-h-[95vh] overflow-y-auto p-6 rounded-xl shadow-2xl ' + (darkMode ? 'bg-gray-800' : 'bg-white')}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={'text-xl font-bold ' + (darkMode ? 'text-white' : 'text-gray-900')}>
                {isEditing ? 'Edit Course' : 'Create New Course'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                  if (isEditing) {
                    navigate('/instructor-courses');
                  }
                }}
                className={'p-1 rounded-lg transition ' + (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-6 overflow-x-auto">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => setCurrentStep(step.id)}
                    className={'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ' + (
                      currentStep === step.id
                        ? 'bg-indigo-600 text-white'
                        : darkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-white/20">
                      {step.id}
                    </span>
                    {step.title}
                  </button>
                  {index < steps.length - 1 && (
                    <div className={'w-8 h-px ' + (darkMode ? 'bg-gray-700' : 'bg-gray-300')} />
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="mb-6">
              {renderStepContent()}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className={'px-4 py-2 rounded-lg transition ' + (
                  currentStep === 1
                    ? 'opacity-50 cursor-not-allowed'
                    : darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                Back
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                    if (isEditing) {
                      navigate('/instructor-courses');
                    }
                  }}
                  className={'px-4 py-2 rounded-lg transition ' + (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
                >
                  Cancel
                </button>
                {currentStep === steps.length ? (
                  <button
                    onClick={handleCreateCourse}
                    disabled={isSaving}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {isEditing ? 'Updating...' : 'Saving...'}
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        {isEditing ? 'Update Course' : 'Create Course'}
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCourses;
