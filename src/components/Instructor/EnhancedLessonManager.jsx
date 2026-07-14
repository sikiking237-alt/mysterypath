// src/components/Instructor/EnhancedLessonManager.jsx
import React, { useState } from 'react';
import { 
  Plus, X, Edit2, Trash2, FileText, Video, BookOpen, 
  CheckCircle, Code, Link, Headphones, PlayCircle, File,
  PenTool, Brain, Terminal, Save, Eye, EyeOff,
  ChevronDown, ChevronUp, GripVertical, Sparkles
} from 'lucide-react';

const EnhancedLessonManager = ({ darkMode, onSave, initialLessons = [] }) => {
  const [lessons, setLessons] = useState(initialLessons);
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [expandedLesson, setExpandedLesson] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'text',
    content: '',
    duration: '',
    // Quiz fields
    quizQuestions: [],
    // Code Lab fields
    codeLab: {
      language: 'javascript',
      initialCode: '',
      solution: '',
      instructions: ''
    }
  });

  const [quizForm, setQuizForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0
  });
  const [showQuizForm, setShowQuizForm] = useState(false);

  const lessonTypes = [
    { value: 'text', label: 'Text Lesson', icon: FileText, description: 'Add notes and content' },
    { value: 'video', label: 'Video', icon: PlayCircle, description: 'Embed video content' },
    { value: 'pdf', label: 'PDF', icon: File, description: 'Upload PDF document' },
    { value: 'quiz', label: 'Quiz', icon: Brain, description: 'Add quiz questions' },
    { value: 'code', label: 'Code Lab', icon: Code, description: 'Interactive coding exercise' },
    { value: 'link', label: 'Resource', icon: Link, description: 'Add resource link' },
    { value: 'audio', label: 'Audio', icon: Headphones, description: 'Add audio content' },
  ];

  const handleAddLesson = () => {
    if (!formData.title.trim()) {
      alert('Please enter a lesson title');
      return;
    }

    const newLesson = {
      id: Date.now(),
      ...formData,
      quizQuestions: formData.type === 'quiz' ? formData.quizQuestions : [],
      codeLab: formData.type === 'code' ? formData.codeLab : null
    };

    let updatedLessons;
    if (editingIndex !== null) {
      updatedLessons = [...lessons];
      updatedLessons[editingIndex] = newLesson;
    } else {
      updatedLessons = [...lessons, newLesson];
    }

    setLessons(updatedLessons);
    resetForm();
    setShowForm(false);
    setEditingIndex(null);
    if (onSave) onSave(updatedLessons);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'text',
      content: '',
      duration: '',
      quizQuestions: [],
      codeLab: {
        language: 'javascript',
        initialCode: '',
        solution: '',
        instructions: ''
      }
    });
    setQuizForm({ question: '', options: ['', '', '', ''], correctAnswer: 0 });
    setShowQuizForm(false);
  };

  const handleEdit = (index) => {
    const lesson = lessons[index];
    setFormData({
      title: lesson.title,
      type: lesson.type,
      content: lesson.content || '',
      duration: lesson.duration || '',
      quizQuestions: lesson.quizQuestions || [],
      codeLab: lesson.codeLab || { language: 'javascript', initialCode: '', solution: '', instructions: '' }
    });
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

  const addQuizQuestion = () => {
    if (!quizForm.question.trim()) {
      alert('Please enter a question');
      return;
    }
    if (quizForm.options.some(opt => !opt.trim())) {
      alert('Please fill in all options');
      return;
    }

    const newQuestion = {
      id: Date.now(),
      question: quizForm.question,
      options: quizForm.options,
      correctAnswer: quizForm.correctAnswer
    };

    setFormData({
      ...formData,
      quizQuestions: [...formData.quizQuestions, newQuestion]
    });

    setQuizForm({ question: '', options: ['', '', '', ''], correctAnswer: 0 });
    setShowQuizForm(false);
  };

  const removeQuizQuestion = (index) => {
    const updated = formData.quizQuestions.filter((_, i) => i !== index);
    setFormData({ ...formData, quizQuestions: updated });
  };

  const toggleExpand = (index) => {
    setExpandedLesson(expandedLesson === index ? null : index);
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

  const renderQuizPreview = (questions) => {
    if (!questions || questions.length === 0) return null;
    return (
      <div className="mt-2 space-y-2">
        <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          📝 {questions.length} Quiz Question{questions.length > 1 ? 's' : ''}:
        </p>
        {questions.map((q, idx) => (
          <div key={idx} className={`text-xs p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <p className="font-medium">{idx + 1}. {q.question}</p>
            <div className="ml-4 space-y-0.5">
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${oi === q.correctAnswer ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className={oi === q.correctAnswer ? 'text-green-500' : ''}>{opt}</span>
                  {oi === q.correctAnswer && <span className="text-green-500 text-xs">✓</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCodeLabPreview = (codeLab) => {
    if (!codeLab || !codeLab.initialCode) return null;
    return (
      <div className="mt-2">
        <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            💻 Code Lab: {codeLab.language}
          </p>
          <pre className={`text-xs mt-1 p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'} overflow-x-auto`}>
            <code>{codeLab.initialCode || '// No code provided'}</code>
          </pre>
          {codeLab.instructions && (
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              📋 {codeLab.instructions}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Course Content ({lessons.length} lessons)
          </h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Add lessons with notes, quizzes, and coding exercises
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
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
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No lessons added yet</p>
          <p className="text-sm">Add text lessons, quizzes, coding labs, and more</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson, index) => {
            const Icon = getTypeIcon(lesson.type);
            const color = getTypeColor(lesson.type);
            const isExpanded = expandedLesson === index;
            
            return (
              <div
                key={lesson.id || index}
                className={`rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'} hover:border-indigo-500 transition`}
              >
                <div className="p-4">
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
                        {lesson.type === 'quiz' && lesson.quizQuestions?.length > 0 && (
                          <span className={`text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300`}>
                            {lesson.quizQuestions.length} Qs
                          </span>
                        )}
                        {lesson.type === 'code' && lesson.codeLab?.initialCode && (
                          <span className={`text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300`}>
                            💻 Code Lab
                          </span>
                        )}
                      </div>
                      {isExpanded && lesson.content && (
                        <div className={`mt-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} whitespace-pre-wrap`}>
                          {lesson.content}
                        </div>
                      )}
                      {isExpanded && lesson.type === 'quiz' && renderQuizPreview(lesson.quizQuestions)}
                      {isExpanded && lesson.type === 'code' && renderCodeLabPreview(lesson.codeLab)}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleExpand(index)}
                        className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
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
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Lesson Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className={`max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {editingIndex !== null ? 'Edit Lesson' : 'Add New Lesson'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingIndex(null);
                  resetForm();
                }}
                className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Lesson Title */}
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

              {/* Lesson Type */}
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
                        onClick={() => {
                          setFormData({ 
                            ...formData, 
                            type: type.value,
                            quizQuestions: type.value === 'quiz' ? formData.quizQuestions : [],
                            codeLab: type.value === 'code' ? formData.codeLab : { language: 'javascript', initialCode: '', solution: '', instructions: '' }
                          });
                        }}
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

              {/* Content / Notes */}
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Lesson Notes / Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows="5"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="Write the main notes, content, or description for this lesson..."
                />
              </div>

              {/* Quiz Builder */}
              {formData.type === 'quiz' && (
                <div className={`p-4 rounded-lg border ${darkMode ? 'border-green-700' : 'border-green-200'} bg-green-50 dark:bg-green-900/10`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-green-500" />
                      <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Quiz Questions ({formData.quizQuestions.length})
                      </h4>
                    </div>
                    <button
                      onClick={() => setShowQuizForm(!showQuizForm)}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition"
                    >
                      {showQuizForm ? 'Cancel' : '+ Add Question'}
                    </button>
                  </div>

                  {/* Quiz Question Form */}
                  {showQuizForm && (
                    <div className="space-y-3 mb-4 p-3 rounded-lg bg-white dark:bg-gray-700">
                      <input
                        type="text"
                        value={quizForm.question}
                        onChange={(e) => setQuizForm({ ...quizForm, question: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-green-500`}
                        placeholder="Enter your question"
                      />
                      {quizForm.options.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOptions = [...quizForm.options];
                              newOptions[idx] = e.target.value;
                              setQuizForm({ ...quizForm, options: newOptions });
                            }}
                            className={`flex-1 px-3 py-1.5 rounded-lg border ${
                              darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200 text-gray-900'
                            } focus:outline-none focus:ring-2 focus:ring-green-500`}
                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                          />
                          <button
                            onClick={() => setQuizForm({ ...quizForm, correctAnswer: idx })}
                            className={`px-3 py-1.5 rounded-lg text-sm ${
                              quizForm.correctAnswer === idx
                                ? 'bg-green-500 text-white'
                                : darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {quizForm.correctAnswer === idx ? '✓ Correct' : 'Set'}
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addQuizQuestion}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        Add Question to Quiz
                      </button>
                    </div>
                  )}

                  {/* Quiz Questions List */}
                  {formData.quizQuestions.length > 0 && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {formData.quizQuestions.map((q, idx) => (
                        <div key={idx} className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{idx + 1}. {q.question}</p>
                              <div className="ml-4 space-y-0.5">
                                {q.options.map((opt, oi) => (
                                  <div key={oi} className={`text-xs flex items-center gap-2 ${oi === q.correctAnswer ? 'text-green-500' : ''}`}>
                                    <span className={`w-2 h-2 rounded-full ${oi === q.correctAnswer ? 'bg-green-500' : 'bg-gray-300'}`} />
                                    {opt} {oi === q.correctAnswer && '✓'}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <button
                              onClick={() => removeQuizQuestion(idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Code Lab */}
              {formData.type === 'code' && (
                <div className={`p-4 rounded-lg border ${darkMode ? 'border-purple-700' : 'border-purple-200'} bg-purple-50 dark:bg-purple-900/10`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Code className="w-5 h-5 text-purple-500" />
                    <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Code Lab
                    </h4>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Programming Language
                      </label>
                      <select
                        value={formData.codeLab.language}
                        onChange={(e) => setFormData({
                          ...formData,
                          codeLab: { ...formData.codeLab, language: e.target.value }
                        })}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                        <option value="java">Java</option>
                        <option value="csharp">C#</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Instructions for Students
                      </label>
                      <textarea
                        value={formData.codeLab.instructions}
                        onChange={(e) => setFormData({
                          ...formData,
                          codeLab: { ...formData.codeLab, instructions: e.target.value }
                        })}
                        rows="2"
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                        placeholder="What should the student build? e.g., Create a function that adds two numbers..."
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Initial Code (Pre-filled for students)
                      </label>
                      <textarea
                        value={formData.codeLab.initialCode}
                        onChange={(e) => setFormData({
                          ...formData,
                          codeLab: { ...formData.codeLab, initialCode: e.target.value }
                        })}
                        rows="6"
                        className={`w-full px-3 py-2 rounded-lg border font-mono text-sm ${
                          darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                        placeholder="// Write the initial code that students will see and modify..."
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Solution Code (Hidden from students)
                      </label>
                      <textarea
                        value={formData.codeLab.solution}
                        onChange={(e) => setFormData({
                          ...formData,
                          codeLab: { ...formData.codeLab, solution: e.target.value }
                        })}
                        rows="4"
                        className={`w-full px-3 py-2 rounded-lg border font-mono text-sm ${
                          darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                        placeholder="// Write the solution code (hidden from students)..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Duration */}
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

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingIndex(null);
                    resetForm();
                  }}
                  className={`flex-1 py-2 rounded-lg font-medium transition ${
                    darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLesson}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
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

export default EnhancedLessonManager;
