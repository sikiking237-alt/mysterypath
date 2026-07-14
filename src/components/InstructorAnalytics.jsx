import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
} from "recharts";
import { BookOpen, Users, DollarSign, Target } from "lucide-react";
import { apiCall, apiEndpoints } from "../config/apiConfig";

const formatMonth = (value) => {
  if (!value) return "-";
  const [year, month] = value.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString("en-US", { month: "short", year: "2-digit" });
};

const MetricCard = ({ darkMode, icon: Icon, label, value, helper }) => (
  <div
    className={`p-6 rounded-2xl border ${
      darkMode ? "bg-gray-800/40 border-gray-700" : "bg-white border-gray-100 shadow-sm"
    }`}
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</p>
        <div className={`mt-3 text-3xl font-black ${darkMode ? "text-white" : "text-gray-900"}`}>{value}</div>
        <p className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{helper}</p>
      </div>
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-lg">
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </div>
);

const InstructorAnalytics = ({ darkMode }) => {
  const [stats, setStats] = useState({
    total_courses: 0,
    total_students: 0,
    total_revenue: 0,
    avg_completion_rate: 0,
  });
  const [chartData, setChartData] = useState({
    monthlyTrends: [],
    coursePerformance: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      setError("");

      try {
        const [statsResponse, chartResponse] = await Promise.all([
          apiCall(apiEndpoints.instructor.stats, { method: "GET" }),
          apiCall(apiEndpoints.instructor.chartData, { method: "GET" }),
        ]);

        if (statsResponse.error) {
          setError(statsResponse.error);
        } else {
          setStats(statsResponse);
        }

        if (chartResponse.error) {
          setError(chartResponse.error);
        } else {
          setChartData(chartResponse);
        }
      } catch (err) {
        setError("Failed to load instructor analytics");
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const monthlyTrends = useMemo(
    () =>
      (chartData.monthlyTrends || []).map((item) => ({
        ...item,
        label: formatMonth(item.month),
      })),
    [chartData.monthlyTrends],
  );

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
          <p className={`mt-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div>
        <div className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase tracking-widest border border-blue-200 dark:border-blue-800 w-fit mb-3">
          Performance
        </div>
        <h1 className={`text-4xl font-black tracking-tight ${darkMode ? "text-white" : "text-gray-900"}`}>
          Instructor analytics
        </h1>
        <p className={`text-base mt-2 max-w-2xl ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          Professional insights driven by your actual courses, student enrollments, completion progress, and revenue.
        </p>
        {error && <p className="mt-3 text-sm text-red-500 font-medium">{error}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricCard darkMode={darkMode} icon={BookOpen} label="Courses" value={stats.total_courses} helper="Published courses under your account" />
        <MetricCard darkMode={darkMode} icon={Users} label="Students" value={stats.total_students} helper="Distinct learners enrolled in your content" />
        <MetricCard darkMode={darkMode} icon={DollarSign} label="Revenue" value={`$${(stats.total_revenue || 0).toLocaleString()}`} helper="Revenue from paid enrollments" />
        <MetricCard darkMode={darkMode} icon={Target} label="Avg completion" value={`${stats.avg_completion_rate || 0}%`} helper="Average progress across all enrollments" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className={`xl:col-span-2 h-[360px] rounded-3xl border p-6 ${darkMode ? "bg-gray-800/40 border-gray-700" : "bg-white border-gray-200 shadow-sm"}`}>
          <h3 className={`text-sm font-black uppercase tracking-widest mb-6 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Enrollment and revenue trend
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyTrends}>
              <defs>
                <linearGradient id="instructorRevenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#374151" : "#e5e7eb"} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: darkMode ? "#9ca3af" : "#6b7280", fontSize: 12 }} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: darkMode ? "#9ca3af" : "#6b7280", fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: darkMode ? "#9ca3af" : "#6b7280", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: darkMode ? "#111827" : "#ffffff",
                  border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
                  borderRadius: 16,
                }}
              />
              <Bar yAxisId="left" dataKey="enrollments" fill="#06b6d4" radius={[8, 8, 0, 0]} />
              <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fill="url(#instructorRevenueFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={`h-[360px] rounded-3xl border p-6 ${darkMode ? "bg-gray-800/40 border-gray-700" : "bg-white border-gray-200 shadow-sm"}`}>
          <h3 className={`text-sm font-black uppercase tracking-widest mb-6 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Completion by course
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.coursePerformance || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#374151" : "#e5e7eb"} />
              <XAxis dataKey="title" hide />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: darkMode ? "#9ca3af" : "#6b7280", fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [`${value}%`, "Completion"]}
                contentStyle={{
                  background: darkMode ? "#111827" : "#ffffff",
                  border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
                  borderRadius: 16,
                }}
              />
              <Line type="monotone" dataKey="completion_rate" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={`rounded-3xl border p-6 ${darkMode ? "bg-gray-800/40 border-gray-700" : "bg-white border-gray-200 shadow-sm"}`}>
        <div className="mb-6">
          <h3 className={`text-sm font-black uppercase tracking-widest ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Course performance snapshot
          </h3>
        </div>
        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.coursePerformance || []} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#374151" : "#e5e7eb"} />
              <XAxis dataKey="title" tickLine={false} axisLine={false} tick={{ fill: darkMode ? "#9ca3af" : "#6b7280", fontSize: 12 }} interval={0} angle={-12} textAnchor="end" height={70} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: darkMode ? "#9ca3af" : "#6b7280", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: darkMode ? "#111827" : "#ffffff",
                  border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
                  borderRadius: 16,
                }}
              />
              <Bar dataKey="enrollments" name="Enrollments" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default InstructorAnalytics;
