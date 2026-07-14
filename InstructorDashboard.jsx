import React, { useState, useEffect, useRef } from 'react';
import { useGetInstructorStatsQuery } from './coursesApi.js';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  TrendingUp, 
  Flame, 
  Calendar,
  Video,
  Code,  PenTool,
  Mic,
  MicOff,
  VideoOff,
  MonitorUp,
  PhoneOff,
  Bell,
  ArrowUpRight,
  CheckCircle2
} from 'lucide-react';
import { io } from 'socket.io-client';

function InstructorDashboard() {
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showLiveCode, setShowLiveCode] = useState(false);
  const [showVideoClass, setShowVideoClass] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // Use a ref to store the socket and initialize inside useEffect to prevent multiple connections
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize Socket.IO client.
    // It will connect to the same host that serves the page, and Vite's dev
    // server will proxy the /socket.io requests to the backend.
    socketRef.current = io({
      transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // Connect to backend via RTK Query
  const { data, isLoading, error } = useGetInstructorStatsQuery();

  const handleOpenWhiteboard = () => setShowWhiteboard(true);
  const handleCloseWhiteboard = () => setShowWhiteboard(false);

  const handleOpenLiveCode = () => setShowLiveCode(true);
  const handleCloseLiveCode = () => setShowLiveCode(false);

  const handleOpenVideoClass = () => setShowVideoClass(true);
  const handleCloseVideoClass = () => setShowVideoClass(false);

  const handleOpenScheduleModal = () => setShowScheduleModal(true);
  const handleCloseScheduleModal = () => setShowScheduleModal(false);

  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }

  if (error) {
    return <div>Error connecting to backend: {error.data?.message || 'Server unreachable'}</div>;
  }

  return (
    <div className={`p-6 min-h-screen ${data?.darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="animate-in fade-in slide-in-from-left duration-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[10px] font-black uppercase tracking-widest border border-purple-200 dark:border-purple-800">Instructor Portal</div>
            </div>
            <h1 className="text-4xl font-black tracking-tight">Overview</h1>
            <p className="text-gray-500 font-medium mt-1">Welcome back! Here is the latest from your digital classroom.</p>
          </div>
          <button onClick={handleOpenScheduleModal} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2">
            <Calendar size={18} /> Schedule Session
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard title="Total Courses" value={data?.total_courses || 0} icon={BookOpen} trend="+2 this month" color="bg-blue-500" darkMode={data?.darkMode} />
          <StatCard title="Total Students" value={data?.total_students || 0} icon={Users} trend="+12% growth" color="bg-purple-500" darkMode={data?.darkMode} />
          <StatCard title="Avg. Completion" value={`${data?.avg_completion_rate || 0}%`} icon={TrendingUp} trend="+5.2%" color="bg-emerald-500" darkMode={data?.darkMode} />
          <StatCard title="Active Learners" value={data?.active_learners || 0} icon={Flame} trend="Live now" color="bg-orange-500" darkMode={data?.darkMode} />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Tools Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className={`rounded-3xl p-8 border ${data?.darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black tracking-tight uppercase text-gray-400">Teaching Suite</h3>
                <div className="flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-gray-300" />
                  <div className="w-1 h-1 rounded-full bg-gray-300" />
                  <div className="w-1 h-1 rounded-full bg-gray-300" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ToolButton onClick={handleOpenWhiteboard} label="Whiteboard" icon={PenTool} description="Real-time canvas" darkMode={data?.darkMode} />
                <ToolButton onClick={handleOpenLiveCode} label="Live Code" icon={Code} description="Collaborative IDE" darkMode={data?.darkMode} />
                <ToolButton onClick={handleOpenVideoClass} label="Video Room" icon={Video} description="HD Virtual Class" darkMode={data?.darkMode} />
              </div>
            </div>
            
            {/* Recent Students Placeholder */}
            <div className={`rounded-3xl p-8 border ${data?.darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
              <h3 className="text-xl font-black tracking-tight uppercase text-gray-400 mb-6">Recent Enrollments</h3>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center font-bold text-indigo-600">S</div>
                      <div>
                        <p className="font-bold text-sm">Student Name {i}</p>
                        <p className="text-xs text-gray-500">Enrolled in Web Dev Bootcamp</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-gray-400">2H AGO</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Sidebar Area */}
          <div className="space-y-6">
             <ActivitySidebar darkMode={data?.darkMode} />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showWhiteboard && <Modal title="Interactive Whiteboard" onClose={handleCloseWhiteboard} />}
      {showLiveCode && <Modal title="Live Coding Editor" onClose={handleCloseLiveCode} />}
      {showVideoClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl">
          <div className="w-full h-full flex flex-col p-6 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 px-4">
              <div className="flex items-center gap-4">
                <div className="px-3 py-1 bg-red-500 text-white text-[10px] font-black rounded-md animate-pulse uppercase tracking-wider">Live</div>
                <h3 className="text-xl font-bold text-white">Advanced Web Development - Session 4</h3>
              </div>
              <button onClick={handleCloseVideoClass} className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full transition">✕</button>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
              {/* Video Stage */}
              <div className="flex-1 flex flex-col gap-4">
                {/* Main Speaker (The Stage) */}
                <div className="flex-1 rounded-3xl bg-gray-800 border border-gray-700 relative overflow-hidden group">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-600 italic">
                    {isVideoOff ? (
                      <div className="text-center">
                        <div className="w-24 h-24 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-500 text-4xl font-black mb-4 mx-auto">P</div>
                        <p>Camera is off</p>
                      </div>
                    ) : (
                      "Instructor Main Feed"
                    )}
                  </div>
                  {/* Professional Lower Third */}
                  <div className="absolute bottom-6 left-6 px-4 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl text-white">
                    <p className="text-sm font-bold">Prince Oduro</p>
                    <p className="text-[10px] text-gray-300 font-medium uppercase tracking-widest">Instructor (You)</p>
                  </div>
                </div>

                {/* Controls Bar */}
                <div className="h-24 flex items-center justify-center gap-4">
                  <div className="flex items-center gap-4 px-8 py-4 bg-gray-800/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                    <button 
                      onClick={() => setIsMuted(!isMuted)}
                      className={`p-3 rounded-xl transition-all ${isMuted ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                      {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                    <button 
                      onClick={() => setIsVideoOff(!isVideoOff)}
                      className={`p-3 rounded-xl transition-all ${isVideoOff ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                      {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                    </button>
                    <div className="w-px h-8 bg-white/10 mx-2" />
                    <button className="p-3 bg-white/10 text-white hover:bg-white/20 rounded-xl transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
                      <MonitorUp size={18} /> Share
                    </button>
                    <button 
                      onClick={handleCloseVideoClass}
                      className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all"
                    >
                      <PhoneOff size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Sidebar (Gallery & Chat) */}
              <div className="w-80 flex flex-col gap-4">
                {/* Student Gallery */}
                <div className="flex-1 bg-gray-800/40 border border-gray-700 rounded-3xl p-4 overflow-y-auto">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Participants (12)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="aspect-video bg-gray-800 rounded-xl border border-gray-700 relative overflow-hidden flex items-center justify-center">
                        <span className="text-gray-600 italic text-[10px]">Student {i}</span>
                        {/* Mute indicator */}
                        <div className="absolute top-2 right-2 p-1 bg-black/40 rounded text-red-500">
                          <MicOff size={10} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Chat Sidebar (Mock) */}
                <div className="h-64 bg-gray-800/40 border border-gray-700 rounded-3xl p-4 flex flex-col">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">In-Call Messages</h4>
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                    <div className="text-[10px]">
                      <span className="font-bold text-indigo-400">Student A:</span>
                      <span className="text-gray-300 ml-1">Can you explain the useEffect hook again?</span>
                    </div>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Send message..." 
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold mb-4">Schedule Class</h3>
            <p className="text-gray-500 mb-6">Create a live session for your students.</p>
            <button onClick={handleCloseScheduleModal} className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold">
              Create Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const StatCard = ({ title, value, icon: Icon, trend, color, darkMode }) => (
  <div className={`p-6 rounded-2xl border transition-all hover:shadow-md ${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color} shadow-lg shadow-${color.split('-')[1]}-500/20`}>
        <Icon size={24} className="text-white" />
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-emerald-500 text-xs font-black bg-emerald-500/10 px-2 py-1 rounded-lg">
          <ArrowUpRight size={14} />
          {trend}
        </div>
      )}
    </div>
    <div>
      <p className={`text-xs font-black uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>{title}</p>
      <h4 className={`text-3xl font-black mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</h4>
    </div>
  </div>
);

const ToolButton = ({ onClick, label, icon: Icon, description, darkMode }) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-start gap-3 p-6 rounded-2xl border transition-all group text-left ${
      darkMode 
        ? 'bg-gray-700/30 border-gray-600 hover:border-purple-500/50 hover:bg-gray-700/50' 
        : 'bg-gray-50 border-gray-100 hover:border-purple-200 hover:bg-white hover:shadow-lg'
    }`}
  >
    <div className={`p-3 rounded-xl transition-all group-hover:scale-110 ${darkMode ? 'bg-gray-700 text-purple-400' : 'bg-white text-purple-600 shadow-sm'}`}>
      <Icon size={24} />
    </div>
    <div>
      <span className={`block font-black text-sm uppercase tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{label}</span>
      <span className={`text-[10px] font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{description}</span>
    </div>
  </button>
);

const ActivitySidebar = ({ darkMode }) => (
  <div className={`rounded-3xl p-6 border ${darkMode ? 'bg-gray-800/20 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
    <div className="flex items-center gap-2 mb-6">
      <Bell className="text-purple-500" size={18} />
      <h3 className={`text-sm font-black uppercase tracking-widest ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Recent Alerts</h3>
    </div>
    <div className="space-y-6">
      {[
        { icon: CheckCircle2, text: "Course 'React 101' approved", time: "10m ago", color: "text-emerald-500" },
        { icon: Users, text: "5 students completed Lesson 4", time: "1h ago", color: "text-blue-500" },
        { icon: Bell, text: "New message from Support", time: "4h ago", color: "text-amber-500" }
      ].map((item, idx) => (
        <div key={idx} className="flex gap-4 group cursor-pointer">
          <div className="relative">
            <div className={`w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center ${item.color}`}>
              <item.icon size={16} />
            </div>
            {idx !== 2 && <div className="absolute top-10 left-4 w-px h-8 bg-gray-200 dark:bg-gray-700" />}
          </div>
          <div className="flex-1">
            <p className={`text-xs font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'} group-hover:text-purple-500 transition-colors`}>{item.text}</p>
            <p className="text-[10px] text-gray-500 font-medium mt-1">{item.time}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Modal = ({ title, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
      <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
        <h3 className="text-xl font-bold">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition">✕</button>
      </div>
      <div className="flex-1 p-8 flex items-center justify-center text-gray-400 italic">
        {title} interface loading...
      </div>
    </div>
  </div>
);

export default InstructorDashboard;