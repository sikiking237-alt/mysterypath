// frontend/src/components/ActivityLog.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  User,
  BookOpen,
  Settings,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Bell,
  BellOff
} from 'lucide-react';
import { io } from 'socket.io-client';
import createSocket from '../utils/socketClient';

const ActivityLog = ({ darkMode }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedLog, setSelectedLog] = useState(null);
  const [newLogsCount, setNewLogsCount] = useState(0);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  
  const socketRef = useRef(null);
  const logsEndRef = useRef(null);
  const notificationSound = useRef(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Connect to the backend Socket.IO endpoint via the dev server proxy
    socketRef.current = createSocket({
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketRef.current.on('connect', () => {
      console.log('🟢 Activity Log connected to socket');
      socketRef.current.emit('join-activity-room');
    });

    socketRef.current.on('new-activity', (newLog) => {
      console.log('🔔 New activity received:', newLog);
      handleNewActivity(newLog);
    });

    socketRef.current.on('disconnect', () => {
      console.log('🔴 Activity Log disconnected from socket');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      // Fallback to polling
      setIsLive(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchLogs();
  }, [currentPage, filterStatus, filterType, searchTerm]);

  // Auto-refresh every 30 seconds as fallback
  useEffect(() => {
    if (!isLive) {
      const interval = setInterval(() => {
        fetchLogs(true);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isLive]);

  const handleNewActivity = (newLog) => {
    // Add to beginning of logs array
    setLogs(prev => [newLog, ...prev]);
    setNewLogsCount(prev => prev + 1);
    setLastUpdate(new Date());
    setTotalItems(prev => prev + 1);
    
    // Play notification sound if enabled
    playNotificationSound();
    
    // Show browser notification
    if (Notification.permission === 'granted' && document.hidden) {
      new Notification('New Activity!', {
        body: `${newLog.user} - ${newLog.action}`,
        icon: '/favicon.ico',
      });
    }
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (error) {
      // Silent fail if audio can't play
    }
  };

  const fetchLogs = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        status: filterStatus,
        type: filterType,
        startDate: dateRange.start,
        endDate: dateRange.end,
      });

      const response = await fetch(`/api/admin/activity?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }

      const data = await response.json();
      
      if (data.logs) {
        setLogs(data.logs);
        setTotalItems(data.total || data.logs.length);
        setLastUpdate(new Date());
      } else {
        // Fallback to sample data if API not ready
        setLogs(generateSampleLogs());
        setTotalItems(generateSampleLogs().length);
      }
      
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError(error.message);
      
      // Fallback to sample data
      setLogs(generateSampleLogs());
      setTotalItems(generateSampleLogs().length);
    } finally {
      setLoading(false);
    }
  };

  const generateSampleLogs = () => {
    const actions = [
      { user: "John Student", action: "Enrolled in Web Development", status: "success", type: "enrollment" },
      { user: "Sarah Johnson", action: "Created new course", status: "success", type: "course" },
      { user: "Admin User", action: "Updated user role", status: "info", type: "user" },
      { user: "John Student", action: "Completed UI/UX course", status: "success", type: "completion" },
      { user: "Michael Chen", action: "Failed quiz attempt", status: "warning", type: "quiz" },
    ];
    
    return actions.map((action, index) => ({
      id: Date.now() + index,
      ...action,
      email: `${action.user.toLowerCase().replace(' ', '.')}@example.com`,
      time: `${index + 1} ${index === 0 ? 'minute' : 'minutes'} ago`,
      timestamp: new Date(Date.now() - (index * 60000)).toISOString(),
      details: `${action.action} - Additional details here`,
      ip: `192.168.1.${index + 1}`
    }));
  };

  const handleRefresh = () => {
    fetchLogs(false);
    setNewLogsCount(0);
  };

  const getStatusBadge = (status) => {
    const badges = {
      success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
      warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
      error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
      info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800"
    };
    return badges[status] || badges.info;
  };

  const getTypeIcon = (type) => {
    const icons = {
      enrollment: <BookOpen className="w-4 h-4" />,
      course: <BookOpen className="w-4 h-4" />,
      user: <User className="w-4 h-4" />,
      completion: <Award className="w-4 h-4" />,
      quiz: <AlertCircle className="w-4 h-4" />,
      settings: <Settings className="w-4 h-4" />,
    };
    return icons[type] || <Activity className="w-4 h-4" />;
  };

  const getStatusIcon = (status) => {
    const icons = {
      success: <CheckCircle className="w-4 h-4" />,
      warning: <AlertCircle className="w-4 h-4" />,
      error: <XCircle className="w-4 h-4" />,
      info: <Clock className="w-4 h-4" />,
    };
    return icons[status] || <Activity className="w-4 h-4" />;
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const exportCSV = () => {
    const headers = ['User', 'Email', 'Action', 'Status', 'Type', 'Time', 'Details'];
    const csvData = logs.map(log => [
      log.user,
      log.email,
      log.action,
      log.status,
      log.type,
      log.time,
      log.details
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className={`p-6 min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Activity Log
            </h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Track all platform activities and user actions
            </p>
          </div>
          {newLogsCount > 0 && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium animate-pulse ${
              darkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700'
            }`}>
              {newLogsCount} new {newLogsCount === 1 ? 'activity' : 'activities'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Live Status */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`p-2 rounded-lg border transition ${
                isLive
                  ? darkMode ? 'border-green-500 bg-green-900/20 text-green-400' : 'border-green-500 bg-green-50 text-green-600'
                  : darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              {isLive ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </button>
            <span className={`text-xs font-medium ${isLive ? 'text-green-500' : 'text-gray-400'}`}>
              {isLive ? 'Live' : 'Paused'}
            </span>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={loading}
            className={`p-2 rounded-lg border transition ${
              darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={exportCSV}
            className={`px-4 py-2 rounded-lg border transition flex items-center gap-2 ${
              darkMode ? 'border-gray-700 hover:bg-gray-800 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
            }`}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Last Update */}
      {lastUpdate && (
        <div className={`text-xs mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Last updated: {lastUpdate.toLocaleTimeString()}
          {isLive && ' (Live)'}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className={`mb-4 p-3 rounded-lg border ${darkMode ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
            <button
              onClick={() => fetchLogs()}
              className={`ml-auto text-sm font-medium ${darkMode ? 'hover:text-red-200' : 'hover:text-red-900'}`}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={`p-4 rounded-xl mb-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search users, actions, emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
              }`}
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="info">Info</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <option value="all">All Types</option>
            <option value="enrollment">Enrollment</option>
            <option value="course">Course</option>
            <option value="user">User</option>
            <option value="completion">Completion</option>
            <option value="quiz">Quiz</option>
            <option value="settings">Settings</option>
          </select>

          {(searchTerm || filterStatus !== 'all' || filterType !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterType('all');
              }}
              className={`px-4 py-2 rounded-lg transition ${
                darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className={`rounded-xl overflow-hidden border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        {loading ? (
          <div className={`p-12 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <Activity className="w-8 h-8 mx-auto mb-3 animate-spin" />
            <p>Loading activity logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className={`p-12 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No logs found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {logs.map((log, index) => (
                  <tr 
                    key={log.id || index} 
                    className={`transition ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} ${index < newLogsCount ? 'animate-highlight' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {log.user}
                        </div>
                        <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {log.email}
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {log.action}
                      {log.details && (
                        <div className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {log.details}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                        darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {getTypeIcon(log.type)}
                        {log.type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {log.time}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadge(log.status)}`}>
                        {getStatusIcon(log.status)}
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className={`text-xs font-medium transition ${
                          darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-800'
                        }`}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg border transition ${
                currentPage === 1
                  ? 'opacity-50 cursor-not-allowed'
                  : darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className={`px-4 py-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg border transition ${
                currentPage === totalPages
                  ? 'opacity-50 cursor-not-allowed'
                  : darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedLog(null)}>
          <div 
            className={`max-w-md w-full rounded-2xl shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-6`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Log Details
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className={`p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700`}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className={`text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>User</p>
                <p className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedLog.user}</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{selectedLog.email}</p>
              </div>
              
              <div>
                <p className={`text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Action</p>
                <p className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedLog.action}</p>
              </div>
              
              {selectedLog.details && (
                <div>
                  <p className={`text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Details</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{selectedLog.details}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className={`text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border ${getStatusBadge(selectedLog.status)}`}>
                    {getStatusIcon(selectedLog.status)}
                    {selectedLog.status}
                  </span>
                </div>
                <div>
                  <p className={`text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Time</p>
                  <p className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedLog.time}</p>
                </div>
              </div>
              
              {selectedLog.ip && (
                <div>
                  <p className={`text-xs font-medium uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>IP Address</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{selectedLog.ip}</p>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setSelectedLog(null)}
              className="w-full mt-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* CSS Animation for new logs */}
      <style>{`
        @keyframes highlight {
          0% { background-color: rgba(139, 92, 246, 0.3); }
          100% { background-color: transparent; }
        }
        .animate-highlight {
          animation: highlight 3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ActivityLog;