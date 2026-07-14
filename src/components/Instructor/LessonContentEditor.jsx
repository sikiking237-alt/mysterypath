// src/components/Instructor/LessonContentEditor.jsx
import React, { useState, useRef } from 'react';
import {
  FileText,
  Video,
  Link2,
  ListChecks,
  Upload,
  X,
  Plus,
  Trash2,
  Eye,
  Edit2,
  Save,
  Loader2,
  File,
  Image as ImageIcon,
  Code,
  PlayCircle,
  FileQuestion,
  MonitorPlay,
  BookOpen,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

const LessonContentEditor = ({
  darkMode,
  courseId,
  lesson,
  onSave,
  onClose,
}) => {
  const [contentType, setContentType] = useState(lesson?.type || 'video');
  const [title, setTitle] = useState(lesson?.title || '');
  const [description, setDescription] = useState(lesson?.description || '');
  const [content, setContent] = useState(lesson?.content || '');
  const [contentUrl, setContentUrl] = useState(lesson?.content_url || '');
  const [duration, setDuration] = useState(lesson?.duration || '');
  const [resources, setResources] = useState(lesson?.resources || []);
  const [quizQuestions, setQuizQuestions] = useState(lesson?.quiz_questions || []);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const fileInputRef = useRef(null);

  // Content types
  const contentTypes = [
    { id: 'video', label: 'Video', icon: Video, description: 'Upload or link a video' },
    { id: 'text', label: 'Text Lesson', icon: FileText, description: 'Write text content' },
    { id: 'file', label: 'File/PDF', icon: File, description: 'Upload a document' },
    { id: 'quiz', label: 'Quiz', icon: ListChecks, description: 'Create a quiz' },
    { id: 'frontend', label: 'Coding Lab', icon: Code, description: 'Interactive coding exercise' },
  ];

  const handleAddResource = () => {
    setResources([...resources, { name: '', url: '', type: 'file' }]);
  };

  const handleRemoveResource = (index) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const handleResourceChange = (index, field, value) => {
    const updated = [...resources];
    updated[index][field] = value;
    setResources(updated);
  };

  const handleAddQuizQuestion = () => {
    setQuizQuestions([
      ...quizQuestions,
      {
        id: Date.now(),
        question: '',
        options: ['', '', '', ''],
        correct: 0,
      },
    ]);
  };

  const handleRemoveQuizQuestion = (index) => {
    setQuizQuestions(quizQuestions.filter((_, i) => i !== index));
  };

  const handleQuizQuestionChange = (index, field, value) => {
    const updated = [...quizQuestions];
    updated[index][field] = value;
    setQuizQuestions(updated);
  };

  const handleQuizOptionChange = (qIndex, oIndex, value) => {
    const updated = [...quizQuestions];
    updated[qIndex].options[oIndex] = value;
    setQuizQuestions(updated);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a lesson title.');
      return;
    }

    if (contentType === 'video' && !contentUrl.trim()) {
      alert('Please enter a video URL or upload a video.');
      return;
    }

    if (contentType === 'text' && !content.trim()) {
      alert('Please enter text content for the lesson.');
      return;
    }

    if (contentType === 'quiz' && quizQuestions.length === 0) {
      alert('Please add at least one quiz question.');
      return;
    }

    setSaving(true);
    try {
      const lessonData = {
        title: title.trim(),
        description: description.trim(),
        type: contentType,
        content: content,
        content_url: contentUrl,
        duration: duration,
        resources: resources,
        quiz_questions: quizQuestions,
      };

      await onSave(lessonData);
    } catch (error) {
      console.error('Error saving lesson:', error);
      alert('Failed to save lesson. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderContentEditor = () => {
    switch (contentType) {
      case 'video':
        return (
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Video URL
              </label>
              <input
                type="url"
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className={`w-full px-4 py-2.5 rounded-xl border ${
                  darkMode
                    ? 'bg-gray-900 border-gray-700 text-white focus:border-purple-500'
                    : 'bg-white border-gray-200 text-gray-900 focus:border-purple-500'
                } focus:outline-none transition-all`}
              />
              <p className="text-xs text-gray-400 mt-1">Supports YouTube, Vimeo, or direct video URLs</p>
            </div>
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Or Upload Video
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all ${
                  darkMode
                    ? 'border-gray-700 hover:border-purple-500'
                    : 'border-gray-200 hover:border-purple-500'
                }`}
              >
                <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-sm text-gray-500">Click to upload a video file</p>
                <p className="text-xs text-gray-400">MP4, WebM, or MOV (max 500MB)</p>
              </div>
              <input ref={fileInputRef} type="file" accept="video/*" className="hidden" />
            </div>
          </div>
        );

      case 'text':
        return (
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              Lesson Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows="12"
              placeholder="Write your lesson content here. You can use Markdown for formatting."
              className={`w-full px-4 py-3 rounded-xl border ${
                darkMode
                  ? 'bg-gray-900 border-gray-700 text-white focus:border-purple-500'
                  : 'bg-white border-gray-200 text-gray-900 focus:border-purple-500'
              } focus:outline-none transition-all resize-none font-mono text-sm`}
            />
            <div className="mt-2 flex gap-2 flex-wrap">
              <span className="text-xs text-gray-400">Markdown supported:</span>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">**bold**</span>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">*italic*</span>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded"># Heading</span>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">- List</span>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">link</span>
            </div>
          </div>
        );

      case 'file':
        return (
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              Upload File
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all ${
                darkMode
                  ? 'border-gray-700 hover:border-purple-500'
                  : 'border-gray-200 hover:border-purple-500'
              }`}
            >
              <Upload className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-sm text-gray-500">Click to upload a file</p>
              <p className="text-xs text-gray-400">PDF, DOC, PPT, or other documents (max 50MB)</p>
            </div>
            <input ref={fileInputRef} type="file" className="hidden" />
            {contentUrl && (
              <div className="mt-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-sm">
                <CheckCircle className="inline text-green-500 mr-2" size={16} />
                File uploaded: {contentUrl.split('/').pop()}
              </div>
            )}
          </div>
        );

      case 'quiz':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Quiz Questions ({quizQuestions.length})
              </span>
              <button
                onClick={handleAddQuizQuestion}
                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition flex items-center gap-1"
              >
                <Plus size={14} /> Add Question
              </button>
            </div>

            {quizQuestions.length === 0 ? (
              <div className={`p-6 text-center rounded-xl border-2 border-dashed ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <FileQuestion className="mx-auto text-gray-400" size={32} />
                <p className="text-sm text-gray-500 mt-2">No quiz questions yet</p>
                <p className="text-xs text-gray-400">Add questions to test student understanding</p>
              </div>
            ) : (
              quizQuestions.map((q, qIndex) => (
                <div key={q.id || qIndex} className={`p-4 rounded-xl border ${
                  darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Question {qIndex + 1}
                    </span>
                    <button
                      onClick={() => handleRemoveQuizQuestion(qIndex)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => handleQuizQuestionChange(qIndex, 'question', e.target.value)}
                    placeholder="Enter your question..."
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      darkMode
                        ? 'bg-gray-900 border-gray-600 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    } focus:outline-none focus:border-purple-500 mb-3`}
                  />

                  <div className="space-y-2">
                    {q.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct_${qIndex}`}
                          checked={q.correct === oIndex}
                          onChange={() => handleQuizQuestionChange(qIndex, 'correct', oIndex)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleQuizOptionChange(qIndex, oIndex, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                          className={`flex-1 px-3 py-1.5 rounded-lg border text-sm ${
                            darkMode
                              ? 'bg-gray-900 border-gray-600 text-white'
                              : 'bg-white border-gray-200 text-gray-900'
                          } focus:outline-none focus:border-purple-500`}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Select the radio button for the correct answer
                  </p>
                </div>
              ))
            )}
          </div>
        );

      case 'frontend':
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-blue-500 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Coding Lab Exercise
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Students will write HTML, CSS, and JavaScript code in an interactive editor.
                    The initial code below will be pre-loaded in the editor.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Initial HTML
              </label>
              <textarea
                value={content || ''}
                onChange={(e) => setContent(e.target.value)}
                rows="4"
                placeholder="<h1>Hello World</h1>"
                className={`w-full px-3 py-2 rounded-lg border font-mono text-sm ${
                  darkMode
                    ? 'bg-gray-900 border-gray-700 text-white'
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                } focus:outline-none focus:border-purple-500`}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {lesson ? 'Edit Lesson Content' : 'Add Lesson Content'}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              previewMode
                ? 'bg-purple-600 text-white'
                : darkMode
                ? 'bg-gray-700 text-gray-300'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {previewMode ? <Eye size={14} className="inline mr-1" /> : <Edit2 size={14} className="inline mr-1" />}
            {previewMode ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {!previewMode ? (
        <>
          {/* Title */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              Lesson Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter lesson title..."
              className={`w-full px-4 py-2.5 rounded-xl border ${
                darkMode
                  ? 'bg-gray-900 border-gray-700 text-white focus:border-purple-500'
                  : 'bg-white border-gray-200 text-gray-900 focus:border-purple-500'
              } focus:outline-none transition-all`}
            />
          </div>

          {/* Content Type */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Content Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {contentTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setContentType(type.id)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    contentType === type.id
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                      : darkMode
                      ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <type.icon className="mx-auto mb-1" size={20} />
                  <span className="text-xs font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="2"
              placeholder="Brief description of the lesson..."
              className={`w-full px-4 py-2.5 rounded-xl border ${
                darkMode
                  ? 'bg-gray-900 border-gray-700 text-white focus:border-purple-500'
                  : 'bg-white border-gray-200 text-gray-900 focus:border-purple-500'
              } focus:outline-none transition-all resize-none`}
            />
          </div>

          {/* Duration */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              Duration (optional)
            </label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g., 10:30 or 2h 15m"
              className={`w-full px-4 py-2.5 rounded-xl border ${
                darkMode
                  ? 'bg-gray-900 border-gray-700 text-white focus:border-purple-500'
                  : 'bg-white border-gray-200 text-gray-900 focus:border-purple-500'
              } focus:outline-none transition-all`}
            />
          </div>

          {/* Content Editor */}
          {renderContentEditor()}

          {/* Resources */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Additional Resources
              </label>
              <button
                onClick={handleAddResource}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
              >
                <Plus size={14} /> Add Resource
              </button>
            </div>

            {resources.map((resource, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={resource.name}
                  onChange={(e) => handleResourceChange(index, 'name', e.target.value)}
                  placeholder="Resource name"
                  className={`flex-1 px-3 py-1.5 rounded-lg border text-sm ${
                    darkMode
                      ? 'bg-gray-900 border-gray-700 text-white'
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  } focus:outline-none focus:border-purple-500`}
                />
                <input
                  type="url"
                  value={resource.url}
                  onChange={(e) => handleResourceChange(index, 'url', e.target.value)}
                  placeholder="Resource URL"
                  className={`flex-1 px-3 py-1.5 rounded-lg border text-sm ${
                    darkMode
                      ? 'bg-gray-900 border-gray-700 text-white'
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  } focus:outline-none focus:border-purple-500`}
                />
                <button
                  onClick={() => handleRemoveResource(index)}
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <p className="text-xs text-gray-400">Add links to additional reading, resources, or files</p>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-3 pt-4 border-t dark:border-gray-700">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Lesson Content
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        /* Preview Mode */
        <div className={`p-6 rounded-xl ${
          darkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={20} className="text-purple-500" />
            <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {title || 'Untitled Lesson'}
            </h4>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              contentType === 'video' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' :
              contentType === 'text' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300' :
              contentType === 'quiz' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300' :
              'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300'
            }`}>
              {contentType}
            </span>
          </div>

          {description && (
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              {description}
            </p>
          )}

          <div className="p-4 rounded-lg bg-white dark:bg-gray-900 border dark:border-gray-700">
            {contentType === 'video' && contentUrl && (
              <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                <PlayCircle size={48} className="text-white/50" />
                <p className="text-white/50 text-sm ml-2">Video Preview</p>
              </div>
            )}

            {contentType === 'text' && content && (
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-sm">{content}</p>
              </div>
            )}

            {contentType === 'quiz' && (
              <div>
                <p className="text-sm font-medium mb-2">{quizQuestions.length} questions</p>
                {quizQuestions.slice(0, 2).map((q, idx) => (
                  <div key={idx} className="p-2 rounded bg-gray-50 dark:bg-gray-800 mb-2">
                    <p className="text-sm font-medium">{q.question}</p>
                    <p className="text-xs text-gray-500">{q.options.length} options</p>
                  </div>
                ))}
                {quizQuestions.length > 2 && (
                  <p className="text-xs text-gray-400">+ {quizQuestions.length - 2} more questions</p>
                )}
              </div>
            )}

            {contentType === 'frontend' && (
              <div className="text-center p-6">
                <Code size={32} className="mx-auto text-gray-400" />
                <p className="text-sm text-gray-500 mt-2">Coding Lab Exercise</p>
              </div>
            )}
          </div>

          {resources.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Resources ({resources.length})</p>
              <div className="space-y-1">
                {resources.map((r, idx) => (
                  <div key={idx} className="text-sm text-purple-600 dark:text-purple-400">
                    • {r.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LessonContentEditor;