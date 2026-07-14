import React, { useState, useEffect } from 'react';
import { apiEndpoints, getAuthHeaders } from "../../config/apiConfig";

const ManageInstructors = ({ darkMode }) => {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null); // null, 'add', 'invite', 'link'
  const [generatedLink, setGeneratedLink] = useState('');
  const [generatedRole, setGeneratedRole] = useState('');
  const [newInstructor, setNewInstructor] = useState({
    name: '',
    email: '',
    password: '',
    bio: ''
  });
  const [inviteData, setInviteData] = useState({
    role: 'instructor',
    email: '',
    name: ''
  });
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadInstructors();
  }, []);

  const loadInstructors = async () => {
    console.log('🔄 Loading instructors...');
    setLoading(true);
    
    try {
      const response = await fetch(apiEndpoints.admin.instructors, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      
      const data = await response.json();
      console.log('📥 API Response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP error! Status: ${response.status}`);
      }
      
      if (data.success) {
        // ✅ Handle both response formats
        const instructorsData = data.instructors || [];
        console.log(`✅ Loaded ${instructorsData.length} instructors`);
        setInstructors(instructorsData);
      } else if (Array.isArray(data)) {
        // If API returns array directly
        console.log(`✅ Loaded ${data.length} instructors (array format)`);
        setInstructors(data);
      } else {
        console.warn('⚠️ Unexpected response format:', data);
        setInstructors([]);
        showNotification('Received unexpected data format from server.', 'error');
      }
    } catch (error) {
      console.error('❌ Error loading instructors:', error);
      showNotification(error.message || 'Failed to load instructors', 'error');
      setInstructors([]);
    } finally {
      setLoading(false);
    }
  };

  const createInstructor = async () => {
    if (!newInstructor.name || !newInstructor.email || !newInstructor.password) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    if (newInstructor.password.length < 6) {
      showNotification('Password must be at least 6 characters', 'error');
      return;
    }

    try {
      console.log('📝 Creating instructor:', newInstructor);
      
      const response = await fetch(apiEndpoints.admin.createInstructor, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(newInstructor),
      });
      
      const data = await response.json();
      console.log('📥 Create response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to create instructor');
      }

      showNotification('Instructor created successfully!', 'success');
      setActiveModal(null);
      setNewInstructor({ name: '', email: '', password: '', bio: '' });
      await loadInstructors(); // Refresh the list
    } catch (error) {
      console.error('❌ Error creating instructor:', error);
      showNotification(error.message || 'Error creating instructor', 'error');
    }
  };

  const deleteInstructor = async (instructorId, instructorName) => {
    if (!window.confirm(`Are you sure you want to delete instructor "${instructorName}"?`)) return;

    try {
      console.log(`🗑️ Deleting instructor ${instructorId}: ${instructorName}`);
      
      const response = await fetch(`${apiEndpoints.admin.instructors}/${instructorId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      console.log('📥 Delete response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to delete instructor');
      }

      showNotification('Instructor deleted successfully', 'success');
      await loadInstructors(); // Refresh the list
    } catch (error) {
      console.error('❌ Error deleting instructor:', error);
      showNotification(error.message || 'Error deleting instructor', 'error');
    }
  };

  const sendInvitation = async () => {
    if (!inviteData.email) {
      showNotification('Please enter an email address.', 'error');
      return;
    }

    try {
      const response = await fetch(apiEndpoints.admin.invite, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ 
          role: inviteData.role, 
          email: inviteData.email,
          name: inviteData.name 
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to send invitation');
      }

      if (data.email_sent) {
        showNotification(`Invitation successfully sent to ${inviteData.email}!`, 'success');
        setActiveModal(null);
      } else {
        showNotification(`Invitation for ${inviteData.email} created, but the email could not be sent. You can copy the link below.`, 'warning');
        setGeneratedLink(data.invite_link);
        setGeneratedRole(data.role);
        setActiveModal('link'); // Fallback to showing the link
      }
    } catch (error) {
      console.error('❌ Error sending invitation:', error);
      showNotification(error.message || 'Error sending invitation', 'error');
    }
  };

  const shareOnWhatsApp = () => {
    const message = encodeURIComponent(`🎓 Join MysteryPath as an INSTRUCTOR!\n\nClick this link to register: ${generatedLink}\n\nThis invitation expires in 7 days.`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const shareOnTelegram = () => {
    const text = encodeURIComponent(`Join MysteryPath as an INSTRUCTOR!`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(generatedLink)}&text=${text}`, '_blank');
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent(`Join MysteryPath as an INSTRUCTOR! Register here:`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(generatedLink)}`, '_blank');
  };

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(generatedLink)}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(generatedLink)}`, '_blank');
  };

  const shareOnGmail = () => {
    const subject = encodeURIComponent(`Invitation to join MysteryPath as INSTRUCTOR`);
    const body = encodeURIComponent(`Hello,\n\nYou have been invited to join MysteryPath as an INSTRUCTOR.\n\nClick the link below to complete your registration:\n\n${generatedLink}\n\nThis invitation expires in 7 days.\n\nBest regards,\nMysteryPath Team`);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, '_blank');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    showNotification('Invitation link copied to clipboard!', 'success');
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const roleInfo = {
    admin: { badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: '👑' },
    instructor: { badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: '👨‍🏫' },
    moderator: { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: '🛡️' },
    user: { badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: '🎓' },
  };

  const getRoleBadge = (role) => {
    return roleInfo[role]?.badge || roleInfo.user.badge;
  };

  const getRoleIcon = (role) => {
    return roleInfo[role]?.icon || roleInfo.user.icon;
  };

  const stats = {
    total: instructors.length,
    totalCourses: 0,
    totalStudents: 0
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      {notification && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${
          notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Invitation Link Modal */}
      {activeModal === 'link' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 max-w-lg w-full ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>🔗 Invitation Link Generated</h2>
              <button onClick={() => setActiveModal(null)} className="text-gray-500 text-xl">✕</button>
            </div>
            
            <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
              <p className="text-sm">
                <span className="font-semibold">🎯 Role:</span> 
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getRoleBadge(generatedRole)}`}>
                  {getRoleIcon(generatedRole)} {generatedRole.toUpperCase()}
                </span>
              </p>
            </div>
            
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} mb-4 break-all`}>
              <code className="text-xs">{generatedLink}</code>
            </div>
            
            <p className="text-xs text-gray-500 mb-4">
              ⚠️ This link will expire in 7 days.
            </p>

            <button
              onClick={copyToClipboard}
              className="w-full mb-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2"
            >
              📋 Copy Link
            </button>

            <div className="border-t border-gray-200 dark:border-gray-700 my-4 pt-4">
              <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Share via Social Media:</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <button onClick={shareOnWhatsApp} className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-green-500 hover:bg-green-600 text-white transition">
                  📱 WhatsApp
                </button>
                <button onClick={shareOnTelegram} className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition">
                  ✈️ Telegram
                </button>
                <button onClick={shareOnTwitter} className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-black hover:bg-gray-800 text-white transition">
                  🐦 Twitter
                </button>
                <button onClick={shareOnFacebook} className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition">
                  📘 Facebook
                </button>
                <button onClick={shareOnLinkedIn} className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition">
                  🔗 LinkedIn
                </button>
                <button onClick={shareOnGmail} className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-red-500 hover:bg-red-600 text-white transition">
                  📧 Gmail
                </button>
              </div>
            </div>

            <button onClick={() => setActiveModal(null)} className="w-full mt-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>👨‍🏫 Manage Instructors</h1>
        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Add instructors manually or generate invitation links to share via social media
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <div className="text-2xl mb-1">👨‍🏫</div>
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-gray-500">Total Instructors</div>
        </div>
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <div className="text-2xl mb-1">📚</div>
          <div className="text-2xl font-bold">{stats.totalCourses}</div>
          <div className="text-xs text-gray-500">Total Courses</div>
        </div>
        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <div className="text-2xl mb-1">🎓</div>
          <div className="text-2xl font-bold">{stats.totalStudents.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Total Students</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setActiveModal('add')}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition flex items-center gap-2"
        >
          <span>➕</span> Add Instructor Manually
        </button>
        <button
          onClick={() => {
            setInviteData({ email: '', name: '', role: 'instructor' }); // Reset form
            setActiveModal('invite');
          }}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:shadow-lg transition flex items-center gap-2"
        >
          <span>✉️</span> Invite User via Email
        </button>
      </div>

      {/* Instructors Table */}
      {instructors.length === 0 ? (
        <div className={`text-center py-12 rounded-xl ${darkMode ? 'bg-gray-800/40' : 'bg-gray-50'}`}>
          <div className="text-6xl mb-4">👨‍🏫</div>
          <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>No instructors found</h3>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Click "Add Instructor Manually" to create your first instructor
          </p>
          <button
            onClick={() => setActiveModal('add')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            + Add Instructor
          </button>
        </div>
      ) : (
        <div className={`rounded-xl shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Instructor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Courses</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Students</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">XP</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {instructors.map((instructor) => (
                  <tr key={instructor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                          {instructor.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="font-medium">{instructor.name || 'Unknown'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{instructor.email || 'No email'}</td>
                    <td className="px-6 py-4 text-sm">{instructor.total_courses || 0}</td>
                    <td className="px-6 py-4 text-sm">{(instructor.total_students || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm">{instructor.xp || 0}</td>
                    <td className="px-6 py-4 text-sm">
                      {instructor.created_at ? new Date(instructor.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => deleteInstructor(instructor.id, instructor.name)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Instructor Modal */}
      {activeModal === 'add' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setActiveModal(null)}>
          <div className={`rounded-2xl p-6 max-w-md w-full ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Add Instructor Manually</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Full Name *"
                value={newInstructor.name}
                onChange={(e) => setNewInstructor({...newInstructor, name: e.target.value})}
                className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:border-indigo-500 ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                }`}
              />
              <input
                type="email"
                placeholder="Email *"
                value={newInstructor.email}
                onChange={(e) => setNewInstructor({...newInstructor, email: e.target.value})}
                className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:border-indigo-500 ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                }`}
              />
              <input
                type="password"
                placeholder="Password * (min 6 characters)"
                value={newInstructor.password}
                onChange={(e) => setNewInstructor({...newInstructor, password: e.target.value})}
                className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:border-indigo-500 ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                }`}
              />
              <textarea
                placeholder="Bio (optional)"
                value={newInstructor.bio}
                onChange={(e) => setNewInstructor({...newInstructor, bio: e.target.value})}
                rows="3"
                className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:border-indigo-500 ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                }`}
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">Cancel</button>
              <button onClick={createInstructor} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create Instructor</button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Invitation Link Modal */}
      {activeModal === 'invite' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setActiveModal(null)}>
          <div className={`rounded-2xl p-6 max-w-md w-full ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">✉️ Invite New User</h3>
            <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              An invitation email will be sent directly to the user to complete their registration.
            </p>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email Address *</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:border-indigo-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Full Name (Optional)</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={inviteData.name}
                  onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:border-indigo-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Role *</label>
                <select
                  value={inviteData.role}
                  onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:border-indigo-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`}
                >
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                  <option value="user">Student</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                Cancel
              </button>
              <button onClick={sendInvitation} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageInstructors;