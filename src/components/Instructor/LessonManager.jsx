// src/components/Instructor/LessonManager.jsx
import React, { useState } from 'react';
import { 
  Plus, X, Edit2, Trash2, Move, 
  FileText, Video, BookOpen, CheckCircle,
  ChevronDown, ChevronUp, GripVertical,
  Type, Image, Link, Code, Headphones
} from 'lucide-react';

const LessonManager = ({ darkMode, onSave, initialLessons = [] }) => {
  const [lessons, setLessons] = useState(initialLessons.length > 0 ? initialLessons : []);
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
    { value: 'text', label: 'Text Lesson', icon: Type },
    { value: 'video', label: 'Video', icon: Video },
    { value: 'pdf', label: 'PDF Document', icon: FileText },
    { value: 'quiz', label: 'Quiz', icon: CheckCircle },
    { value: 'code', label: 'Code Lab', icon: Code },
    { value: 'audio', label: 'Audio', icon: Headphones },
    { value: 'link', label: 'Resource Link', icon: Link },
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
      alert('Please enter a lesson title');
      return;
    }

    const lessonData = {
      ...lessonForm,
      id: editingLesson !== null ? lessons[editingLesson].id : Date.now()
    };

    if (editingLesson !== null) {
      // Update existing lesson
      const updatedLessons = [...lessons];
      updatedLessons[editingLesson] = lessonData;
      setLessons(updatedLessons);
    } else {
      // Add new lesson
      setLessons([...lessons, { ...lessonData, order: lessons.length }]);
    }

    setShowLessonModal(false);
    setEditingLesson(null);
    if (onSave) onSave(lessons);
  };

  const handleDeleteLesson = (index) => {
    if (window.confirm('Are you sure you want to delete this lesson?')) {
      const updatedLessons = lessons.filter((_, i) => i !== index);
      setLessons(updatedLessons.map((lesson, i) => ({ ...lesson, order: i })));
      if (onSave) onSave(updatedLessons);
    }
  };

  const toggleExpand = (index) => {
    setExpandedLesson(expandedLesson === index ? null : index);
  };

  const getLessonTypeIcon = (type) => {
    const found = lessonTypes.find(t => t.value === type);
    return found ? found.icon : FileText;
  };

  const getLessonTypeLabel = (type) => {
    const found = lessonTypes.find(t => t.value === type);
    return found ? found.label : type;
  };

  return (
    <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-4`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Course Content
          </h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Add lessons, videos, quizzes, and resources for your students
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

      {/* Lesson List */}
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
            const isExpanded = expandedLesson === index;

            return (
              <div
                key={index}
                className={`rounded-lg border transition ${
                  darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Lesson Header */}
                <div className="flex items-center gap-3 p-3">
                  <div className="cursor-move text-gray-400">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div className={`p-1.5 rounded ${
                    lesson.type === 'text' ? 'bg-blue-100 text-blue-600' :
                    lesson.type === 'video' ? 'bg-red-100 text-red-600' :
                    lesson.type === 'quiz' ? 'bg-green-100 text-green-600' :
                    lesson.type === 'code' ? 'bg-purple-100 text-purple-600' :
                    lesson.type === 'pdf' ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {lesson.title}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {getLessonTypeLabel(lesson.type)}
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-1">
                  {lessonTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setLessonForm({ ...lessonForm, type: type.value })}
                        className={`p-2 rounded-lg border text-center transition ${
                          lessonForm.type === type.value
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300'
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
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  For text lessons, write your content here. For videos, paste the video URL in the content field.
                </p>
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

export default LessonManager;
