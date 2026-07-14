import React, { useState, useEffect } from "react";
import { Video, Plus, Users, Calendar, Clock, Link as LinkIcon, X, Send } from "lucide-react";
import { apiEndpoints } from "../config/apiConfig";

const PeerMeetingsPage = ({ darkMode }) => {
  const [meetings, setMeetings] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedPeers, setSelectedPeers] = useState([]);
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    title: "",
    meetingLink: "",
    whatsappLink: "",
    socialLink: "",
    description: ""
  });

  useEffect(() => {
    fetchMeetings();
    fetchStudents();
  }, []);

  const fetchMeetings = async () => {
    try {
      const response = await fetch(apiEndpoints.student.peerMeetings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMeetings(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching meetings:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(apiEndpoints.users.students, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.meetingLink) {
      alert("Title and meeting link are required");
      return;
    }
    if (selectedPeers.length === 0) {
      alert("Select at least one peer");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(apiEndpoints.student.peerMeetings, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          meetingLink: formData.meetingLink,
          whatsappLink: formData.whatsappLink,
          socialLink: formData.socialLink,
          description: formData.description,
          peer_ids: selectedPeers
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setShowCreateModal(false);
        setFormData({
          title: "",
          meetingLink: "",
          whatsappLink: "",
          socialLink: "",
          description: ""
        });
        setSelectedPeers([]);
        fetchMeetings();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create meeting");
      }
    } catch (error) {
      console.error("Error creating meeting:", error);
      alert("Failed to create meeting");
    } finally {
      setLoading(false);
    }
  };

  const togglePeerSelection = (peerId) => {
    setSelectedPeers(prev =>
      prev.includes(peerId)
        ? prev.filter(id => id !== peerId)
        : [...prev, peerId]
    );
  };

  const formatTime = (dateString) => {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor((now - date) / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Peer Meetings
            </h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Create and manage study sessions with your peers
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition"
          >
            <Plus size={20} />
            Create Meeting
          </button>
        </div>

        {/* Meetings List */}
        {meetings.length === 0 ? (
          <div className={`text-center py-16 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <Video size={64} className={`mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              No peer meetings yet
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Create your first peer meeting to study with classmates
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl p-6 border hover:shadow-lg transition`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {meeting.title}
                      </h3>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        by {meeting.creator_name}
                      </p>
                    </div>
                  </div>
                </div>

                {meeting.description && (
                  <p className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {meeting.description}
                  </p>
                )}

                <div className="space-y-3 mb-4">
                  <a
                    href={meeting.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700"
                  >
                    <LinkIcon size={16} />
                    Join Meeting
                  </a>
                  {meeting.whatsapp_link && (
                    <a
                      href={meeting.whatsapp_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700"
                    >
                      <Send size={16} />
                      WhatsApp Group
                    </a>
                  )}
                </div>

                <div className={`flex items-center gap-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <Clock size={14} />
                  {formatTime(meeting.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Meeting Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center">
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Create Peer Meeting
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition`}
                >
                  <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateMeeting} className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Meeting Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none`}
                  placeholder="e.g., Study Group for Mathematics"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Meeting Link *
                </label>
                <input
                  type="url"
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none`}
                  placeholder="https://zoom.us/j/..."
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  WhatsApp Link (Optional)
                </label>
                <input
                  type="url"
                  value={formData.whatsappLink}
                  onChange={(e) => setFormData({ ...formData, whatsappLink: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none`}
                  placeholder="https://chat.whatsapp.com/..."
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Social Link (Optional)
                </label>
                <input
                  type="url"
                  value={formData.socialLink}
                  onChange={(e) => setFormData({ ...formData, socialLink: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none`}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none resize-none`}
                  rows={3}
                  placeholder="What's this meeting about?"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Select Peers *
                </label>
                <div className={`max-h-48 overflow-y-auto rounded-xl border ${darkMode ? 'border-gray-600' : 'border-gray-300'} p-3 space-y-2`}>
                  {students.length === 0 ? (
                    <p className={`text-sm text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      No peers available
                    </p>
                  ) : (
                    students.map((student) => (
                      <label
                        key={student.id}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${selectedPeers.includes(student.id) ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPeers.includes(student.id)}
                          onChange={() => togglePeerSelection(student.id)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-600"
                        />
                        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {student.name}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold transition ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeerMeetingsPage;
