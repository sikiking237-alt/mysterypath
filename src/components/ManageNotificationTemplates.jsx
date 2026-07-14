// src/components/ManageNotificationTemplates.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, BellRing, AlertCircle, Loader, X } from 'lucide-react';
import TemplateEditorModal from './TemplateEditorModal';

const ManageNotificationTemplates = ({ darkMode }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const token = localStorage.getItem('token');

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/notification-templates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenModal = (template = null) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
  };

  const handleSaveTemplate = async (templateData) => {
    const isNew = !templateData.id;
    const url = isNew ? '/api/admin/notification-templates' : `/api/admin/notification-templates/${templateData.id}`;
    const method = isNew ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(templateData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save template');
      await fetchTemplates();
      handleCloseModal();
      showNotification(`Template ${isNew ? 'created' : 'updated'} successfully!`, 'success');
    } catch (err) {
      showNotification(`Error: ${err.message}`, 'error');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/admin/notification-templates/${templateId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete template');
      await fetchTemplates();
      showNotification('Template deleted successfully!', 'success');
    } catch (err) {
      showNotification(`Error: ${err.message}`, 'error');
    }
  };

  const getTypePill = (type) => {
    const base = 'px-2 py-0.5 rounded-full text-xs font-medium';
    switch (type) {
      case 'success': return `${base} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
      case 'warning': return `${base} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
      case 'error': return `${base} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
      default: return `${base} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`;
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader className="animate-spin text-indigo-500" size={48} />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-red-500">
          <AlertCircle className="w-12 h-12 mb-4" />
          <p className="text-lg font-semibold">Failed to Load Templates</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchTemplates}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Retry
          </button>
        </div>
      );
    }

    if (templates.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <BellRing className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            No Templates Yet
          </h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
            Create your first notification template to get started.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Create Template
          </button>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Message
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {templates.map((template) => (
              <tr key={template.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {template.title}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-sm truncate">
                  {template.message}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={getTypePill(template.type)}>
                    {template.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleOpenModal(template)}
                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4 transition"
                    title="Edit template"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition"
                    title="Delete template"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={`min-h-screen p-4 md:p-8 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-4 px-4 py-3 rounded-lg shadow-lg text-white ${
            notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
          }`}
        >
          <p>{notification.message}</p>
          <button
            onClick={() => setNotification(null)}
            className="p-1 rounded-full hover:bg-white/20 transition"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                darkMode
                  ? 'bg-purple-900/30 text-purple-400'
                  : 'bg-purple-100 text-purple-600'
              }`}
            >
              <BellRing />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Notification Templates</h1>
              <p
                className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                Create, edit, and delete reusable notification templates.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition"
          >
            <Plus size={20} />
            New Template
          </button>
        </div>

        {/* Table */}
        <div
          className={`rounded-2xl shadow-sm border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
          }`}
        >
          {renderContent()}
        </div>

        {/* Footer */}
        <div
          className={`mt-6 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
        >
          <p>These templates can be used when sending notifications to users.</p>
          <p className="mt-1 text-xs opacity-75">
            Total: {templates.length} template{templates.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <TemplateEditorModal
          darkMode={darkMode}
          template={editingTemplate}
          onClose={handleCloseModal}
          onSave={handleSaveTemplate}
        />
      )}
    </div>
  );
};

export default ManageNotificationTemplates;