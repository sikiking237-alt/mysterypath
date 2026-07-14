import React, { useState, useRef } from 'react';
import {
  Plus,
  Trash2,
  Upload,
  FileText,
  Video,
  Link2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  Layers,
  ListChecks,
  ArrowRight,
  X,
  Edit2,
  GripVertical,
  Copy,
  Clock,
  Tag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const BatchContentCreator = ({
  darkMode,
  courseId,
  onContentAdded,
  existingContent = [],
}) => {
  const [batchMode, setBatchMode] = useState('text'); // 'text' | 'csv' | 'manual'
  const [batchInput, setBatchInput] = useState('');
  const [contentItems, setContentItems] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState('lesson');
  const [sections, setSections] = useState([
    { id: Date.now(), name: 'Section 1', items: [] },
  ]);
  const [activeSection, setActiveSection] = useState(0);
  const [bulkMode, setBulkMode] = useState(false);

  // Content types
  const contentTypes = [
    { id: 'lesson', label: 'Lesson', icon: FileText, color: 'blue' },
    { id: 'video', label: 'Video', icon: Video, color: 'purple' },
    { id: 'resource', label: 'Resource', icon: Link2, color: 'green' },
    { id: 'quiz', label: 'Quiz', icon: ListChecks, color: 'orange' },
  ];

  // Parse batch input (one item per line)
  const parseBatchInput = (text) => {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => ({
        title: line,
        type: selectedType,
        description: '',
        duration: '',
        status: 'pending',
        order: 0,
      }));
  };

  // Parse CSV format: title,type,duration,description
  const parseCSVInput = (text) => {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const parts = line.split(',').map(s => s.trim());
        return {
          title: parts[0] || '',
          type: parts[1] || 'lesson',
          duration: parts[2] || '',
          description: parts[3] || '',
          status: 'pending',
          order: 0,
        };
      });
  };

  const handleBatchImport = () => {
    let items = [];
    if (batchMode === 'text') {
      items = parseBatchInput(batchInput);
    } else if (batchMode === 'csv') {
      items = parseCSVInput(batchInput);
    }

    if (items.length === 0) {
      alert('No valid items found. Please check your input.');
      return;
    }

    // Add items to the current section
    const updatedSections = [...sections];
    const currentSection = updatedSections[activeSection];
    const startOrder = currentSection.items.length;

    items.forEach((item, index) => {
      item.order = startOrder + index;
      currentSection.items.push(item);
    });

    setSections(updatedSections);
    setContentItems([...contentItems, ...items]);
    setBatchInput('');
    showNotification(`Added ${items.length} items to the course!`, 'success');
  };

  const handleManualAdd = () => {
    const newItem = {
      id: Date.now(),
      title: '',
      type: 'lesson',
      description: '',
      duration: '',
      status: 'pending',
      order: contentItems.length,
    };
    setContentItems([...contentItems, newItem]);
  };

  const removeItem = (index) => {
    const updated = [...contentItems];
    updated.splice(index, 1);
    setContentItems(updated);
  };

  const updateItem = (index, field, value) => {
    const updated = [...contentItems];
    updated[index][field] = value;
    setContentItems(updated);
  };

  const showNotification = (message, type = 'success') => {
    // You can use your existing notification system here
    alert(message);
  };

  // Sample templates
  const templates = {
    development: `Introduction to Programming
Setting Up Development Environment
Variables and Data Types
Control Flow (If/Else)
Loops and Iteration
Functions and Methods
Object-Oriented Programming
Error Handling
Working with APIs
Final Project`,
    design: `Design Principles Overview
Color Theory Fundamentals
Typography Basics
Layout and Grid Systems
User Experience Research
Wireframing and Prototyping
Visual Design Tools
Design Systems
Accessibility in Design
Portfolio Review`,
    business: `Business Strategy Fundamentals
Market Research Methods
Financial Planning Basics
Marketing Strategies
Operations Management
Human Resources Essentials
Leadership Principles
Business Ethics
Entrepreneurship
Business Plan Development`,
  };

  const loadTemplate = (templateName) => {
    setBatchInput(templates[templateName]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Batch Content Creator
          </h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Add multiple lessons, videos, or resources in one go
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBulkMode(!bulkMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              bulkMode
                ? 'bg-purple-600 text-white'
                : darkMode
                ? 'bg-gray-700 text-gray-300'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {bulkMode ? 'Bulk Mode ON' : 'Bulk Mode OFF'}
          </button>
        </div>
      </div>

      {/* Mode Selection */}
      {bulkMode && (
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setBatchMode('text')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                batchMode === 'text'
                  ? 'bg-purple-600 text-white'
                  : darkMode
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Text (One per line)
            </button>
            <button
              onClick={() => setBatchMode('csv')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                batchMode === 'csv'
                  ? 'bg-purple-600 text-white'
                  : darkMode
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              CSV Import
            </button>
          </div>

          {/* Content Type Selector */}
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Content Type:
            </span>
            {contentTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  selectedType === type.id
                    ? `bg-${type.color}-600 text-white`
                    : darkMode
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <type.icon size={14} />
                {type.label}
              </button>
            ))}
          </div>

          {/* Templates */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Quick Templates:
            </span>
            <button
              onClick={() => loadTemplate('development')}
              className="px-3 py-1 text-xs rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-200 transition"
            >
              Development
            </button>
            <button
              onClick={() => loadTemplate('design')}
              className="px-3 py-1 text-xs rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 hover:bg-purple-200 transition"
            >
              Design
            </button>
            <button
              onClick={() => loadTemplate('business')}
              className="px-3 py-1 text-xs rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 hover:bg-green-200 transition"
            >
              Business
            </button>
          </div>

          {/* Input Area */}
          <div className="mb-4">
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              {batchMode === 'text' ? 'Enter one topic per line:' : 'Enter CSV: title,type,duration,description'}
            </label>
            <textarea
              value={batchInput}
              onChange={(e) => setBatchInput(e.target.value)}
              placeholder={
                batchMode === 'text'
                  ? 'Introduction to Programming\nVariables and Data Types\nFunctions and Methods\nObject-Oriented Programming'
                  : 'Introduction,lesson,10m,Basic concepts\nVariables,video,15m,Data types explained\nFunctions,lesson,20m,Function basics'
              }
              rows="6"
              className={`w-full px-4 py-2.5 rounded-xl border font-mono text-sm ${
                darkMode
                  ? 'bg-gray-900 border-gray-700 text-white focus:border-purple-500'
                  : 'bg-white border-gray-200 text-gray-900 focus:border-purple-500'
              } focus:outline-none transition-all resize-none`}
            />
          </div>

          {/* Preview and Import */}
          {batchInput && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-800 border dark:border-gray-700">
              <div className="text-sm">
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {batchInput.split('\n').filter(line => line.trim()).length} items
                </span>
                <span className={`ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  will be added as {selectedType}s
                </span>
              </div>
              <button
                onClick={handleBatchImport}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 transition flex items-center gap-2"
              >
                <Sparkles size={16} />
                Import All
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-2 ${darkMode ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                or add one by one
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus size={16} />
            Add Content Item
          </button>
        </div>
        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {contentItems.length} items total
        </span>
      </div>

      {/* Content Items List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {contentItems.length === 0 ? (
          <div className={`text-center py-8 rounded-xl border-2 border-dashed ${
            darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'
          }`}>
            <Layers size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No content items added yet</p>
            <p className="text-xs mt-1">Use batch import or add items manually</p>
          </div>
        ) : (
          contentItems.map((item, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${
                darkMode
                  ? 'border-gray-700 hover:border-gray-600'
                  : 'border-gray-200 hover:border-gray-300'
              } transition-all group`}
            >
              <div className="flex items-center gap-3">
                {/* Drag Handle */}
                <div className="cursor-move text-gray-400 hover:text-gray-600">
                  <GripVertical size={16} />
                </div>

                {/* Status Indicator */}
                <div className={`w-2 h-2 rounded-full ${
                  item.status === 'pending' ? 'bg-yellow-400' :
                  item.status === 'processing' ? 'bg-blue-400 animate-pulse' :
                  item.status === 'completed' ? 'bg-green-400' :
                  'bg-gray-400'
                }`} />

                {/* Input fields */}
                <input
                  type="text"
                  placeholder="Content title..."
                  value={item.title}
                  onChange={(e) => updateItem(index, 'title', e.target.value)}
                  className={`flex-1 px-3 py-1.5 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-800 border-gray-600 text-white'
                      : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:border-purple-500 text-sm`}
                />

                {/* Type selector */}
                <select
                  value={item.type}
                  onChange={(e) => updateItem(index, 'type', e.target.value)}
                  className={`px-2 py-1.5 rounded-lg border text-sm ${
                    darkMode
                      ? 'bg-gray-800 border-gray-600 text-white'
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  } focus:outline-none focus:border-purple-500`}
                >
                  {contentTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>

                {/* Duration */}
                <input
                  type="text"
                  placeholder="Duration"
                  value={item.duration || ''}
                  onChange={(e) => updateItem(index, 'duration', e.target.value)}
                  className={`w-24 px-2 py-1.5 rounded-lg border text-sm ${
                    darkMode
                      ? 'bg-gray-800 border-gray-600 text-white'
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  } focus:outline-none focus:border-purple-500`}
                />

                {/* Actions */}
                <button
                  onClick={() => removeItem(index)}
                  className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary and Save */}
      {contentItems.length > 0 && (
        <div className={`p-4 rounded-xl ${
          darkMode ? 'bg-gray-800/50' : 'bg-gray-50'
        } flex items-center justify-between`}>
          <div>
            <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {contentItems.length} content items ready
            </div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Will be added to the course structure
            </div>
          </div>
          <button
            onClick={() => {
              onContentAdded(contentItems);
              setContentItems([]);
            }}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition flex items-center gap-2"
          >
            <CheckCircle size={18} />
            Save All to Course
          </button>
        </div>
      )}

      {/* Quick Stats */}
      {contentItems.length > 0 && (
        <div className="grid grid-cols-4 gap-2 text-xs">
          {contentTypes.map((type) => {
            const count = contentItems.filter(item => item.type === type.id).length;
            return count > 0 ? (
              <div key={type.id} className={`text-center p-2 rounded-lg bg-${type.color}-50 dark:bg-${type.color}-900/20`}>
                <div className={`font-bold text-${type.color}-600 dark:text-${type.color}-400`}>
                  {count}
                </div>
                <div className={`text-${type.color}-500 dark:text-${type.color}-300`}>
                  {type.label}s
                </div>
              </div>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
};

export default BatchContentCreator;