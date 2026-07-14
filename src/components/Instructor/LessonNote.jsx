// src/components/Instructor/LessonNote.jsx
import React, { useState } from 'react';
import { Plus, X, Edit2, Trash2, FileText, Video, BookOpen, CheckCircle, Code, Link, Headphones, PlayCircle, File } from 'lucide-react';

const LessonNote = ({ darkMode, onSave, initialLessons = [] }) => {
  const [lessons, setLessons] = useState(initialLessons);
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'text',
    content: '',
    duration: ''
  });

  const lessonTypes = [
    { value: 'text', label: 'Text Lesson', icon: FileText },
    { value: 'video', label: 'Video', icon: PlayCircle },
    { value: 'pdf', label: 'PDF', icon: File },
    { value: 'quiz', label: 'Quiz', icon: CheckCircle },
    { value: 'code', label: 'Code Lab', icon: Code },
    { value: 'link', label: 'Resource', icon: Link },
    { value: 'audio', label: 'Audio', icon: Headphones },
  ];

  const handleAddLesson = () => {
    if (!formData.title.trim()) {
      alert('Please enter a lesson title');
      return;
    }

    const newLesson = {
      id: Date.now(),
      ...formData
    };

    if (editingIndex !== null) {
      const updated = [...lessons];
      updated[editingIndex] = newLesson;
      setLessons(updated);
    } else {
      setLessons([...lessons, newLesson]);
    }

    setFormData({ title: '', type: 'text', content: '', duration: '' });
    setShowForm(false);
    setEditingIndex(null);
    if (onSave) onSave(lessons);
  };

  const handleEdit = (index) => {
    setFormData(lessons[index]);
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleDelete = (index) => {
    if (window.confirm('Delete this lesson?')) {
      const updated = lessons.filter((_, i) => i !== index);
      setLessons(updated);
      if (onSave) onSave(updated);
    }
  };

  const getTypeIcon = (type) => {
    const found = lessonTypes.find(t => t.value === type);
    return found ? found.icon : FileText;
  };

  const getTypeColor = (type) => {
    const colors = {
      text: 'blue',
      video: 'red',
      pdf: 'orange',
      quiz: 'green',
      code: 'purple',
      link: 'indigo',
      audio: 'pink'
    };
    return colors[type] || 'gray';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Course Lessons ({lessons.length})
          </h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Add lessons with notes for your students
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({ title: '', type: 'text', content: '', duration: '' });
            setEditingIndex(null);
            setShowForm(true);
          }}
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
          <p className="font-medium">No lessons added yet</p>
          <p className="text-sm">Click "Add Lesson" to add course content with notes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson, index) => {
            const Icon = getTypeIcon(lesson.type);
            const color = getTypeColor(lesson.type);
            
            return (
              <div
                key={lesson.id || index}
                className={`p-4 rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'} hover:border-indigo-500 transition`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {lesson.title}
                      </h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                        {lesson.type}
                      </span>
                      {lesson.duration && (
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          ⏱ {lesson.duration}
                        </span>
                      )}
                    </div>
                    {lesson.content && (
                      <div className={`mt-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} whitespace-pre-wrap`}>
                        {lesson.content}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(index)}
                      className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                      <Edit2 className="w-4 h-4 text-indigo-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Lesson Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`max-w-2xl w-full p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {editingIndex !== null ? 'Edit Lesson' : 'Add New Lesson'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingIndex(null);
                }}
                className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
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
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="e.g., Introduction to React"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Lesson Type
                </label>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {lessonTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setFormData({ ...formData, type: type.value })}
                        className={`p-2 rounded-lg border text-center transition ${
                          formData.type === type.value
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
                  Lesson Notes / Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows="6"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="Write the main notes, content, or description for this lesson..."
                />
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  This will be the main content students will read for this lesson
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Duration (optional)
                </label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="e.g., 10 min or 15:30"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingIndex(null);
                  }}
                  className={`flex-1 py-2 rounded-lg font-medium transition ${
                    darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLesson}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
                >
                  {editingIndex !== null ? 'Update Lesson' : 'Add Lesson'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonNote;
