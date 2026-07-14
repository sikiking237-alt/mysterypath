import React, { useState, useEffect } from 'react';

const InstructorAnalytics = ({ darkMode }) => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalRevenue: 0,
    averageRating: 0,
    monthlyData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/instructor/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          // Demo data
          setStats({
            totalStudents: 568,
            totalCourses: 4,
            totalRevenue: 27832,
            averageRating: 4.8,
            monthlyData: [
              { month: 'Jan', students: 45, revenue: 2205 },
              { month: 'Feb', students: 62, revenue: 3038 },
              { month: 'Mar', students: 89, revenue: 4361 },
              { month: 'Apr', students: 120, revenue: 5880 },
              { month: 'May', students: 145, revenue: 7105 },
              { month: 'Jun', students: 107, revenue: 5243 }
            ]
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          📈 Course Analytics
        </h1>
        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Track your course performance and student engagement
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className={`p-5 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <div className="text-2xl mb-2">👥</div>
          <div className="text-2xl font-bold">{stats.totalStudents}</div>
          <div className="text-sm text-gray-500">Total Students</div>
        </div>
        <div className={`p-5 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <div className="text-2xl mb-2">📚</div>
          <div className="text-2xl font-bold">{stats.totalCourses}</div>
          <div className="text-sm text-gray-500">Total Courses</div>
        </div>
        <div className={`p-5 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <div className="text-2xl mb-2">💰</div>
          <div className="text-2xl font-bold text-green-600">${stats.totalRevenue}</div>
          <div className="text-sm text-gray-500">Total Revenue</div>
        </div>
        <div className={`p-5 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <div className="text-2xl mb-2">⭐</div>
          <div className="text-2xl font-bold">{stats.averageRating}</div>
          <div className="text-sm text-gray-500">Average Rating</div>
        </div>
      </div>

      <div className={`rounded-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Monthly Performance</h2>
        <div className="space-y-4">
          {stats.monthlyData.map((item, idx) => {
            const maxRevenue = Math.max(...stats.monthlyData.map(m => m.revenue));
            const percentage = (item.revenue / maxRevenue) * 100;
            return (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.month}</span>
                  <span className="font-semibold text-indigo-600">{item.students} students</span>
                </div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-end px-3 text-white text-xs font-medium" style={{ width: `${percentage}%` }}>
                    ${item.revenue}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InstructorAnalytics;