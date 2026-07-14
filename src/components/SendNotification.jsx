import React, { useState, useEffect } from "react";

const SendNotification = ({ darkMode, onClose }) => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notificationType, setNotificationType] = useState("info");
  const [recipientType, setRecipientType] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchUsers();
    fetchTemplates();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : (data.users || []));
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/admin/notification-templates", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      alert("Please enter both title and message");
      return;
    }

    setSending(true);
    try {
      const payload = {
        title,
        message,
        type: notificationType,
        recipient_type: recipientType,
        recipient_ids: recipientType === "specific" ? selectedUsers : []
      };

      const response = await fetch("/api/admin/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message || `Notification sent to ${data.count || 'all'} user(s)`);
        onClose();
      } else {
        alert(data.message || data.error || "Failed to send notification");
      }
    } catch (error) {
      alert("Error sending notification");
    } finally {
      setSending(false);
    }
  };

  const applyTemplate = (template) => {
    setTitle(template.title);
    setMessage(template.message);
    setNotificationType(template.type);
    setShowTemplateSelector(false);
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleUserSelection = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'success': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'warning': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'error': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default: return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className={`max-w-2xl w-full mx-4 rounded-xl shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'} flex justify-between items-center`}>
          <div>
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>📢 Send Notification</h2>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Send announcements to users and instructors</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Template Selector */}
          <div style={{ display: 'none' }}>
            <button
              onClick={() => setShowTemplateSelector(!showTemplateSelector)}
              className={`text-sm flex items-center gap-2 ${darkMode ? 'text-purple-400' : 'text-purple-600'} hover:underline`}
            >
              📋 Use Template {showTemplateSelector ? "▲" : "▼"}
            </button>
            {showTemplateSelector && templates.length > 0 && (
              <div className={`mt-2 grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    className={`p-2 rounded-lg text-left transition ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'}`}
                  >
                    <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{template.title}</div>
                    <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{template.message.substring(0, 100)}...</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., New Course Available!"
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
            />
          </div>

          {/* Message */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows="4"
              placeholder="Type your announcement here..."
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
            />
          </div>

          {/* Notification Type */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Notification Type</label>
            <div className="flex gap-3">
              {[
                { value: "info", label: "ℹ️ Info", color: "bg-blue-500" },
                { value: "success", label: "✅ Success", color: "bg-green-500" },
                { value: "warning", label: "⚠️ Warning", color: "bg-yellow-500" },
                { value: "error", label: "❌ Error", color: "bg-red-500" }
              ].map(type => (
                <button
                  key={type.value}
                  onClick={() => setNotificationType(type.value)}
                  className={`px-3 py-1 rounded-full text-sm transition ${notificationType === type.value ? `${type.color} text-white` : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className={`p-4 rounded-lg ${getTypeColor(notificationType)}`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{getTypeIcon(notificationType)}</span>
              <span className="font-semibold">Preview:</span>
            </div>
            <div className="font-medium mt-1">{title || "Title will appear here"}</div>
            <div className="text-sm mt-1 opacity-90">{message || "Message will appear here"}</div>
          </div>

          {/* Recipients */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Send to</label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => setRecipientType("all")}
                className={`px-3 py-2 rounded-lg text-sm transition ${recipientType === "all" ? 'bg-purple-600 text-white' : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
              >
                👥 All Users
              </button>
              <button
                onClick={() => setRecipientType("students")}
                className={`px-3 py-2 rounded-lg text-sm transition ${recipientType === "students" ? 'bg-purple-600 text-white' : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
              >
                🎓 Students Only
              </button>
              <button
                onClick={() => setRecipientType("instructors")}
                className={`px-3 py-2 rounded-lg text-sm transition ${recipientType === "instructors" ? 'bg-purple-600 text-white' : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
              >
                👨‍🏫 Instructors Only
              </button>
              <button
                onClick={() => setRecipientType("specific")}
                className={`px-3 py-2 rounded-lg text-sm transition ${recipientType === "specific" ? 'bg-purple-600 text-white' : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
              >
                🎯 Specific Users
              </button>
            </div>
          </div>

          {/* Specific Users Selection */}
          {recipientType === "specific" && (
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Select Users</label>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border mb-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`}
              />
              <div className={`max-h-48 overflow-y-auto rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                {filteredUsers.map(user => (
                  <label
                    key={user.id}
                    className={`flex items-center gap-3 p-2 cursor-pointer transition ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.name}</div>
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.role === 'admin' ? 'bg-red-100 text-red-700' :
                      user.role === 'instructor' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {user.role}
                    </span>
                  </label>
                ))}
              </div>
              <div className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Selected: {selectedUsers.length} users
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSendNotification}
              disabled={sending}
              className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
            >
              {sending ? "Sending..." : "📨 Send Notification"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendNotification;