import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, Filter, Grid3x3, List, ChevronDown,
  BookOpen, Clock, Users, Star, Heart, 
  Loader2, AlertCircle, Plus
} from 'lucide-react';
import { useSelector } from 'react-redux';

const CoursesPage = ({ darkMode }) => {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [wishlist, setWishlist] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('course_wishlist');
    if (saved) {
      try {
        setWishlist(JSON.parse(saved));
      } catch {
        setWishlist([]);
      }
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const fetchEnrolled = async () => {
      try {
        const res = await fetch('/api/my-learning', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setEnrolledCourseIds(Array.isArray(data) ? data.map((c) => c.id) : []);
        }
      } catch (e) {
        console.error('Failed to load enrolled courses', e);
      }
    };
    fetchEnrolled();
  }, []);

  const addToWishlist = (course) => {
    setWishlist((prev) => {
      const updated = prev.some((w) => w.id === course.id) ? prev.filter((w) => w.id !== course.id) : [...prev, course];
      localStorage.setItem('course_wishlist', JSON.stringify(updated));
      return updated;
    });
  };

  const isWishlisted = (courseId) => wishlist.some((w) => w.id === courseId);

  // Sample courses data - replace with API call
  const sampleCourses = [
    {
      id: 1,
      title: "Complete Web Development Bootcamp",
      instructor: "John Doe",
      rating: 4.8,
      students: 15234,
      duration: "32 hours",
      level: "Beginner",
      price: 89.99,
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
      category: "Development",
      isFeatured: true
    },
    {
      id: 2,
      title: "Python for Data Science",
      instructor: "Jane Smith",
      rating: 4.9,
      students: 12345,
      duration: "28 hours",
      level: "Intermediate",
      price: 79.99,
      image: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935",
      category: "Data Science",
      isFeatured: false
    },
    {
      id: 3,
      title: "UI/UX Design Masterclass",
      instructor: "Bob Johnson",
      rating: 4.7,
      students: 8921,
      duration: "20 hours",
      level: "Beginner",
      price: 69.99,
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5",
      category: "Design",
      isFeatured: false
    },
    {
      id: 4,
      title: "Cloud Computing with AWS",
      instructor: "Alice Williams",
      rating: 4.6,
      students: 7432,
      duration: "35 hours",
      level: "Advanced",
      price: 99.99,
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa",
      category: "Cloud",
      isFeatured: true
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setCourses(sampleCourses);
      setLoading(false);
    }, 1000);
  }, []);

  const categories = ['All', 'Development', 'Data Science', 'Design', 'Cloud', 'Marketing', 'Business'];
  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    const matchesLevel = selectedLevel === 'All' || course.level === selectedLevel;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center h-96 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className={`mt-4 text-gray-500 dark:text-gray-400`}>Loading courses...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Explore Courses
            </h1>
            <p className={`text-gray-500 dark:text-gray-400`}>
              Discover new skills and advance your career
            </p>
          </div>
          <Link
            to="/instructor-courses"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Course
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border-2 focus:outline-none focus:border-indigo-500 ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-indigo-500 ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className={`px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-indigo-500 ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              {levels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
            <div className="flex gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition ${
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-gray-700 shadow-sm' 
                    : 'text-gray-500'
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition ${
                  viewMode === 'list' 
                    ? 'bg-white dark:bg-gray-700 shadow-sm' 
                    : 'text-gray-500'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Course Grid */}
        {filteredCourses.length === 0 ? (
          <div className={`text-center py-16 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              No courses found
            </h3>
            <p className={`text-gray-500 dark:text-gray-400`}>
              Try adjusting your search or filters
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard 
                key={course.id} 
                course={course} 
                darkMode={darkMode} 
                onWishlistToggle={addToWishlist}
                isWishlisted={isWishlisted(course.id)}
                isEnrolled={enrolledCourseIds.includes(course.id)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCourses.map((course) => (
              <CourseListItem 
                key={course.id} 
                course={course} 
                darkMode={darkMode}
                onWishlistToggle={addToWishlist}
                isWishlisted={isWishlisted(course.id)}
                isEnrolled={enrolledCourseIds.includes(course.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Course Card Component
const CourseCard = ({ course, darkMode, onWishlistToggle, isWishlisted, isEnrolled }) => {
  return (
    <Link to={`/course/${course.id}`}>
      <div className={`group rounded-xl overflow-hidden border-2 transition-all hover:shadow-lg ${
        darkMode 
          ? 'bg-gray-800 border-gray-700 hover:border-indigo-500' 
          : 'bg-white border-gray-100 hover:shadow-indigo-100'
      }`}>
        <div className="relative">
          <img
            src={course.image}
            alt={course.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition duration-300"
          />
          {course.isFeatured && (
            <span className="absolute top-2 right-2 px-2 py-1 text-xs font-medium bg-yellow-400 text-gray-900 rounded-full">
              Featured
            </span>
          )}
          {isEnrolled && (
            <span className="absolute top-2 left-2 px-2 py-1 text-xs font-medium bg-emerald-500 text-white rounded-full">
              Enrolled
            </span>
          )}
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onWishlistToggle && onWishlistToggle(course);
            }}
            className="absolute top-2 left-2 p-1.5 rounded-full bg-white/90 hover:bg-white transition"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-600 hover:text-red-500'}`} />
          </button>
        </div>
        <div className="p-4">
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} line-clamp-2 mb-2`}>
            {course.title}
          </h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
            By {course.instructor}
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{course.rating}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{course.students.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{course.duration}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              ${course.price}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              course.level === 'Beginner' 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                : course.level === 'Intermediate'
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            }`}>
              {course.level}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

// Course List Item Component
const CourseListItem = ({ course, darkMode, onWishlistToggle, isWishlisted, isEnrolled }) => {
  return (
    <Link to={`/course/${course.id}`}>
      <div className={`flex gap-4 p-4 rounded-xl border-2 transition-all hover:shadow-lg ${
        darkMode 
          ? 'bg-gray-800 border-gray-700 hover:border-indigo-500' 
          : 'bg-white border-gray-100 hover:shadow-indigo-100'
      }`}>
        <img
          src={course.image}
          alt={course.title}
          className="w-48 h-32 object-cover rounded-lg"
        />
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                {course.title}
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                By {course.instructor}
              </p>
            </div>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onWishlistToggle && onWishlistToggle(course);
              }}
              className="p-2 rounded-full bg-white/90 hover:bg-white transition flex-shrink-0"
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-600 hover:text-red-500'}`} />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{course.rating}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{course.students.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span>{course.level}</span>
            </div>
            {isEnrolled && (
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                Enrolled
              </span>
            )}
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              ${course.price}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CoursesPage;
