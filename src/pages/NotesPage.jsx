import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  Calendar,
  Search,
  X,
  BookText,
  Camera,
} from "lucide-react";
import { apiEndpoints } from "../config/apiConfig";

const NotesPage = ({ darkMode }) => {
  const fileInputRef = useRef(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    course_name: "",
    image_url: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await fetch(apiEndpoints.notes.getAll, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image too large (max 2MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setNewNote({ ...newNote, image_url: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.title.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(apiEndpoints.notes.create, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newNote),
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewNote({ title: "", content: "", course_name: "", image_url: "" });
        setImagePreview(null);
        fetchNotes();
      }
    } catch (error) {
      console.error("Error creating note:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      const response = await fetch(apiEndpoints.notes.delete(id), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setNotes(notes.filter((n) => n.id !== id));
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.course_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1
            className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
          >
            My Learning Notes
          </h1>
          <p
            className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Capture insights from your courses
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition shadow-lg"
        >
          <Plus size={20} /> Create Note
        </button>
      </div>

      <div className="relative mb-8">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Search by title, course or content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none transition-all ${
            darkMode
              ? "bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-purple-500/50"
              : "bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-purple-500/20"
          }`}
        />
      </div>

      {filteredNotes.length === 0 ? (
        <div
          className={`text-center py-20 rounded-2xl border-2 border-dashed ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}
        >
          <div className="text-6xl mb-4 opacity-20">📝</div>
          <h3
            className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
          >
            {searchTerm ? "No matching notes found" : "No notes yet"}
          </h3>
          <p className="text-gray-500 mt-2">
            {searchTerm
              ? "Try adjusting your search terms"
              : "Start capturing your thoughts and lessons today!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`group rounded-2xl border overflow-hidden transition-all hover:shadow-xl ${darkMode ? "bg-gray-800 border-gray-700 hover:border-indigo-500/50" : "bg-white border-gray-100 hover:border-indigo-200"}`}
            >
              {note.image_url && (
                <div className="h-40 w-full overflow-hidden">
                  <img
                    src={note.image_url}
                    alt={note.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                    {note.course_name || "General"}
                  </span>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <h3
                  className={`text-xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}
                >
                  {note.title}
                </h3>
                <p
                  className={`text-sm mb-6 line-clamp-4 leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                  {note.content}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                  <Calendar size={14} />{" "}
                  {new Date(note.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className={`w-full max-w-lg rounded-2xl shadow-2xl ${darkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
              <h2
                className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
              >
                New Note
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddNote} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Topic Cover Image
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`h-32 w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 hover:border-indigo-500"
                      : "bg-gray-50 border-gray-200 hover:border-indigo-500"
                  }`}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <>
                      <Camera className="text-gray-400 mb-1" size={24} />
                      <span className="text-xs text-gray-400">
                        Click to upload cover
                      </span>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="Note title"
                  value={newNote.title}
                  onChange={(e) =>
                    setNewNote({ ...newNote, title: e.target.value })
                  }
                  className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-100"}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Course Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. React Basics"
                  value={newNote.course_name}
                  onChange={(e) =>
                    setNewNote({ ...newNote, course_name: e.target.value })
                  }
                  className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-100"}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Content
                </label>
                <textarea
                  placeholder="Write your notes here..."
                  rows="6"
                  value={newNote.content}
                  onChange={(e) =>
                    setNewNote({ ...newNote, content: e.target.value })
                  }
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-100"}`}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`flex-1 py-3 rounded-xl font-semibold transition ${darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newNote.title.trim()}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesPage;
