import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const InstructorAnalytics = ({ darkMode }) => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalRevenue: 0,
    averageRating: 0
  });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        const [statsRes, chartRes] = await Promise.all([
          fetch('/api/instructor/stats', { headers }),
          fetch('/api/instructor/chart-data', { headers })
        ]);

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats({
            totalStudents: data.total_students || 0,
            totalCourses: data.total_courses || 0,
            totalRevenue: data.total_revenue || 0,
            averageRating: data.average_rating || 0,
          });
        }

        if (chartRes.ok) {
          const data = await chartRes.json();
          setChartData(data.monthlyGrowth || []);
        } else {
          // Fallback for chart data
          setChartData([
            { month: '2024-01', students: 45, revenue: 2205 },
            { month: '2024-02', students: 62, revenue: 3038 },
            { month: '2024-03', students: 89, revenue: 4361 },
          ]);
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalyticsData();
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
        {/* ... stats display ... */}
      </div>

      <div className={`rounded-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Monthly Performance</h2>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tickFormatter={(str) => new Date(str).toLocaleString('en-us', { month: 'short' })} />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4A5568' : '#E2E8F0'} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: darkMode ? '#2D3748' : '#FFFFFF',
                  borderColor: darkMode ? '#4A5568' : '#E2E8F0'
                }}
                formatter={(value, name) => name === 'revenue' ? `$${value.toLocaleString()}` : value}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#8884d8" 
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default InstructorAnalytics;