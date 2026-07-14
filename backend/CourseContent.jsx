import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { apiCall, apiEndpoints, uploadFile } from '../../config/apiConfig';
import { Plus, Edit, Trash, Video, FileText, Upload } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import toast from 'react-hot-toast';

// A simple modal component
const Modal = ({ children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl">
      <div className="flex justify-end">
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">&times;</button>
      </div>
      {children}
    </div>
  </div>
);

const RichTextEditorStyles = () => (
  <style>{`
    .quill-dark .ql-toolbar {
      background-color: #1f2937;
      border-color: #4b5563 !important;
    }
    .quill-dark .ql-container {
      border-color: #4b5563 !important;
    }
    .quill-dark .ql-editor {
      background-color: #374151;
      color: #d1d5db;
    }
    .quill-dark .ql-toolbar .ql-picker-label,
    .quill-dark .ql-toolbar .ql-stroke,
    .quill-dark .ql-toolbar .ql-fill {
      color: #d1d5db !important;
      stroke: #d1d5db !important;
      fill: #d1d5db !important;
    }
  `}</style>
);

const CourseContent = ({ darkMode }) => {
  const { courseId } = useParams();
  const [courseStructure, setCourseStructure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingLesson, setEditingLesson] = useState(null); // Can be a new or existing lesson
  const [selectedModuleId, setSelectedModuleId] = useState(null);

  const fetchCourseStructure = useCallback(async () => {
    setLoading(true);
    const response = await apiCall(apiEndpoints.instructor.courseStructure(courseId));
    if (response.success) {
      setCourseStructure(response);
    } else {
      setError(response.error || 'Failed to load course content.');
      toast.error(response.error || 'Failed to load course content.');
    }
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    fetchCourseStructure();
  }, [fetchCourseStructure]);

  const handleOpenLessonForm = (lesson, moduleId) => {
    setSelectedModuleId(moduleId);
    setEditingLesson(lesson || { title: '', type: 'text', content: '', video_url: '', duration: '' });
  };

  const handleCloseLessonForm = () => {
    setEditingLesson(null);
    setSelectedModuleId(null);
  };

  const handleSaveLesson = async (lessonData) => {
    const isNew = !lessonData.id;
    const endpoint = isNew 
      ? apiEndpoints.instructor.moduleLessons(selectedModuleId) 
      : apiEndpoints.instructor.lesson(lessonData.id);
    const method = isNew ? 'POST' : 'PUT';

    const response = await apiCall(endpoint, { method, body: lessonData });

    if (response.success || response.lesson) {
      toast.success(`Lesson ${isNew ? 'created' : 'updated'} successfully!`);
      handleCloseLessonForm();
      fetchCourseStructure(); // Refresh data
    } else {
      toast.error(response.error || 'Failed to save lesson.');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (window.confirm('Are you sure you want to delete this lesson?')) {
      const response = await apiCall(apiEndpoints.instructor.lesson(lessonId), { method: 'DELETE' });
      if (response.success) {
        toast.success('Lesson deleted successfully!');
        fetchCourseStructure(); // Refresh data
      } else {
        toast.error(response.error || 'Failed to delete lesson.');
      }
    }
  };

  if (loading) return <div className="p-6">Loading course content...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <RichTextEditorStyles />
      <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Course Content: {courseStructure?.title}
      </h1>

      {courseStructure?.sections?.map((module) => (
        <div key={module.id} className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{module.title}</h2>
          <div className="space-y-3">
            {module.lessons?.map((lesson) => (
              <div key={lesson.id} className={`flex items-center justify-between p-3 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-white shadow-sm'}`}>
                <div className="flex items-center gap-3">
                  {lesson.type === 'video' ? <Video className="text-indigo-500" /> : <FileText className="text-indigo-500" />}
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{lesson.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleOpenLessonForm(lesson, module.id)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDeleteLesson(lesson.id)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full">
                    <Trash size={16} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => handleOpenLessonForm(null, module.id)}
            className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
            <Plus size={16} /> Add Lesson
          </button>
        </div>
      ))}

      {editingLesson && (
        <Modal onClose={handleCloseLessonForm}>
          <LessonForm
            lesson={editingLesson}
            onSave={handleSaveLesson}
            onCancel={handleCloseLessonForm}
            darkMode={darkMode}
          />
        </Modal>
      )}
    </div>
  );
};

const LessonForm = ({ lesson, onSave, onCancel, darkMode }) => {
  const [formData, setFormData] = useState(lesson);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContentChange = (value) => {
    // Handler for ReactQuill which returns the content directly
    setFormData(prev => ({ ...prev, content: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    toast.loading('Uploading file...');

    const response = await uploadFile(file, apiEndpoints.instructor.courseFileUpload);
    
    setIsUploading(false);
    toast.dismiss();

    if (response.success) {
      toast.success('File uploaded successfully!');
      // Assuming video for now, but this could be more dynamic
      setFormData(prev => ({ ...prev, video_url: response.file_url }));
    } else {
      toast.error(response.error || 'File upload failed.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {lesson.id ? 'Edit Lesson' : 'Create Lesson'}
      </h3>
      
      <div>
        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Title</label>
        <input type="text" name="title" value={formData.title} onChange={handleChange} required
               className={`mt-1 block w-full px-3 py-2 rounded-md shadow-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`} />
      </div>

      <div>
        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Lesson Type</label>
        <select name="type" value={formData.type} onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 rounded-md shadow-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}>
          <option value="text">Text Content</option>
          <option value="video">Video</option>
          <option value="quiz">Quiz</option>
        </select>
      </div>

      {formData.type === 'text' && (
        <div>
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Content</label>
          <div className="mt-1">
            <ReactQuill
              theme="snow"
              value={formData.content}
              onChange={handleContentChange}
              className={darkMode ? 'quill-dark' : ''}
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                  [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
                  ['link', 'image', 'video'],
                  ['clean']
                ],
              }}
            />
          </div>
        </div>
      )}


      {formData.type === 'video' && (
        <div>
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Video URL or Upload</label>
          <input type="text" name="video_url" value={formData.video_url} onChange={handleChange} placeholder="https://example.com/video.mp4"
                 className={`mt-1 block w-full px-3 py-2 rounded-md shadow-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`} />
          <div className="mt-2">
            <label htmlFor="video-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700">
              <Upload size={16} /> {isUploading ? 'Uploading...' : 'Upload Video File'}
            </label>
            <input id="video-upload" type="file" className="hidden" onChange={handleFileChange} accept="video/*" disabled={isUploading} />
          </div>
        </div>
      )}

      {formData.type === 'quiz' && (
        <div className={`mt-1 p-4 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Quiz creation functionality is not yet implemented.
          </p>
        </div>
      )}

      <div>
        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Duration (e.g., "10 mins")</label>
        <input type="text" name="duration" value={formData.duration} onChange={handleChange}
               className={`mt-1 block w-full px-3 py-2 rounded-md shadow-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`} />
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className={`px-4 py-2 rounded-md ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>Cancel</button>
        <button type="submit" disabled={isUploading} className="px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
          {isUploading ? 'Uploading...' : 'Save Lesson'}
        </button>
      </div>
    </form>
  );
};

export default CourseContent;