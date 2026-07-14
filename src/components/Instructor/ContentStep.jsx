// src/components/Instructor/ContentStep.jsx
import React, { useState } from 'react';
import { 
  Plus, X, Edit2, Trash2, Move, 
  FileText, Video, BookOpen, CheckCircle,
  ChevronDown, ChevronUp, GripVertical,
  Type, Image, Link, Code, Headphones,
  PlayCircle, File, Award, Sparkles
} from 'lucide-react';

const ContentStep = ({ darkMode, course, setCourse, showNotification }) => {
  const [lessons, setLessons] = useState(course.contentItems || []);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [expandedLesson, setExpandedLesson] = useState(null);

  const [lessonForm, setLessonForm] = useState({
    title: '',
    type: 'text',
    content: '',
    duration: '',
    order: lessons.length
  });

  const lessonTypes = [
    { value: 'text', label: 'Text Lesson', icon: Type, color: 'blue' },
    { value: 'video', label: 'Video', icon: PlayCircle, color: 'red' },
    { value: 'pdf', label: 'PDF Document', icon: File, color: 'orange' },
    { value: 'quiz', label: 'Quiz', icon: Award, color: 'green' },
    { value: 'code', label: 'Code Lab', icon: Code, color: 'purple' },
    { value: 'audio', label: 'Audio', icon: Headphones, color: 'pink' },
    { value: 'link', label: 'Resource Link', icon: Link, color: 'indigo' },
  ];

  const handleAddLesson = () => {
    setEditingLesson(null);
    setLessonForm({
      title: '',
      type: 'text',
      content: '',
      duration: '',
      order: lessons.length
    });
    setShowLessonModal(true);
  };

  const handleEditLesson = (index) => {
    const lesson = lessons[index];
    setEditingLesson(index);
    setLessonForm({
      title: lesson.title,
      type: lesson.type,
      content: lesson.content || '',
      duration: lesson.duration || '',
      order: lesson.order || index
    });
    setShowLessonModal(true);
  };

  const handleSaveLesson = () => {
    if (!lessonForm.title.trim()) {
      showNotification('Please enter a lesson title', 'error');
      return;
    }

    const lessonData = {
      ...lessonForm,
      id: editingLesson !== null ? lessons[editingLesson].id : Date.now()
    };

    let updatedLessons;
    if (editingLesson !== null) {
      updatedLessons = [...lessons];
      updatedLessons[editingLesson] = lessonData;
    } else {
      updatedLessons = [...lessons, { ...lessonData, order: lessons.length }];
    }

    setLessons(updatedLessons);
    setCourse({ ...course, contentItems: updatedLessons });
    setShowLessonModal(false);
    setEditingLesson(null);
    showNotification(`Lesson "${lessonData.title}" added successfully!`, 'success');
  };

  const handleDeleteLesson = (index) => {
    if (window.confirm('Are you sure you want to delete this lesson?')) {
      const updatedLessons = lessons.filter((_, i) => i !== index);
      setLessons(updatedLessons.map((lesson, i) => ({ ...lesson, order: i })));
      setCourse({ ...course, contentItems: updatedLessons });
      showNotification('Lesson deleted', 'info');
    }
  };

  const moveLesson = (from, to) => {
    const updated = [...lessons];
    const [removed] = updated.splice(from, 1);
    updated.splice(to, 0, removed);
    setLessons(updated.map((l, i) => ({ ...l, order: i })));
    setCourse({ ...course, contentItems: updated });
  };

  const getLessonTypeIcon = (type) => {
    const found = lessonTypes.find(t => t.value === type);
    return found ? found.icon : FileText;
  };

  const getLessonTypeColor = (type) => {
    const found = lessonTypes.find(t => t.value === type);
    return found ? found.color : 'gray';
  };

  const toggleExpand = (index) => {
    setExpandedLesson(expandedLesson === index ? null : index);
  };

  return (
    <div className="space-y-6">
      {/* Learning Outcomes */}
      <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
        <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          What Students Will Learn
        </h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {course.whatYouWillLearn?.map((item, index) => (
            <span
              key={index}
              className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1 ${
                darkMode ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              {item}
              <button
                onClick={() => {
                  const updated = course.whatYouWillLearn.filter((_, i) => i !== index);
                  setCourse({ ...course, whatYouWillLearn: updated });
                }}
                className="ml-1 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a learning outcome..."
            className={`flex-1 px-4 py-2 rounded-lg border ${
              darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                const updated = [...(course.whatYouWillLearn || []), e.target.value.trim()];
                setCourse({ ...course, whatYouWillLearn: updated });
                e.target.value = '';
              }
            }}
          />
          <button
            onClick={(e) => {
              const input = e.target.parentElement.querySelector('input');
              if (input.value.trim()) {
                const updated = [...(course.whatYouWillLearn || []), input.value.trim()];
                setCourse({ ...course, whatYouWillLearn: updated });
                input.value = '';
              }
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Add
          </button>
        </div>
      </div>

      {/* Lessons Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Course Lessons ({lessons.length})
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Add content for your students to learn
            </p>
          </div>
          <button
            onClick={handleAddLesson}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Lesson
          </button>
        </div>

        {lessons.length === 0 ? (
          <div className={`p-8 text-center rounded-xl border-2 border-dashed ${
            darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'
          }`}>
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No lessons yet</p>
            <p className="text-sm">Click "Add Lesson" to start building your course content</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson, index) => {
              const IconComponent = getLessonTypeIcon(lesson.type);
              const color = getLessonTypeColor(lesson.type);
              const isExpanded = expandedLesson === index;

              return (
                <div
                  key={index}
                  className={`rounded-lg border transition ${
                    darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 p-3">
                    {/* Drag Handle */}
                    <div className="cursor-move text-gray-400">
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Type Icon */}
                    <div className={`p-1.5 rounded bg-${color}-100 text-${color}-600 dark:bg-${color}-900/30 dark:text-${color}-400`}>
                      <IconComponent className="w-4 h-4" />
                    </div>

                    {/* Title and Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {lesson.title}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1)}
                        </span>
                        {lesson.duration && (
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            ⏱ {lesson.duration}
                          </span>
                        )}
                      </div>
                      {isExpanded && lesson.content && (
                        <div className={`mt-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {lesson.content}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <button
                      onClick={() => toggleExpand(index)}
                      className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleEditLesson(index)}
                      className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                      <Edit2 className="w-4 h-4 text-indigo-500" />
                    </button>
                    <button
                      onClick={() => handleDeleteLesson(index)}
                      className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {editingLesson !== null ? 'Edit Lesson' : 'Add New Lesson'}
              </h2>
              <button
                onClick={() => setShowLessonModal(false)}
                className={`p-1 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Lesson Title *
                </label>
                <input
                  type="text"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="Enter lesson title"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Lesson Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                  {lessonTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setLessonForm({ ...lessonForm, type: type.value })}
                        className={`p-2 rounded-lg border text-center transition ${
                          lessonForm.type === type.value
                            ? `border-${type.color}-500 bg-${type.color}-50 dark:bg-${type.color}-900/20 text-${type.color}-600 dark:text-${type.color}-300`
                            : darkMode ? 'border-gray-600 text-gray-300 hover:border-gray-500' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4 mx-auto mb-1" />
                        <span className="text-xs">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Content / Notes
                </label>
                <textarea
                  value={lessonForm.content}
                  onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                  rows="6"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="Write the lesson content, notes, or description here..."
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Duration (optional)
                </label>
                <input
                  type="text"
                  value={lessonForm.duration}
                  onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="e.g., 10:30 or 15 min"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowLessonModal(false)}
                  className={`flex-1 py-2 rounded-lg font-medium transition ${
                    darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveLesson}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
                >
                  {editingLesson !== null ? 'Update Lesson' : 'Add Lesson'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentStep;
