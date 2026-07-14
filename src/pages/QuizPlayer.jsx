// src/pages/CoursePlayer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import LogoutButton from '../components/LogoutButton';
import { 
  Play, Pause, Volume2, Maximize, Minimize, SkipForward, SkipBack,
  CheckCircle, XCircle, AlertCircle, Trophy, Star, Clock,
  ChevronRight, ChevronLeft, Menu, X, Settings, HelpCircle,
  BookOpen, Target, Zap, Award, Home, RefreshCw
} from 'lucide-react';

const CoursePlayer = ({ darkMode, onLogout }) => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  
  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const token = localStorage.getItem('token');
  const API_BASE = '/api';

  // Fetch course data
  useEffect(() => {
    fetchCourse();
    fetchProgress();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`${API_BASE}/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCourse(data);
        if (data.lessons && data.lessons.length > 0) {
          setCurrentLesson(data.lessons[0]);
          setCurrentLessonIndex(0);
        }
      } else {
        toast.error('Course not found');
        navigate('/my-learning');
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await fetch(`${API_BASE}/courses/${courseId}/progress`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCompletedLessons(data.completedLessons || []);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  // Video controls
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setProgress((current / total) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleLessonComplete = async () => {
    if (!currentLesson) return;
    
    try {
      const response = await fetch(`${API_BASE}/courses/${courseId}/lessons/${currentLesson.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        setCompletedLessons([...completedLessons, currentLesson.id]);
        toast.success('Lesson completed! 🎉');
        
        // Check if there's a quiz for this lesson
        if (currentLesson.quiz) {
          setShowQuiz(true);
        }
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    }
  };

  const navigateLesson = (direction) => {
    if (!course?.lessons) return;
    const newIndex = currentLessonIndex + direction;
    if (newIndex >= 0 && newIndex < course.lessons.length) {
      setCurrentLessonIndex(newIndex);
      setCurrentLesson(course.lessons[newIndex]);
      setProgress(0);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const isLessonCompleted = (lessonId) => {
    return completedLessons.includes(lessonId);
  };

  const isLessonLocked = (index) => {
    if (index === 0) return false;
    return !isLessonCompleted(course?.lessons[index - 1]?.id);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Course not found</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Top Navigation */}
      <div className={`sticky top-0 z-40 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/my-learning')}
              className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition`}
            >
              <ChevronLeft className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </button>
            <h1 className={`text-lg font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {course.title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition`}
            >
              <Menu className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </button>
            <LogoutButton
              onLogout={onLogout}
              darkMode={darkMode}
              className={`px-3 py-1.5 text-sm rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            />
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Content */}
        <div className={`flex-1 ${showSidebar ? 'lg:mr-80' : ''}`}>
          {/* Video Player */}
          <div className={`relative ${darkMode ? 'bg-black' : 'bg-gray-900'}`}>
            <video
              ref={videoRef}
              className="w-full max-h-[70vh] aspect-video"
              src={currentLesson?.videoUrl || currentLesson?.video_url}
              poster={currentLesson?.thumbnail || course?.thumbnail}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onClick={togglePlay}
              controls={false}
            >
              <source src={currentLesson?.videoUrl || currentLesson?.video_url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Custom Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="text-white hover:text-purple-400 transition"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
                
                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => {
                      if (videoRef.current) {
                        const time = (parseFloat(e.target.value) / 100) * duration;
                        videoRef.current.currentTime = time;
                      }
                    }}
                    className="w-full h-1 bg-gray-600 rounded-full appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                <span className="text-white text-sm">
                  {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
                </span>

                <button
                  onClick={toggleMute}
                  className="text-white hover:text-purple-400 transition"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="text-white hover:text-purple-400 transition"
                >
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Lesson Locked Overlay */}
            {isLessonLocked(currentLessonIndex) && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <div className="text-center text-white">
                  <Lock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-bold">Lesson Locked</h3>
                  <p className="text-gray-400 mt-2">Complete the previous lesson to unlock this one</p>
                </div>
              </div>
            )}
          </div>

          {/* Lesson Content */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {currentLesson?.title || 'No lesson selected'}
                </h2>
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Lesson {currentLessonIndex + 1} of {course?.lessons?.length || 0}
                </p>
              </div>
              {currentLesson && !isLessonLocked(currentLessonIndex) && (
                <button
                  onClick={handleLessonComplete}
                  disabled={isLessonCompleted(currentLesson.id)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    isLessonCompleted(currentLesson.id)
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {isLessonCompleted(currentLesson.id) ? (
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4" /> Completed
                    </span>
                  ) : (
                    'Mark as Complete'
                  )}
                </button>
              )}
            </div>

            <div className={`prose ${darkMode ? 'prose-invert' : ''} max-w-none`}>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {currentLesson?.description || 'No description available.'}
              </p>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t dark:border-gray-700">
              <button
                onClick={() => navigateLesson(-1)}
                disabled={currentLessonIndex === 0}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  currentLessonIndex === 0
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {currentLessonIndex + 1} / {course?.lessons?.length || 0}
              </span>

              <button
                onClick={() => navigateLesson(1)}
                disabled={currentLessonIndex === (course?.lessons?.length || 0) - 1}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  currentLessonIndex === (course?.lessons?.length || 0) - 1
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quiz Modal */}
            {showQuiz && currentLesson?.quiz && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className={`w-full max-w-2xl rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-2xl max-h-[90vh] overflow-y-auto`}>
                  <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-center">
                      <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        📝 Quiz: {currentLesson.title}
                      </h2>
                      <button
                        onClick={() => setShowQuiz(false)}
                        className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    {/* Import and use QuizPlayer here */}
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                      <p className="text-gray-600 dark:text-gray-400">
                        Quiz component would render here
                      </p>
                      <button
                        onClick={() => {
                          setQuizCompleted(true);
                          setShowQuiz(false);
                          toast.success('Quiz passed! 🎉');
                        }}
                        className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        Complete Quiz
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div
          className={`fixed right-0 top-16 bottom-0 w-80 transform transition-transform duration-300 ${
            showSidebar ? 'translate-x-0' : 'translate-x-full'
          } ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg overflow-y-auto`}
        >
          <div className="p-4 border-b dark:border-gray-700">
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Course Content
            </h3>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {completedLessons.length} of {course?.lessons?.length || 0} completed
            </p>
          </div>

          <div className="p-2 space-y-1">
            {course?.lessons?.map((lesson, index) => {
              const isCompleted = isLessonCompleted(lesson.id);
              const isLocked = isLessonLocked(index);
              const isActive = index === currentLessonIndex;

              return (
                <button
                  key={lesson.id}
                  onClick={() => {
                    if (!isLocked) {
                      setCurrentLessonIndex(index);
                      setCurrentLesson(lesson);
                      setProgress(0);
                      if (videoRef.current) {
                        videoRef.current.currentTime = 0;
                        videoRef.current.pause();
                        setIsPlaying(false);
                      }
                    }
                  }}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    isActive
                      ? 'bg-purple-100 dark:bg-purple-900/30 border-l-4 border-purple-600'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${
                      isCompleted ? 'text-green-500' : isActive ? 'text-purple-600 dark:text-purple-400' : darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : isLocked ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <PlayCircle className="w-4 h-4" />
                      )}
                    </span>
                    <div className="flex-1">
                      <p className={`text-sm font-medium truncate ${
                        isActive ? 'text-purple-600 dark:text-purple-400' : darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {lesson.title || `Lesson ${index + 1}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {lesson.duration || '10:00'} • {isCompleted ? 'Completed' : isLocked ? 'Locked' : 'Ready'}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Progress Summary */}
          <div className="p-4 border-t dark:border-gray-700 mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                Overall Progress
              </span>
              <span className="font-bold text-purple-600">
                {course?.lessons?.length > 0 
                  ? Math.round((completedLessons.length / course.lessons.length) * 100)
                  : 0}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-2">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all"
                style={{
                  width: course?.lessons?.length > 0
                    ? `${(completedLessons.length / course.lessons.length) * 100}%`
                    : '0%'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;