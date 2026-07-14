// src/components/Instructor/InteractiveContentManager.jsx
import React, { useState } from 'react';
import { 
  Plus, X, Edit2, Trash2, Brain, Code, Terminal, 
  Send, MessageSquare, Users, CheckCircle, AlertCircle,
  Save, Eye, EyeOff, Sparkles, PlayCircle, FileText,
  ChevronDown, ChevronUp, GripVertical, Clock
} from 'lucide-react';

const InteractiveContentManager = ({ darkMode, onSave, initialContent = [] }) => {
  const [contentItems, setContentItems] = useState(initialContent);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showCodeLabModal, setShowCodeLabModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);
  const [testMessage, setTestMessage] = useState('');
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);

  // Quiz Form State
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    questions: [],
    passingScore: 70,
    timeLimit: 0,
    sendTestMessage: false,
    testMessageContent: ''
  });

  // Code Lab Form State
  const [codeLabForm, setCodeLabForm] = useState({
    title: '',
    description: '',
    language: 'javascript',
    initialCode: '',
    solution: '',
    instructions: '',
    testCases: [],
    sendTestMessage: false,
    testMessageContent: ''
  });

  // Text Lesson Form State
  const [textForm, setTextForm] = useState({
    title: '',
    content: '',
    duration: '',
    sendTestMessage: false,
    testMessageContent: ''
  });

  const [quizQuestionForm, setQuizQuestionForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0
  });
  const [showQuestionForm, setShowQuestionForm] = useState(false);

  const handleAddQuiz = () => {
    if (!quizForm.title.trim() || quizForm.questions.length === 0) {
      alert('Please add a title and at least one question');
      return;
    }

    const newItem = {
      id: Date.now(),
      type: 'quiz',
      ...quizForm,
      created_at: new Date().toISOString()
    };

    addContentItem(newItem);
    setShowQuizModal(false);
    resetQuizForm();
  };

  const handleAddCodeLab = () => {
    if (!codeLabForm.title.trim() || !codeLabForm.instructions.trim()) {
      alert('Please add a title and instructions');
      return;
    }

    const newItem = {
      id: Date.now(),
      type: 'codeLab',
      ...codeLabForm,
      created_at: new Date().toISOString()
    };

    addContentItem(newItem);
    setShowCodeLabModal(false);
    resetCodeLabForm();
  };

  const handleAddTextLesson = () => {
    if (!textForm.title.trim() || !textForm.content.trim()) {
      alert('Please add a title and content');
      return;
    }

    const newItem = {
      id: Date.now(),
      type: 'text',
      ...textForm,
      created_at: new Date().toISOString()
    };

    addContentItem(newItem);
    setShowTextModal(false);
    resetTextForm();
  };

  const addContentItem = (item) => {
    const updated = [...contentItems, item];
    setContentItems(updated);
    if (onSave) onSave(updated);
  };

  const handleEdit = (index) => {
    const item = contentItems[index];
    setEditingIndex(index);
    if (item.type === 'quiz') {
      setQuizForm(item);
      setShowQuizModal(true);
    } else if (item.type === 'codeLab') {
      setCodeLabForm(item);
      setShowCodeLabModal(true);
    } else {
      setTextForm(item);
      setShowTextModal(true);
    }
  };

  const handleDelete = (index) => {
    if (window.confirm('Delete this content item?')) {
      const updated = contentItems.filter((_, i) => i !== index);
      setContentItems(updated);
      if (onSave) onSave(updated);
    }
  };

  const addQuizQuestion = () => {
    if (!quizQuestionForm.question.trim()) {
      alert('Please enter a question');
      return;
    }
    if (quizQuestionForm.options.some(opt => !opt.trim())) {
      alert('Please fill in all options');
      return;
    }

    setQuizForm({
      ...quizForm,
      questions: [...quizForm.questions, { ...quizQuestionForm, id: Date.now() }]
    });

    setQuizQuestionForm({ question: '', options: ['', '', '', ''], correctAnswer: 0 });
    setShowQuestionForm(false);
  };

  const removeQuizQuestion = (index) => {
    const updated = quizForm.questions.filter((_, i) => i !== index);
    setQuizForm({ ...quizForm, questions: updated });
  };

  const sendTestToStudents = (itemId) => {
    const item = contentItems.find(c => c.id === itemId);
    if (!item) return;

    // Prepare test message
    let message = '';
    if (item.sendTestMessage && item.testMessageContent) {
      message = item.testMessageContent;
    } else {
      message = `📢 New ${item.type === 'quiz' ? 'Quiz' : item.type === 'codeLab' ? 'Code Lab' : 'Lesson'} available: ${item.title}`;
      if (item.type === 'quiz') {
        message += `\n📝 ${item.questions.length} questions - Passing score: ${item.passingScore}%`;
      }
      if (item.type === 'codeLab') {
        message += `\n💻 Language: ${item.language}`;
      }
    }

    // Simulate sending to students
    console.log('📤 Sending test message to students:', message);
    alert(`✅ Test message sent to students!\n\n📧 Message:\n${message}\n\n👥 Will be sent to enrolled students.`);
  };

  const toggleExpand = (index) => {
    setExpandedItem(expandedItem === index ? null : index);
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'quiz': return Brain;
      case 'codeLab': return Code;
      default: return FileText;
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'quiz': return 'green';
      case 'codeLab': return 'purple';
      default: return 'blue';
    }
  };

  const resetQuizForm = () => {
    setQuizForm({
      title: '',
      description: '',
      questions: [],
      passingScore: 70,
      timeLimit: 0,
      sendTestMessage: false,
      testMessageContent: ''
    });
    setQuizQuestionForm({ question: '', options: ['', '', '', ''], correctAnswer: 0 });
    setShowQuestionForm(false);
  };

  const resetCodeLabForm = () => {
    setCodeLabForm({
      title: '',
      description: '',
      language: 'javascript',
      initialCode: '',
      solution: '',
      instructions: '',
      testCases: [],
      sendTestMessage: false,
      testMessageContent: ''
    });
  };

  const resetTextForm = () => {
    setTextForm({
      title: '',
      content: '',
      duration: '',
      sendTestMessage: false,
      testMessageContent: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => {
            resetQuizForm();
            setEditingIndex(null);
            setShowQuizModal(true);
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
        >
          <Brain className="w-4 h-4" />
          Add Quiz
        </button>
        <button
          onClick={() => {
            resetCodeLabForm();
            setEditingIndex(null);
            setShowCodeLabModal(true);
          }}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
        >
          <Code className="w-4 h-4" />
          Add Code Lab
        </button>
        <button
          onClick={() => {
            resetTextForm();
            setEditingIndex(null);
            setShowTextModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Add Lesson
        </button>
      </div>

      {/* Content List */}
      {contentItems.length === 0 ? (
        <div className={`p-8 text-center rounded-xl border-2 border-dashed ${
          darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'
        }`}>
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No interactive content yet</p>
          <p className="text-sm">Add quizzes, code labs, or lessons to engage your students</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contentItems.map((item, index) => {
            const Icon = getTypeIcon(item.type);
            const color = getTypeColor(item.type);
            const isExpanded = expandedItem === index;
            
            return (
              <div
                key={item.id || index}
                className={`rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'} hover:border-${color}-500 transition`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {item.title}
                        </h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          item.type === 'quiz' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300' :
                          item.type === 'codeLab' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300' :
                          'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
                        }`}>
                          {item.type === 'quiz' ? `Quiz (${item.questions?.length || 0} Qs)` :
                           item.type === 'codeLab' ? `Code Lab (${item.language})` :
                           'Lesson'}
                        </span>
                        {item.duration && (
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <Clock className="w-3 h-3 inline mr-1" />
                            {item.duration}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {item.description}
                        </p>
                      )}
                      {isExpanded && item.type === 'quiz' && item.questions && (
                        <div className="mt-3 space-y-2">
                          <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            📝 Questions ({item.questions.length}) - Passing Score: {item.passingScore}%
                          </p>
                          {item.questions.slice(0, 3).map((q, idx) => (
                            <div key={idx} className={`text-xs p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                              <p className="font-medium">{idx + 1}. {q.question}</p>
                              <div className="ml-4 text-gray-500 dark:text-gray-400">
                                {q.options.map((opt, oi) => (
                                  <div key={oi} className={oi === q.correctAnswer ? 'text-green-500 font-medium' : ''}>
                                    • {opt} {oi === q.correctAnswer && '✓'}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          {item.questions.length > 3 && (
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              + {item.questions.length - 3} more questions
                            </p>
                          )}
                        </div>
                      )}
                      {isExpanded && item.type === 'codeLab' && (
                        <div className="mt-3">
                          <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              💻 {item.language} - Instructions:
                            </p>
                            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {item.instructions}
                            </p>
                            {item.initialCode && (
                              <pre className={`text-xs mt-1 p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'} overflow-x-auto`}>
                                <code>{item.initialCode}</code>
                              </pre>
                            )}
                          </div>
                        </div>
                      )}
                      {isExpanded && item.type === 'text' && (
                        <div className={`mt-3 p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} whitespace-pre-wrap`}>
                            {item.content}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      {/* Test Button */}
                      <button
                        onClick={() => {
                          setSelectedItemId(item.id);
                          sendTestToStudents(item.id);
                        }}
                        className={`p-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition`}
                        title="Send test message to students"
                      >
                        <Send className="w-4 h-4" />
                      </button>
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

      {/* Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className={`max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {editingIndex !== null ? 'Edit Quiz' : 'Add Quiz'}
              </h3>
              <button
                onClick={() => {
                  setShowQuizModal(false);
                  setEditingIndex(null);
                  resetQuizForm();
                }}
                className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Quiz Title *
                </label>
                <input
                  type="text"
                  value={quizForm.title}
                  onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-green-500`}
                  placeholder="e.g., React Basics Quiz"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description
                </label>
                <textarea
                  value={quizForm.description}
                  onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                  rows="2"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-green-500`}
                  placeholder="Describe the quiz"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Passing Score (%)
                  </label>
                  <input
                    type="number"
                    value={quizForm.passingScore}
                    onChange={(e) => setQuizForm({ ...quizForm, passingScore: parseInt(e.target.value) })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-green-500`}
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Time Limit (minutes, 0 = unlimited)
                  </label>
                  <input
                    type="number"
                    value={quizForm.timeLimit}
                    onChange={(e) => setQuizForm({ ...quizForm, timeLimit: parseInt(e.target.value) })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-green-500`}
                    min="0"
                  />
                </div>
              </div>

              {/* Quiz Questions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Questions ({quizForm.questions.length})
                  </label>
                  <button
                    onClick={() => setShowQuestionForm(!showQuestionForm)}
                    className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition"
                  >
                    {showQuestionForm ? 'Cancel' : '+ Add Question'}
                  </button>
                </div>

                {showQuestionForm && (
                  <div className="space-y-3 mb-4 p-3 rounded-lg bg-white dark:bg-gray-700 border border-green-200 dark:border-green-800">
                    <input
                      type="text"
                      value={quizQuestionForm.question}
                      onChange={(e) => setQuizQuestionForm({ ...quizQuestionForm, question: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-green-500`}
                      placeholder="Enter your question"
                    />
                    {quizQuestionForm.options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOptions = [...quizQuestionForm.options];
                            newOptions[idx] = e.target.value;
                            setQuizQuestionForm({ ...quizQuestionForm, options: newOptions });
                          }}
                          className={`flex-1 px-3 py-1.5 rounded-lg border ${
                            darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200 text-gray-900'
                          } focus:outline-none focus:ring-2 focus:ring-green-500`}
                          placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        />
                        <button
                          onClick={() => setQuizQuestionForm({ ...quizQuestionForm, correctAnswer: idx })}
                          className={`px-3 py-1.5 rounded-lg text-sm ${
                            quizQuestionForm.correctAnswer === idx
                              ? 'bg-green-500 text-white'
                              : darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {quizQuestionForm.correctAnswer === idx ? '✓ Correct' : 'Set'}
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addQuizQuestion}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      Add to Quiz
                    </button>
                  </div>
                )}

                {quizForm.questions.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {quizForm.questions.map((q, idx) => (
                      <div key={idx} className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{idx + 1}. {q.question}</p>
                            <div className="ml-4 text-xs text-gray-500 dark:text-gray-400">
                              {q.options.map((opt, oi) => (
                                <div key={oi} className={oi === q.correctAnswer ? 'text-green-500 font-medium' : ''}>
                                  • {opt} {oi === q.correctAnswer && '✓'}
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

              {/* Test Message Section */}
              <div className={`p-4 rounded-lg border ${darkMode ? 'border-indigo-700' : 'border-indigo-200'} bg-indigo-50 dark:bg-indigo-900/10`}>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                  <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Send Test Message to Students
                  </h4>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    checked={quizForm.sendTestMessage}
                    onChange={(e) => setQuizForm({ ...quizForm, sendTestMessage: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Send a test message to students when this quiz is published
                  </label>
                </div>
                {quizForm.sendTestMessage && (
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Custom Test Message
                    </label>
                    <textarea
                      value={quizForm.testMessageContent}
                      onChange={(e) => setQuizForm({ ...quizForm, testMessageContent: e.target.value })}
                      rows="2"
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                      placeholder="Message to send to students..."
                    />
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Students will receive this message when the quiz is published
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowQuizModal(false);
                    setEditingIndex(null);
                    resetQuizForm();
                  }}
                  className={`flex-1 py-2 rounded-lg font-medium transition ${
                    darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddQuiz}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
                >
                  {editingIndex !== null ? 'Update Quiz' : 'Add Quiz'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Code Lab Modal */}
      {showCodeLabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className={`max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {editingIndex !== null ? 'Edit Code Lab' : 'Add Code Lab'}
              </h3>
              <button
                onClick={() => {
                  setShowCodeLabModal(false);
                  setEditingIndex(null);
                  resetCodeLabForm();
                }}
                className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Code Lab Title *
                </label>
                <input
                  type="text"
                  value={codeLabForm.title}
                  onChange={(e) => setCodeLabForm({ ...codeLabForm, title: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  placeholder="e.g., Build a React Component"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description
                </label>
                <textarea
                  value={codeLabForm.description}
                  onChange={(e) => setCodeLabForm({ ...codeLabForm, description: e.target.value })}
                  rows="2"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  placeholder="Describe the coding exercise"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Programming Language *
                </label>
                <select
                  value={codeLabForm.language}
                  onChange={(e) => setCodeLabForm({ ...codeLabForm, language: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'
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
                  Instructions for Students *
                </label>
                <textarea
                  value={codeLabForm.instructions}
                  onChange={(e) => setCodeLabForm({ ...codeLabForm, instructions: e.target.value })}
                  rows="3"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  placeholder="What should the student build? e.g., Create a function that adds two numbers..."
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Initial Code (Pre-filled for students)
                </label>
                <textarea
                  value={codeLabForm.initialCode}
                  onChange={(e) => setCodeLabForm({ ...codeLabForm, initialCode: e.target.value })}
                  rows="6"
                  className={`w-full px-3 py-2 rounded-lg border font-mono text-sm ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  placeholder="// Write the initial code that students will see and modify..."
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Solution Code (Hidden from students)
                </label>
                <textarea
                  value={codeLabForm.solution}
                  onChange={(e) => setCodeLabForm({ ...codeLabForm, solution: e.target.value })}
                  rows="4"
                  className={`w-full px-3 py-2 rounded-lg border font-mono text-sm ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  placeholder="// Write the solution code (hidden from students)..."
                />
              </div>

              {/* Test Message Section */}
              <div className={`p-4 rounded-lg border ${darkMode ? 'border-indigo-700' : 'border-indigo-200'} bg-indigo-50 dark:bg-indigo-900/10`}>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                  <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Send Test Message to Students
                  </h4>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    checked={codeLabForm.sendTestMessage}
                    onChange={(e) => setCodeLabForm({ ...codeLabForm, sendTestMessage: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Send a test message to students when this code lab is published
                  </label>
                </div>
                {codeLabForm.sendTestMessage && (
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Custom Test Message
                    </label>
                    <textarea
                      value={codeLabForm.testMessageContent}
                      onChange={(e) => setCodeLabForm({ ...codeLabForm, testMessageContent: e.target.value })}
                      rows="2"
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                      placeholder="Message to send to students..."
                    />
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Students will receive this message when the code lab is published
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowCodeLabModal(false);
                    setEditingIndex(null);
                    resetCodeLabForm();
                  }}
                  className={`flex-1 py-2 rounded-lg font-medium transition ${
                    darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCodeLab}
                  className="flex-1 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
                >
                  {editingIndex !== null ? 'Update Code Lab' : 'Add Code Lab'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Text Lesson Modal */}
      {showTextModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className={`max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {editingIndex !== null ? 'Edit Lesson' : 'Add Lesson'}
              </h3>
              <button
                onClick={() => {
                  setShowTextModal(false);
                  setEditingIndex(null);
                  resetTextForm();
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
                  value={textForm.title}
                  onChange={(e) => setTextForm({ ...textForm, title: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="e.g., Introduction to React"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Lesson Content / Notes *
                </label>
                <textarea
                  value={textForm.content}
                  onChange={(e) => setTextForm({ ...textForm, content: e.target.value })}
                  rows="8"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Write the main notes and content for this lesson..."
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Duration (optional)
                </label>
                <input
                  type="text"
                  value={textForm.duration}
                  onChange={(e) => setTextForm({ ...textForm, duration: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="e.g., 15 min"
                />
              </div>

              {/* Test Message Section */}
              <div className={`p-4 rounded-lg border ${darkMode ? 'border-indigo-700' : 'border-indigo-200'} bg-indigo-50 dark:bg-indigo-900/10`}>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                  <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Send Test Message to Students
                  </h4>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    checked={textForm.sendTestMessage}
                    onChange={(e) => setTextForm({ ...textForm, sendTestMessage: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Send a test message to students when this lesson is published
                  </label>
                </div>
                {textForm.sendTestMessage && (
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Custom Test Message
                    </label>
                    <textarea
                      value={textForm.testMessageContent}
                      onChange={(e) => setTextForm({ ...textForm, testMessageContent: e.target.value })}
                      rows="2"
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-200 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                      placeholder="Message to send to students..."
                    />
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Students will receive this message when the lesson is published
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowTextModal(false);
                    setEditingIndex(null);
                    resetTextForm();
                  }}
                  className={`flex-1 py-2 rounded-lg font-medium transition ${
                    darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTextLesson}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
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

export default InteractiveContentManager;
