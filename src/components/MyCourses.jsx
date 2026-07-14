import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Clock, Users, Star, Plus, Search,
  Grid3x3, List, ChevronDown, Edit2, Trash2,
  Eye, MoreVertical, Copy, Archive, FileText,
  Loader2, AlertCircle, CheckCircle, XCircle,
  TrendingUp, Award, Calendar, Filter
} from 'lucide-react';
import { useSelector } from 'react-redux';

const MyCourses = ({ darkMode }) => {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedTab, setSelectedTab] = useState('all');

  // Sample courses data
  const sampleCourses = [
    {
      id: 1,
      title: "Complete Web Development Bootcamp",
      description: "Become a Full-Stack Developer from Scratch",
      instructor: "You",
      rating: 4.8,
      students: 0,
      duration: "32 hours",
      level: "Beginner",
      price: 89.99,
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
      category: "Development",
      isPublished: false,
      isFeatured: false,
      createdAt: "2024-01-15",
      progress: 0
    }
  ];

  useEffect(() => {
    // Load courses from API or localStorage
    const savedCourses = localStorage.getItem('myCourses');
    if (savedCourses) {
      try {
        setCourses(JSON.parse(savedCourses));
      } catch (e) {
        setCourses(sampleCourses);
      }
    } else {
      setCourses(sampleCourses);
    }
  }, []);

  // Calculate statistics
  const stats = {
    total: courses.length,
    published: courses.filter(c => c.isPublished).length,
    drafts: courses.filter(c => !c.isPublished).length,
    totalStudents: courses.reduce((acc, c) => acc + (c.students || 0), 0)
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = selectedTab === 'all' || 
      (selectedTab === 'published' && course.isPublished) ||
      (selectedTab === 'drafts' && !course.isPublished);
    return matchesSearch && matchesTab;
  });

  const getStatusBadge = (course) => {
    if (course.isPublished) {
      return <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">Published</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full">Draft</span>;
  };

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center h-96 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className={`mt-4 text-gray-500 dark:text-gray-400`}>Loading your courses...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              My Courses
            </h1>
            <p className={`text-gray-500 dark:text-gray-400`}>
              Create and manage your courses
            </p>
          </div>
          <Link
            to="/instructor/create-course"
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create New Course
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className={`p-6 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Total Courses
                </p>
                <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.total}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Published
                </p>
                <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.published}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Drafts
                </p>
                <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.drafts}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
                <FileText className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Total Students
                </p>
                <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.totalStudents}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search your courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border-2 focus:outline-none focus:border-indigo-500 transition ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            />
          </div>
          <div className="flex items-center gap-2">
            <button className={`p-2 rounded-lg border-2 ${darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'}`}>
              <Filter className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>
            <div className={`flex gap-1 p-1 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition ${
                  viewMode === 'grid' 
                    ? darkMode ? 'bg-gray-700 text-white' : 'bg-white shadow-sm text-gray-900'
                    : darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition ${
                  viewMode === 'list' 
                    ? darkMode ? 'bg-gray-700 text-white' : 'bg-white shadow-sm text-gray-900'
                    : darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 mb-6 p-1 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} w-fit`}>
          {[
            { id: 'all', label: 'All', count: stats.total },
            { id: 'published', label: 'Published', count: stats.published },
            { id: 'drafts', label: 'Drafts', count: stats.drafts }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedTab === tab.id
                  ? darkMode ? 'bg-gray-700 text-white' : 'bg-white shadow-sm text-gray-900'
                  : darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label} <span className="text-xs opacity-60">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Course List */}
        {filteredCourses.length === 0 ? (
          <div className={`text-center py-16 rounded-2xl border-2 border-dashed ${darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {searchTerm ? 'No results found' : 'No courses yet'}
            </h3>
            <p className="text-sm mt-2">
              {searchTerm ? 'Try adjusting your search' : 'Create your first course to get started'}
            </p>
            {!searchTerm && (
              <Link
                to="/instructor/create-course"
                className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Create Course
              </Link>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} darkMode={darkMode} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCourses.map((course) => (
              <CourseListItem key={course.id} course={course} darkMode={darkMode} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Course Card Component
const CourseCard = ({ course, darkMode }) => {
  return (
    <div className={`group rounded-xl overflow-hidden border-2 transition-all hover:shadow-lg ${
      darkMode 
        ? 'bg-gray-800 border-gray-700 hover:border-indigo-500' 
        : 'bg-white border-gray-100 hover:shadow-indigo-100'
    }`}>
      <div className="relative">
        <img
          src={course.image || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085'}
          alt={course.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition duration-300"
        />
        <div className="absolute top-2 right-2">
          {course.isPublished ? (
            <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
              Published
            </span>
          ) : (
            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full">
              Draft
            </span>
          )}
        </div>
      </div>
      <div className="p-4">
        <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} line-clamp-2 mb-2`}>
          {course.title}
        </h3>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} line-clamp-2 mb-3`}>
          {course.description || 'No description'}
        </p>
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{course.students || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{course.duration || 'N/A'}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            ${course.price || 0}
          </span>
          <div className="flex gap-2">
            <button className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
              <Edit2 className="w-4 h-4 text-blue-500" />
            </button>
            <button className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Course List Item Component
const CourseListItem = ({ course, darkMode }) => {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:shadow-lg ${
      darkMode 
        ? 'bg-gray-800 border-gray-700 hover:border-indigo-500' 
        : 'bg-white border-gray-100 hover:shadow-indigo-100'
    }`}>
      <img
        src={course.image || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085'}
        alt={course.title}
        className="w-32 h-24 object-cover rounded-lg"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {course.title}
          </h3>
          {course.isPublished ? (
            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
              Published
            </span>
          ) : (
            <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full">
              Draft
            </span>
          )}
        </div>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} line-clamp-1`}>
          {course.description || 'No description'}
        </p>
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
          <span>${course.price || 0}</span>
          <span>{course.students || 0} students</span>
          <span>{course.duration || 'N/A'}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
          <Edit2 className="w-4 h-4 text-blue-500" />
        </button>
        <button className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
          <Eye className="w-4 h-4 text-indigo-500" />
        </button>
        <button className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      </div>
    </div>
  );
};

export default MyCourses;
