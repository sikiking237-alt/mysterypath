import React, { useState, useEffect } from "react";
import { 
  ArrowUpDown,
  UserPlus, Send, Copy, Check, Trash2, Shield, User, 
  X, Search, RefreshCw, Award, Mail, Calendar
} from "lucide-react";
import { apiEndpoints, getAuthHeaders, apiCall } from "../../config/apiConfig";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
 
const ManageUsers = ({ darkMode }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: 'created_at',
    direction: 'desc'
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    role: "user" 
  });
  const [inviteData, setInviteData] = useState({
    email: "",
    role: "user",
    link: ""
  });
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    instructors: 0,
    admins: 0
  });

  // Only show roles that have values > 0
  const roleDistributionData = [
    { name: 'Students', value: stats.students || 0 },
    { name: 'Instructors', value: stats.instructors || 0 },
    { name: 'Admins', value: stats.admins || 0 },
  ].filter(entry => entry.value > 0);

  const COLORS = {
    Students: '#22c55e',
    Instructors: '#a855f7',
    Admins: '#ef4444',
  };

  const RADIAN = Math.PI / 180;

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, selectedRole, limit, sortConfig]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Build URL with query parameters
      const params = new URLSearchParams({
        page: currentPage,
        limit: limit,
        search: searchTerm,
        role: selectedRole,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction
      });
      
      const url = `${apiEndpoints.admin.users}?${params.toString()}`;

      const response = await apiCall(url, {
        method: "GET",
      });

      if (response && response.success) {
        setUsers(response.users || []);
        
        const usersList = response.users || [];
        setStats({
          total: response.total || usersList.length,
          students: usersList.filter(u => u.role === 'user').length,
          instructors: usersList.filter(u => u.role === 'instructor').length,
          admins: usersList.filter(u => u.role === 'admin').length,
        });
      } else if (response && !response.error) {
        // Fallback: if response is an array
        setUsers(Array.isArray(response) ? response : []);
      } else {
        console.error("Failed to fetch users:", response?.error || "Unknown error");
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortableHeader = ({ children, sortKey }) => (
    <button 
      onClick={() => handleSort(sortKey)} 
      className="flex items-center gap-1.5 group hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
    >
      {children} 
      <ArrowUpDown size={12} className={`transition-opacity ${sortConfig.key === sortKey ? 'opacity-100 text-purple-600' : 'opacity-50 group-hover:opacity-100'}`} />
    </button>
  );

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      alert("Please fill in all required fields.");
      return;
    }
    
    if (formData.password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    
    try {
      const response = await apiCall(apiEndpoints.admin.users, {
        method: "POST",
        body: formData,
      });
      
      if (!response.error) {
        setFormData({ name: "", email: "", password: "", role: "user" });
        setShowAddModal(false);
        fetchUsers();
      }
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Failed to add user. Please try again.");
    }
  };

  const generateInviteLink = async (e) => {
    e.preventDefault();
    
    if (!inviteData.email) {
      alert("Please enter an email address.");
      return;
    }
    
    try {
      const response = await apiCall(apiEndpoints.admin.invite, {
        method: "POST",
        body: { 
          email: inviteData.email, 
          role: inviteData.role 
        },
      });

      if (!response.error && response.success) {
        setInviteData({ 
          ...inviteData, 
          link: response.invite_link || response.link 
        });
      } else {
        alert(response.error || "Failed to generate invite link.");
      }
    } catch (error) {
      console.error("Error generating invite:", error);
      alert("Failed to generate invite link. Please try again.");
    }
  };

  const updateUserRole = async (userId, newRole) => {
    const user = users.find(u => u.id === userId);
    if (!window.confirm(`Are you sure you want to change the role of "${user?.name}" to "${newRole}"?`)) return;

    try {
      const response = await apiCall(`${apiEndpoints.admin.users}/${userId}/role`, {
        method: "PUT",
        body: { role: newRole },
      });
      
      if (!response.error) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update role. Please try again.");
    }
  };

  const deleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) return;
    
    try {
      const response = await apiCall(`${apiEndpoints.admin.users}/${userId}`, {
        method: "DELETE",
      });

      if (!response.error) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user. Please try again.");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteData.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRoleBadgeClass = (role) => {
    const styles = {
      admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      instructor: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      user: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    };
    return styles[role] || styles.user;
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
          <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent === 0) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central" 
        fontSize={12} 
        fontWeight="bold"
      >
        {(percent * 100).toFixed(0)}%
      </text>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            User Management
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Manage users, assign roles, and send invitations
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setInviteData({ email: "", role: "user", link: "" });
              setShowInviteModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Send size={16} /> Invite User
          </button>
          <button
            onClick={() => {
              setFormData({ name: "", email: "", password: "", role: "user" });
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
          >
            <UserPlus size={16} /> Add User
          </button>
          <button
            onClick={fetchUsers}
            className={`p-2 rounded-lg border ${darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'}`}
            title="Refresh"
          >
            <RefreshCw size={18} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1 grid grid-cols-2 gap-4">
          <StatCard title="Total Users" value={stats.total} icon={User} color="bg-blue-500" />
          <StatCard title="Students" value={stats.students} icon={User} color="bg-green-500" />
          <StatCard title="Instructors" value={stats.instructors} icon={Award} color="bg-purple-500" />
          <StatCard title="Admins" value={stats.admins} icon={Shield} color="bg-red-500" />
        </div>
        <div className={`lg:col-span-2 p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className={`text-sm font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Role Distribution</h3>
          <div style={{ width: '100%', height: 180 }}>
            {roleDistributionData.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={roleDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {roleDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#8884d8'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: darkMode ? '#1f2937' : '#fff', 
                      border: '1px solid #ccc', 
                      borderRadius: '8px' 
                    }} 
                  />
                  <Legend 
                    iconSize={10} 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    formatter={(value) => (
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className={`flex items-center justify-center h-full ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                No data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} size={16} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={handleSearchChange}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                : 'bg-white border-gray-200'
            }`}
          />
        </div>
        <select
          value={selectedRole}
          onChange={(e) => {
            setSelectedRole(e.target.value);
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
            darkMode 
              ? 'bg-gray-800 border-gray-700 text-white' 
              : 'bg-white border-gray-200'
          }`}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admins</option>
          <option value="instructor">Instructors</option>
          <option value="user">Students</option>
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <div className={`rounded-xl overflow-hidden border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <SortableHeader sortKey="name">User</SortableHeader>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <SortableHeader sortKey="created_at">Joined</SortableHeader>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">XP</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {users.map((user) => (
                  <tr key={user.id} className={`${darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} transition`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          user.role === 'admin' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                          user.role === 'instructor' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                          'bg-gradient-to-r from-green-500 to-green-600'
                        }`}>
                          {user.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {user.name || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Mail size={10} /> {user.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition ${getRoleBadgeClass(user.role)}`}
                      >
                        <option value="user">🎓 Student</option>
                        <option value="instructor">👨‍🏫 Instructor</option>
                        <option value="admin">👑 Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-gray-400" />
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <span className={`text-sm font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                          {user.xp || 0}
                        </span>
                        <span className="text-xs text-gray-500">XP</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => deleteUser(user.id, user.name)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                        title="Delete user"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {users.length === 0 && !loading && (
            <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <User size={48} className="mx-auto mb-3 opacity-30" />
              No users found
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className={`flex items-center justify-between p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className={`max-w-md w-full mx-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-2xl`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
              <div className="flex items-center gap-2">
                <UserPlus size={24} className="text-purple-600" />
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Add New User</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
                  }`}
                  required
                />
              </div>
              <div>
                <label className={`block text-xs font-bold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Email Address</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
                  }`}
                  required
                />
              </div>
              <div>
                <label className={`block text-xs font-bold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Password</label>
                <input
                  type="password"
                  placeholder="••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
                  }`}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
              </div>
              <div>
                <label className={`block text-xs font-bold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <option value="user">🎓 Student</option>
                  <option value="instructor">👨‍🏫 Instructor</option>
                  <option value="admin">👑 Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowInviteModal(false)}>
          <div className={`max-w-md w-full mx-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-2xl`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Send size={24} className="text-blue-600" />
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Invite User</h2>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={generateInviteLink} className="p-6 space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Email Address</label>
                <input
                  type="email"
                  placeholder="invite@example.com"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
                  }`}
                  required
                />
              </div>
              <div>
                <label className={`block text-xs font-bold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Assign Role</label>
                <select
                  value={inviteData.role}
                  onChange={(e) => setInviteData({...inviteData, role: e.target.value})}
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <option value="user">🎓 Student</option>
                  <option value="instructor">👨‍🏫 Instructor</option>
                  <option value="admin">👑 Admin</option>
                </select>
              </div>
              <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2">
                <Send size={16} /> Generate Invite Link
              </button>
            </form>
            
            {inviteData.link && (
              <div className="px-6 pb-6">
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <p className="text-xs font-bold text-gray-500 mb-2">INVITE LINK:</p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={inviteData.link}
                      className="flex-1 bg-transparent text-xs truncate focus:outline-none"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded transition"
                    >
                      {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Share this link with the user. They will be able to sign up and automatically receive the selected role.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;