import React, { useState, useRef, useCallback } from 'react';
import {
  Plus,
  Trash2,
  FileText,
  Video,
  Link2,
  ListChecks,
  Sparkles,
  Layers,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Upload,
  Download,
  Copy,
  Edit2, // <-- ADD THIS IMPORT
  AlertTriangle,
  Bell,
  BellOff,
} from 'lucide-react';

import { useDraggableList } from './useDraggableList';

// These are static and can be defined outside the component
// to prevent them from being recreated on every render.
const contentTypes = [
  { id: 'lesson', label: 'Lesson', icon: FileText, color: 'blue' },
  { id: 'video', label: 'Video', icon: Video, color: 'purple' },
  { id: 'resource', label: 'Resource', icon: Link2, color: 'green' },
  { id: 'quiz', label: 'Quiz', icon: ListChecks, color: 'orange' },
];

// Style map to prevent Tailwind CSS JIT from purging dynamic classes.
// Using `bg-${color}-600` dynamically won't work in production builds.
const contentTypeStyles = {
  lesson: { bg: 'bg-blue-600', text: 'text-blue-500' },
  video: { bg: 'bg-purple-600', text: 'text-purple-500' },
  resource: { bg: 'bg-green-600', text: 'text-green-500' },
  quiz: { bg: 'bg-orange-600', text: 'text-orange-500' },
  default: { bg: 'bg-gray-600', text: 'text-gray-500' },
};

const ContentItem = ({
  item,
  index,
  darkMode,
  onUpdate,
  onDelete,
  onEdit,
  dragProps,
  isDraggingOver,
  contentTypes,
  contentTypeStyles,
  getTypeIcon,
}) => {
  const Icon = getTypeIcon(item.type);

  return (
    <div
      draggable
      {...dragProps}
      className={`p-2.5 rounded-lg border transition-all group ${
        darkMode
          ? 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
          : 'border-gray-200 hover:border-gray-300 bg-white'
      } ${isDraggingOver ? 'border-purple-500 border-dashed' : ''}`}
    >
      <div className="flex items-center gap-2">
        <div className="cursor-move text-gray-400" title="Drag to reorder">
          <GripVertical size={14} />
        </div>
        <Icon size={14} className={contentTypeStyles[item.type]?.text || contentTypeStyles.default.text} />
        <input
          type="text"
          placeholder="Content title..."
          value={item.title}
          onChange={(e) => onUpdate(index, 'title', e.target.value)}
          className={`flex-1 px-2 py-1 rounded-lg border text-sm ${
            darkMode
              ? 'bg-gray-900 border-gray-600 text-white'
              : 'bg-gray-50 border-gray-200 text-gray-900'
          } focus:outline-none focus:border-purple-500`}
        />
        <select
          value={item.type}
          onChange={(e) => onUpdate(index, 'type', e.target.value)}
          className={`px-2 py-1 rounded-lg border text-xs ${
            darkMode
              ? 'bg-gray-900 border-gray-600 text-white'
              : 'bg-gray-50 border-gray-200 text-gray-900'
          } focus:outline-none focus:border-purple-500`}
        >
          {contentTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => onEdit && onEdit(item)}
          className="p-1.5 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-500 transition"
          title="Add content to this lesson"
        >
          <Edit2 size={14} />
        </button>
        <button onClick={() => onDelete(index)} className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition">
          <Trash2 size={14} />
        </button>
      </div>
      {item.content && (
        <div className="mt-1 ml-7">
          <span className="text-xs text-green-500 flex items-center gap-1">
            <CheckCircle size={12} />
            Content added
          </span>
        </div>
      )}
    </div>
  );
};

const BatchContentCreator = ({
  darkMode,
  courseId,
  onContentAdded,
  existingContent = [],
  onEditContent,
  showNotification,
}) => {
  const [batchMode, setBatchMode] = useState('text'); // 'text' | 'manual'
  const [batchInput, setBatchInput] = useState('');
  const [contentItems, setContentItems] = useState([]);
  const [selectedType, setSelectedType] = useState('lesson');
  const [isProcessing, setIsProcessing] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDeleteIndex, setItemToDeleteIndex] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const nextId = useRef(0); // For generating unique temporary IDs for new items

  React.useEffect(() => {
    if (existingContent && existingContent.length > 0) {
      const maxId = existingContent.reduce((max, item) => {
        const match = item.id && item.id.match(/new-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          return num > max ? num : max;
        }
        return max;
      }, 0);
      nextId.current = maxId + 1;
    }
  }, [existingContent]);

  const showNotificationWrapper = (message, type) => {
    // Only show notifications if they are enabled and the prop function exists.
    if (notificationsEnabled && showNotification) {
      showNotification(message, type);
    }
  };

  // Parse batch input (one item per line)
  const parseBatchInput = (text) => {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map((line, index) => ({
        id: `new-${nextId.current++}`, // Use a more robust temporary ID
        title: line,
        type: selectedType,
        description: '',
        duration: '',
        status: 'pending',
        order: index,
      }));
  };

  const handleBatchImport = () => {
    if (!batchInput.trim()) {
      showNotificationWrapper('Please enter at least one topic.', 'error');
      return;
    }

    const items = parseBatchInput(batchInput);
    if (items.length === 0) {
      showNotificationWrapper('No valid items found. Please check your input.', 'error');
      return;
    }

    setContentItems([...contentItems, ...items]);
    setBatchInput('');
    // Show success message
    showNotificationWrapper(`✅ Added ${items.length} items to the list. Click 'Save All' to confirm.`, 'info');
  };

  const handleManualAdd = () => {
    const newItem = {
      id: `new-${nextId.current++}`, // Use a more robust temporary ID
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

  const openDeleteConfirmation = (index) => {
    setItemToDeleteIndex(index);
    setShowDeleteConfirm(true);
  };

  const confirmDeletion = () => {
    if (itemToDeleteIndex !== null) {
      removeItem(itemToDeleteIndex);
    }
    setShowDeleteConfirm(false);
    setItemToDeleteIndex(null);
  };

  const handleReorder = useCallback((fromIndex, toIndex) => {
    const items = [...contentItems];
    const [draggedItem] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, draggedItem);

    const reorderedItems = items.map((item, index) => ({ ...item, order: index }));
    setContentItems(reorderedItems);
  }, [contentItems]);

  const { getDragProps, dragOverIndex } = useDraggableList(handleReorder);

  const handleSaveAll = async () => {
    // Validate all items have titles
    const invalidItems = contentItems.filter(item => !item.title.trim());
    if (invalidItems.length > 0) {
      showNotificationWrapper(`⚠️ Please fill in titles for all ${invalidItems.length} items.`, 'error');
      return;
    }

    setIsProcessing(true);
    try {
      // Re-map to ensure order is correct before passing to parent
      const itemsToSave = contentItems.map((item, index) => ({ ...item, order: index }));
      onContentAdded(itemsToSave);
      setContentItems([]);
    } catch (error) {
      console.error('Error saving content:', error);
      showNotificationWrapper('❌ Failed to save content. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Templates
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

  const getTypeIcon = (type) => {
    const found = contentTypes.find(t => t.id === type);
    return found ? found.icon : FileText;
  };

  // Show existing content if provided
  React.useEffect(() => {
    if (existingContent && existingContent.length > 0 && contentItems.length === 0) {
      setContentItems(existingContent);
    }
  }, [existingContent]);

  return (
    <div className="space-y-4">
      {/* Header with toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${
          darkMode 
            ? 'bg-gray-800/50 hover:bg-gray-800 border border-gray-700' 
            : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <Layers size={20} className="text-purple-500" />
          <div className="text-left">
            <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Batch Content Creator
            </h4>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Add multiple lessons, videos, or resources at once
            </p>
          </div>
        </div>
        {expanded ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800/30 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
          {/* Mode Selection */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setBatchMode('text')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                batchMode === 'text'
                  ? 'bg-purple-600 text-white'
                  : darkMode
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              📝 Text (One per line)
            </button>
            <button
              onClick={() => setBatchMode('manual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                batchMode === 'manual'
                  ? 'bg-purple-600 text-white'
                  : darkMode
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              ✏️ Manual Entry
            </button>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`ml-auto p-2 rounded-lg text-xs font-medium transition-all ${
                darkMode
                  ? 'text-gray-400 hover:bg-gray-700'
                  : 'text-gray-500 hover:bg-gray-200'
              }`}
              title={notificationsEnabled ? 'Mute notifications for this component' : 'Unmute notifications for this component'}
            >
              {notificationsEnabled ? <Bell size={14} /> : <BellOff size={14} />}
            </button>
          </div>

          {batchMode === 'text' ? (
            <>
              {/* Content Type Selector */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Type:
                </span>
                {contentTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                      selectedType === type.id
                        ? `${contentTypeStyles[type.id]?.bg || contentTypeStyles.default.bg} text-white`
                        : darkMode
                        ? 'bg-gray-700 text-gray-300'
                        : 'bg-white text-gray-600 border border-gray-200'
                    }`}
                  >
                    <type.icon size={12} />
                    {type.label}
                  </button>
                ))}
              </div>

              {/* Templates */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Templates:
                </span>
                <button
                  onClick={() => loadTemplate('development')}
                  className="px-2.5 py-1 text-xs rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-200 transition"
                >
                  💻 Dev
                </button>
                <button
                  onClick={() => loadTemplate('design')}
                  className="px-2.5 py-1 text-xs rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 hover:bg-purple-200 transition"
                >
                  🎨 Design
                </button>
                <button
                  onClick={() => loadTemplate('business')}
                  className="px-2.5 py-1 text-xs rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 hover:bg-green-200 transition"
                >
                  📊 Business
                </button>
              </div>

              {/* Input Area */}
              <div className="mb-3">
                <label className={`block text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1.5`}>
                  Enter one topic per line:
                </label>
                <textarea
                  value={batchInput}
                  onChange={(e) => setBatchInput(e.target.value)}
                  placeholder="Introduction to Programming&#10;Variables and Data Types&#10;Functions and Methods&#10;Object-Oriented Programming"
                  rows="5"
                  className={`w-full px-3 py-2 rounded-lg border text-sm font-mono ${
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
                    <span className={`ml-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      as {selectedType}s
                    </span>
                  </div>
                  <button
                    onClick={handleBatchImport}
                    className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition flex items-center gap-1.5"
                  >
                    <Sparkles size={14} />
                    Import All
                  </button>
                </div>
              )}

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className={`px-2 ${darkMode ? 'bg-gray-800/30 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                    or add one by one
                  </span>
                </div>
              </div>
            </>
          ) : null}

          {/* Manual Add Button */}
          <button
            onClick={handleManualAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus size={16} />
            Add Content Item
          </button>

          {/* Content Items List */}
          {contentItems.length > 0 && (
            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {contentItems.length} items added
                </span>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Click ✏️ to add content (video, text, quiz, etc.)
                </span>
              </div>
              {contentItems.map((item, index) => (
                <ContentItem
                  key={item.id}
                  item={item}
                  index={index}
                  darkMode={darkMode}
                  onUpdate={updateItem}
                  onDelete={openDeleteConfirmation}
                  onEdit={onEditContent}
                  dragProps={getDragProps(index)}
                  isDraggingOver={dragOverIndex === index}
                  contentTypes={contentTypes}
                  contentTypeStyles={contentTypeStyles}
                  getTypeIcon={getTypeIcon}
                />
              ))}

              {/* Save All Button */}
              <button
                onClick={handleSaveAll}
                disabled={isProcessing}
                className="w-full mt-3 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Save All {contentItems.length} Items to Course
                  </>
                )}
              </button>
            </div>
          )}

          {contentItems.length === 0 && (
            <div className={`text-center py-6 mt-4 rounded-xl border-2 border-dashed ${
              darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'
            }`}>
              <Layers size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No content items added yet</p>
              <p className="text-xs mt-1">Use batch import or add items manually</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BatchContentCreator;