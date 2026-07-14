import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, Video, Share2, Link as LinkIcon, ExternalLink, Monitor, Code2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Whiteboard from './Whiteboard';
import LiveCodeSession from './LiveCodeSession';

const API_BASE = "/api";

const InstructorStudents = ({ darkMode }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgress, setFilterProgress] = useState('all'); // 'all', 'in-progress', 'completed'
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showLiveClassModal, setShowLiveClassModal] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showLiveCode, setShowLiveCode] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [liveClassData, setLiveClassData] = useState({
    title: '',
    meetingLink: '',
    whatsappLink: '',
    socialLink: '',
    description: '',
    expiresAfterClass: false,
    scheduledTime: ''
  });
  const [selectedStudents, setSelectedStudents] = useState([]); // State for selected students
  const [isSending, setIsSending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch students from API
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/instructor/students`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setStudents(data);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        // Demo data
        setStudents([ // Ensure demo data has progress for filtering
          { id: 1, name: 'John Doe', email: 'john@example.com', enrolled_date: '2024-01-15', progress: 65, course_title: 'Web Development' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', enrolled_date: '2024-02-01', progress: 100, course_title: 'Data Science' },
          { id: 3, name: 'Mike Brown', email: 'mike@example.com', enrolled_date: '2024-01-20', progress: 45, course_title: 'UI/UX Design' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.course_title?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProgress = filterProgress === 'all' ||
                            (filterProgress === 'in-progress' && student.progress > 0 && student.progress < 100) ||
                            (filterProgress === 'completed' && student.progress === 100) ||
                            (filterProgress === 'not-started' && student.progress === 0);

    return matchesSearch && matchesProgress;
  });

  const handleSendBulkMessage = async (isLiveClass = false) => {
    const token = localStorage.getItem('token');
    const studentIds = selectedStudents;
    setIsSending(true);

    try {
      let endpoint = `${API_BASE}/instructor/messages/bulk`;
      let payload = { student_ids: studentIds, content: announcement };
    
    if (isLiveClass) {
      if (!liveClassData.title || !liveClassData.meetingLink) {
        setIsSending(false);
        return alert("Please enter class title and meeting link");
      }
      endpoint = `${API_BASE}/instructor/live-classes`;
      payload = { ...liveClassData, student_ids: studentIds };
    } else {
      if (!announcement.trim()) {
        setIsSending(false);
        return alert("Please enter a message");
      }
    }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert(`Successfully sent to ${studentIds.length} students!`);
        setShowBulkModal(false);
        setShowLiveClassModal(false);
        setSelectedStudents([]); // Clear selection after sending
        setAnnouncement('');
        setLiveClassData({ title: '', meetingLink: '', whatsappLink: '', socialLink: '', description: '' });
      } else {
        alert("Failed to send announcement. Please try again.");
      }
    } catch (error) {
      console.error('Error sending bulk message:', error);
      alert("Error connecting to server.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudents(filteredStudents.map(student => student.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudents(prevSelected =>
      prevSelected.includes(studentId) ? prevSelected.filter(id => id !== studentId) : [...prevSelected, studentId]
    );
  };

  // Function to generate Google Meet link
  const generateMeetingLink = () => {
    const generateRandomCode = (length) => {
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    const code1 = generateRandomCode(3);
    const code2 = generateRandomCode(3);
    const code3 = generateRandomCode(3);
    return `https://meet.google.com/${code1}-${code2}-${code3}`;
  };

  // Auto-generate meeting link when modal opens
  const handleOpenLiveClassModal = () => {
    setLiveClassData({
      title: '',
      meetingLink: generateMeetingLink(),
      whatsappLink: '',
      socialLink: '',
      description: '',
      expiresAfterClass: false,
      scheduledTime: ''
    });
    setShowLiveClassModal(true);
  };

  // Social media sharing function
  const shareOnSocialMedia = (platform, link, title) => {
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(link)}&text=${encodeURIComponent(`Join my live class: ${title}`)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`Join my live class: ${title} - ${link}`)}`
    };
    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
  };

  const handleMessageStudent = (studentId) => {
    navigate('/chat', { state: { contactId: studentId } });
  };


  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            👥 My Students
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            View and manage your enrolled students
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowWhiteboard(true)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition font-semibold text-sm ${
              darkMode ? 'border-gray-700 text-white hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Monitor className="w-4 h-4" />
            Whiteboard
          </button>
          <button 
            onClick={() => setShowLiveCode(true)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition font-semibold text-sm ${
              darkMode ? 'border-gray-700 text-white hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Live Code
          </button>
          <button 
            onClick={handleOpenLiveClassModal}
            disabled={selectedStudents.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
          >
            <Video className="w-4 h-4" />
            Organize Live Class ({selectedStudents.length})
          </button>
          <button 
            onClick={() => setShowBulkModal(true)}
            disabled={selectedStudents.length === 0}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm ${
              darkMode ? 'border-gray-700 text-white hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Announcement
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="🔍 Search students by name, email, or course..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`flex-1 px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
        />
        <select
          value={filterProgress}
          onChange={(e) => setFilterProgress(e.target.value)}
          className={`px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
        >
          <option value="all">All Progress</option>
          <option value="not-started">Not Started</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {filteredStudents.length === 0 && (
        <div className={`text-center py-12 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <p className="text-gray-500">No students found matching your criteria.</p>
        </div>
      )}
      <div className={`rounded-xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                    disabled={filteredStudents.length === 0}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Enrolled</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
              {filteredStudents.map((student) => (
                <tr key={student.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition ${selectedStudents.includes(student.id) ? (darkMode ? 'bg-gray-700/50' : 'bg-purple-50') : ''}`}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleSelectStudent(student.id)}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                        {student.name.charAt(0)}
                      </div>
                      <span className="font-medium">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{student.email}</td>
                  {/* Assuming enrolled_date is a string, otherwise format it */}
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{student.enrolled_date}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{student.progress}%</span>
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${student.progress}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleMessageStudent(student.id)} className="text-indigo-600 text-sm hover:underline">Message</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Message Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6 border-b dark:border-gray-700">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>📢 Send Bulk Announcement</h2>
              <p className="text-sm text-gray-500 mt-1">This message will be sent to the {selectedStudents.length} selected students.</p>
            </div>
            
            <div className="p-6">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Announcement Content</label>
              <textarea
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="Type your announcement here..."
                rows="5"
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition-all ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'
                }`}
              />
            </div>

            <div className="p-6 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
              <button
                onClick={() => setShowBulkModal(false)}
                className={`flex-1 py-2 rounded-lg font-semibold transition ${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleSendBulkMessage}
                disabled={isSending || !announcement.trim()}
                className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSending ? "Sending..." : <><Send className="w-4 h-4" /> Send Now</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Class Modal */}
      {showLiveClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6 border-b dark:border-gray-700">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>🎥 Organize Live Class</h2>
              <p className="text-sm text-gray-500 mt-1">Send meeting and social links to {selectedStudents.length} selected students.</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Class Title</label>
                <input
                  type="text"
                  value={liveClassData.title}
                  onChange={(e) => setLiveClassData({...liveClassData, title: e.target.value})}
                  placeholder="e.g., Q&A Session: Advanced React"
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Meeting Link (Auto-generated Google Meet)</label>
                <div className="relative">
                  <Video className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={liveClassData.meetingLink}
                    onChange={(e) => setLiveClassData({...liveClassData, meetingLink: e.target.value})}
                    placeholder="https://meet.google.com/..."
                    className={`w-full pl-10 pr-20 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setLiveClassData({...liveClassData, meetingLink: generateMeetingLink()})}
                    className="absolute right-2 top-1.5 px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                  >
                    Regenerate
                  </button>
                </div>
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  ✨ Auto-generated Google Meet link - click Regenerate for a new link
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>WhatsApp Group Link (Optional)</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={liveClassData.whatsappLink}
                    onChange={(e) => setLiveClassData({...liveClassData, whatsappLink: e.target.value})}
                    placeholder="https://chat.whatsapp.com/..."
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Social Media Link (Optional)</label>
                <div className="relative">
                  <Share2 className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={liveClassData.socialLink}
                    onChange={(e) => setLiveClassData({...liveClassData, socialLink: e.target.value})}
                    placeholder="https://facebook.com/events/..."
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Share on Social Media</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => shareOnSocialMedia('twitter', liveClassData.meetingLink, liveClassData.title)}
                    className="flex-1 px-3 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition flex items-center justify-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                    Twitter
                  </button>
                  <button
                    type="button"
                    onClick={() => shareOnSocialMedia('facebook', liveClassData.meetingLink, liveClassData.title)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Facebook
                  </button>
                  <button
                    type="button"
                    onClick={() => shareOnSocialMedia('linkedin', liveClassData.meetingLink, liveClassData.title)}
                    className="flex-1 px-3 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition flex items-center justify-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    LinkedIn
                  </button>
                  <button
                    type="button"
                    onClick={() => shareOnSocialMedia('whatsapp', liveClassData.meetingLink, liveClassData.title)}
                    className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Link Expiration</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={liveClassData.expiresAfterClass}
                      onChange={(e) => setLiveClassData({...liveClassData, expiresAfterClass: e.target.checked})}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Expire link immediately after class</span>
                  </label>
                </div>
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  ⏰ When enabled, the meeting link will expire immediately after the class ends
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
                <textarea
                  value={liveClassData.description}
                  onChange={(e) => setLiveClassData({...liveClassData, description: e.target.value})}
                  placeholder="Briefly describe what the class is about..."
                  rows="3"
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition-all ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                  }`}
                />
              </div>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
              <button
                onClick={() => setShowLiveClassModal(false)}
                className={`flex-1 py-2 rounded-lg font-semibold transition ${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSendBulkMessage(true)}
                disabled={isSending || !liveClassData.title || !liveClassData.meetingLink}
                className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSending ? "Creating..." : <><Video className="w-4 h-4" /> Create Class</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {showWhiteboard && <Whiteboard darkMode={darkMode} isInstructor={true} roomId={`class-${selectedStudents[0] || 'general'}`} onClose={() => setShowWhiteboard(false)} />}
      {showLiveCode && <LiveCodeSession darkMode={darkMode} isInstructor={true} roomId={`code-${selectedStudents[0] || 'general'}`} onClose={() => setShowLiveCode(false)} />}
    </div>
  );
};

export default InstructorStudents;