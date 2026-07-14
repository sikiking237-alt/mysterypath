import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, ChevronRight, ChevronLeft, BookOpen, Lightbulb, Loader, CheckCircle2, RefreshCw, HelpCircle, Lock, Download, FileText } from 'lucide-react';
import Certificate from '../components/Instructor/Certificate';
import { useEnrollInCourseMutation } from '../features/courses/coursesApi';

// Use relative paths so requests go through the Vite proxy to the backend (port 5000).
const API_BASE_URL = '';
const apiEndpoints = {
  course: (id) => `${API_BASE_URL}/api/courses/${id}`,
  structure: (id) => `${API_BASE_URL}/api/courses/${id}/structure`,
  saveProgress: `${API_BASE_URL}/api/progress/update`,
  completeCourse: `${API_BASE_URL}/api/certificates/generate`,
};

const CoursePlayerPage = ({ darkMode }) => {
  const { courseId } = useParams();
  const courseIdNum = Number(courseId);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrollmentError, setEnrollmentError] = useState('');
  const navigate = useNavigate();

  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [currentSubtopicIndex, setCurrentSubtopicIndex] = useState(0);

  // New state for multi-question quiz
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { questionIndex: answer }
  const [showQuizResultView, setShowQuizResultView] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizPassed, setQuizPassed] = useState(false);

  const [completedSubtopics, setCompletedSubtopics] = useState(new Set());
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [generatedCertificate, setGeneratedCertificate] = useState(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const [enrollInCourseMutation, { isLoading: isEnrolling }] = useEnrollInCourseMutation();

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const structureResponse = await fetch(apiEndpoints.structure(courseIdNum), { headers });

      if (!structureResponse.ok) {
        if (structureResponse.status === 403) {
          const data = await structureResponse.json().catch(() => ({}));
          setEnrollmentError(data.error || 'You are not enrolled in this course');
          setLoading(false);
          return;
        }
        if (structureResponse.status === 404) {
          throw new Error('Course not found');
        }
        throw new Error('Failed to load course content');
      }

      const structure = await structureResponse.json();
      setEnrollmentError('');
      setError('');

      const topics = (structure.sections || []).map((section) => ({
        id: section.id,
        title: section.title,
        subtopics: (section.lessons || []).map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          type: lesson.type,
          content: lesson.content || '',
          video_url: lesson.video_url || '',
          slides_url: lesson.slides_url || '',
          files: lesson.files || [],
          is_completed: lesson.is_completed || false,
          quiz: lesson.quiz || null,
        })),
      }));

      setCourse({
        id: structure.course_id,
        title: structure.title,
        topics,
      });

      const completed = new Set();
      (structure.sections || []).forEach((s) =>
        (s.lessons || []).forEach((l) => {
          if (l.is_completed) completed.add(l.id);
        })
      );
      setCompletedSubtopics(completed);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const handleEnroll = async () => {
    try {
      const result = await enrollInCourseMutation(courseIdNum).unwrap();
      setEnrollmentError('');
      setError('');
      fetchCourse();
    } catch (err) {
      const errorMessage = err.data?.message || err.data?.error || 'Failed to enroll in course. Please try again.';
      setEnrollmentError(errorMessage);
    }
  };

  const markSubtopicAsComplete = async (subtopicId) => {
    setCompletedSubtopics(prev => new Set(prev).add(subtopicId));
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    console.log('Saving progress:', { course_id: courseIdNum, lesson_id: subtopicId });
    const response = await fetch(apiEndpoints.saveProgress, {
      method: 'POST',
      headers,
      body: JSON.stringify({ course_id: courseIdNum, lesson_id: subtopicId }),
    });
    console.log('Progress save response:', response.status);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      console.error('Progress save failed:', response.status, data);
      throw new Error(data.error || `Progress save failed with status ${response.status}`);
    }
    console.log('Progress saved successfully for lesson:', subtopicId);
  };

  const handleNextSubtopic = async () => {
    if (!course) return;

    try {
      const currentSubtopic = course.topics[currentTopicIndex]?.subtopics[currentSubtopicIndex];
      console.log('handleNextSubtopic called:', { currentTopicIndex, currentSubtopicIndex, subtopicId: currentSubtopic?.id, isLastSubtopic });
      
      if (currentSubtopic) {
        await markSubtopicAsComplete(currentSubtopic.id);
      }
      
      if (isLastSubtopic) {
        console.log('Last subtopic, generating certificate...');
        await handleCourseCompletion();
      } else {
        const currentTopic = course.topics[currentTopicIndex];
        if (currentSubtopicIndex < currentTopic.subtopics.length - 1) {
          handleSubtopicSelect(currentTopicIndex, currentSubtopicIndex + 1);
        } else if (currentTopicIndex < course.topics.length - 1) {
          handleSubtopicSelect(currentTopicIndex + 1, 0);
        }
      }
    } catch (err) {
      console.error('handleNextSubtopic error:', err);
      alert(err.message || 'Failed to save progress. Please try again.');
    }
  };

  const handleSubtopicSelect = (topicIdx, subtopicIdx) => {
    setCurrentTopicIndex(topicIdx);
    setCurrentSubtopicIndex(subtopicIdx);
    // Reset quiz state
    setCurrentQuizQuestion(0);
    setSelectedAnswers({});
    setShowQuizResultView(false);
    setQuizScore(0);
    setQuizPassed(false);
  };

  const handleCourseCompletion = async () => {
    setIsCompleting(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
      
      console.log('Attempting to generate certificate for course:', courseIdNum);
      console.log('Token present:', !!token);
      
      const response = await fetch(apiEndpoints.completeCourse, {
        method: 'POST',
        headers,
        body: JSON.stringify({ course_id: courseIdNum }),
      });
      
      const data = await response.json();
      console.log('Certificate response:', response.status, data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate certificate.');
      }
      setGeneratedCertificate(data.certificate);
      setShowCompletionModal(true);
    } catch (err) {
      console.error('Certificate generation error:', err);
      alert(err.message || 'Failed to generate certificate.');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleAnswerSelect = (questionIndex, answer) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  const handleSubmitQuiz = () => {
    const subtopic = course.topics[currentTopicIndex].subtopics[currentSubtopicIndex];
    const questions = subtopic.quiz.questions;
    let correctAnswers = 0;

    questions.forEach((q, index) => {
      const questionType = q.type || 'multiple_choice';
      const userAnswer = selectedAnswers[index];

      if (questionType === 'multiple_choice') {
        if (userAnswer === q.correctAnswer) {
          correctAnswers++;
        }
      } else if (questionType === 'fill_in_the_blank') {
        if (userAnswer && userAnswer.trim().toLowerCase() === q.correctAnswer.toLowerCase()) {
          correctAnswers++;
        }
      }
    });

    const score = (correctAnswers / questions.length) * 100;
    setQuizScore(score);

    const passingScore = 70; // Assuming 70% to pass
    if (score >= passingScore) {
      setQuizPassed(true);
      markSubtopicAsComplete(subtopic.id);
      alert(`Quiz passed! Score: ${score.toFixed(0)}%`);
    } else {
      setQuizPassed(false);
      alert(`Score: ${score.toFixed(0)}%. You need ${passingScore}% to pass. Please try again.`);
    }
    setShowQuizResultView(true);
  };

  const handleRetryQuiz = () => {
    handleSubtopicSelect(currentTopicIndex, currentSubtopicIndex); // Resets the quiz state
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader className="animate-spin" /> Loading course...</div>;
  }

  if (enrollmentError) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-60px)]">
        <div className={`max-w-md w-full mx-4 rounded-2xl p-8 text-center shadow-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-3">Enrollment Required</h2>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
            {enrollmentError}
          </p>
          <button
            onClick={handleEnroll}
            disabled={isEnrolling}
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center mt-10">{error}</div>;
  }

  if (!course || !course.topics || course.topics.length === 0) {
    return <div className="text-center mt-10">This course has no content yet.</div>;
  }

  const totalSubtopics = course.topics.reduce((total, topic) => total + (topic.subtopics?.length || 0), 0);
  const progressPercentage = totalSubtopics > 0 ? (completedSubtopics.size / totalSubtopics) * 100 : 0;

  const currentSubtopic = course.topics[currentTopicIndex]?.subtopics[currentSubtopicIndex];
  const hasQuiz = currentSubtopic?.quiz && currentSubtopic.quiz.questions.length > 0;
  const isQuizPassed = quizPassed || !hasQuiz;
  const isLastSubtopic = currentTopicIndex === course.topics.length - 1 && currentSubtopicIndex === course.topics[currentTopicIndex].subtopics.length - 1;

  return (
    <>
      <div className={`flex h-[calc(100vh-60px)] ${darkMode ? 'bg-gray-900 text-white dark:text-gray-100 dark:text-gray-100' : 'bg-gray-50 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900'}`}>
      {/* Sidebar */}
      <aside className={`w-80 p-6 overflow-y-auto border-r ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 dark:border-gray-700 dark:border-gray-700 dark:border-gray-700 bg-white dark:bg-gray-800 dark:bg-gray-800 dark:bg-gray-800'}`}>
        <h2 className="text-lg font-bold mb-4">{course.title}</h2>

        {/* Course Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className={`font-semibold ${darkMode ? 'text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300'}`}>Course Progress</span>
            <span className="font-bold text-indigo-500">{progressPercentage.toFixed(0)}%</span>
          </div>
          <div className={`w-full rounded-full h-2.5 ${darkMode ? 'bg-gray-700' : 'bg-gray-200 dark:bg-gray-700 dark:bg-gray-700'}`}>
            <div 
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-4">
          {course.topics.map((topic, topicIdx) => (
            <div key={topic.id}>
              <h3 className="font-semibold mb-2 text-indigo-500">{topic.title}</h3>
              <ul className="space-y-1">
                {topic.subtopics.map((subtopic, subtopicIdx) => (
                  <li key={subtopic.id} className="flex items-center gap-2">
                    {completedSubtopics.has(subtopic.id) ? (
                      <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 border-2 rounded-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:border-gray-600 dark:border-gray-600 flex-shrink-0" />
                    )}
                    <button
                      onClick={() => handleSubtopicSelect(topicIdx, subtopicIdx)}
                      className={`flex-1 text-left px-3 py-2 rounded-md text-sm transition ${
                        topicIdx === currentTopicIndex && subtopicIdx === currentSubtopicIndex
                          ? `font-semibold ${darkMode ? 'bg-indigo-600' : 'bg-indigo-100 text-indigo-800'}`
                          : `${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700/50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:bg-gray-700'}`
                      }`}
                    >
                      {subtopic.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {currentSubtopic ? (
          <div>
            <h1 className="text-3xl font-bold mb-4">{currentSubtopic.title}</h1>
            
            {/* Content Section */}
            <div className={`p-6 rounded-lg mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white dark:bg-gray-800 dark:bg-gray-800 dark:bg-gray-800'}`}>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="text-indigo-500" />
                <h2 className="text-xl font-semibold">Lesson Content</h2>
              </div>
              {currentSubtopic.video_url && (
                <div className="mb-4 aspect-video rounded-lg overflow-hidden bg-black">
                  <video
                    src={currentSubtopic.video_url}
                    controls
                    className="w-full h-full"
                  />
                </div>
              )}
              <p className={`leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-300'}`}>
                {currentSubtopic.content}
              </p>

              {currentSubtopic.files && currentSubtopic.files.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Downloadable Files</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentSubtopic.files.map((file, idx) => (
                      <a
                        key={idx}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-3 p-4 rounded-lg border transition ${
                          darkMode ? 'border-gray-700 bg-gray-700/50 hover:border-indigo-500' : 'border-gray-200 bg-gray-50 hover:border-indigo-500'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {file.type?.split('/').pop()?.toUpperCase() || 'FILE'}
                            {file.size ? ` • ${(file.size / 1024).toFixed(1)} KB` : ''}
                          </p>
                        </div>
                        <Download className="w-4 h-4 text-gray-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quiz Section */}
            {hasQuiz && (
              <div className={`p-6 rounded-lg mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white dark:bg-gray-800 dark:bg-gray-800 dark:bg-gray-800'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="text-amber-500" />
                  <h2 className="text-xl font-semibold">Knowledge Check</h2>
                </div>
                {showQuizResultView ? (
                  // Quiz Result View
                  <div className="animate-fade-in-up">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold">Quiz Complete!</h3>
                      <p className="text-lg mt-2">Your Score:</p>
                      <p className={`text-5xl font-bold my-2 animate-pop-in ${quizPassed ? 'text-green-500' : 'text-red-500'}`} style={{ animationDelay: '200ms' }}>
                        {quizScore.toFixed(0)}%
                      </p>
                      {quizPassed ? (
                        <div className="flex items-center justify-center gap-2 text-green-500 mt-4 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                          <CheckCircle size={24} />
                          <span>Congratulations! You've passed.</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2 text-red-500 mt-4 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                          <XCircle size={24} />
                          <span>You need 70% to pass. Please try again.</span>
                        </div>
                      )}
                    </div>

                    {/* Detailed Answer Review */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold border-b pb-2 dark:border-gray-700 animate-fade-in-up" style={{ animationDelay: '500ms' }}>Review Your Answers</h4>
                      {currentSubtopic.quiz.questions.map((q, index) => {
                        const userAnswer = selectedAnswers[index];
                        const questionType = q.type || 'multiple_choice';
                        const isCorrect = questionType === 'fill_in_the_blank'
                          ? userAnswer && userAnswer.trim().toLowerCase() === q.correctAnswer.toLowerCase()
                          : userAnswer === q.correctAnswer;

                        return (
                          <div key={q.id} className={`p-4 rounded-lg border-l-4 animate-fade-in-up ${isCorrect ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'}`} style={{ animationDelay: `${600 + index * 150}ms` }}>
                            <p className="font-medium mb-3 flex items-start gap-2"><HelpCircle size={18} className="flex-shrink-0 mt-0.5 text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500" /><span>{index + 1}. {q.text.replace('___', `[${q.correctAnswer}]`)}</span></p>
                            <div className="text-sm space-y-2 pl-7">
                              <div className={`flex items-start gap-2 ${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                {isCorrect ? <CheckCircle size={16} className="flex-shrink-0 mt-0.5" /> : <XCircle size={16} className="flex-shrink-0 mt-0.5" />}
                                <div><span className="font-semibold">Your answer: </span>{userAnswer || <span className="italic opacity-70">Not answered</span>}</div>
                              </div>
                              {!isCorrect && (
                                <div className="flex items-start gap-2 text-green-700 dark:text-green-400"><CheckCircle size={16} className="flex-shrink-0 mt-0.5" /><div><span className="font-semibold">Correct answer: </span>{q.correctAnswer}</div></div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {!quizPassed && (
                      <div className="text-center mt-8 animate-fade-in-up" style={{ animationDelay: `${700 + currentSubtopic.quiz.questions.length * 150}ms` }}>
                        <button onClick={handleRetryQuiz} className="flex items-center justify-center mx-auto gap-2 px-6 py-2 bg-indigo-600 text-white dark:text-gray-100 dark:text-gray-100 rounded-md hover:bg-indigo-700"><RefreshCw size={16} /> Retry Quiz</button>
                      </div>
                    )}
                  </div>
                ) : (
                  // Quiz Questions View
                  <div>
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">Question {currentQuizQuestion + 1} of {currentSubtopic.quiz.questions.length}</p>                      
                    </div>

                    {(() => {
                      const question = currentSubtopic.quiz.questions[currentQuizQuestion];
                      const questionType = question.type || 'multiple_choice';

                      if (questionType === 'fill_in_the_blank') {
                        const parts = question.text.split('___');
                        return (
                          <div className="font-medium mt-1 text-lg flex items-center flex-wrap">
                            {parts[0]}
                            <input
                              type="text"
                              value={selectedAnswers[currentQuizQuestion] || ''}
                              onChange={(e) => handleAnswerSelect(currentQuizQuestion, e.target.value)}
                              className="mx-2 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                              style={{ width: `${(question.correctAnswer.length || 10) * 10}px` }}
                              autoFocus
                            />
                            {parts[1]}
                          </div>
                        );
                      }

                      // Default to multiple choice
                      return (
                        <div>
                          <p className="font-medium mt-1">{question.text}</p>
                          <div className="space-y-2 mt-4">
                            {question.options.map((option, index) => (
                              <label key={index} className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${selectedAnswers[currentQuizQuestion] === option ? 'border-indigo-500 ring-2 ring-indigo-500' : darkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 dark:border-gray-700 dark:border-gray-700 dark:border-gray-700 hover:border-gray-400 dark:border-gray-500'}`}>
                                <input type="radio" name={`quiz-option-${currentQuizQuestion}`} value={option} checked={selectedAnswers[currentQuizQuestion] === option} onChange={() => handleAnswerSelect(currentQuizQuestion, option)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:border-gray-600" />
                                <span className="ml-3 text-sm">{option}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex justify-between mt-6">
                      <button
                        onClick={() => setCurrentQuizQuestion(prev => prev - 1)}
                        disabled={currentQuizQuestion === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 dark:bg-gray-700 dark:bg-gray-700 text-gray-800 dark:text-white dark:text-gray-100 dark:text-white dark:text-gray-100 dark:text-gray-100 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:bg-gray-600 disabled:opacity-50"
                      >
                        <ChevronLeft size={16} /> Previous
                      </button>
                      {currentQuizQuestion === currentSubtopic.quiz.questions.length - 1 ? (
                        <button
                          onClick={handleSubmitQuiz}
                          disabled={Object.keys(selectedAnswers).length !== currentSubtopic.quiz.questions.length}
                          className="px-4 py-2 bg-indigo-600 text-white dark:text-gray-100 dark:text-gray-100 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                          Submit Quiz
                        </button>
                      ) : (
                        <button
                          onClick={() => setCurrentQuizQuestion(prev => prev + 1)}
                          disabled={currentQuizQuestion === currentSubtopic.quiz.questions.length - 1}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white dark:text-gray-100 dark:text-gray-100 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                          Next <ChevronRight size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-end">
              <button
                onClick={handleNextSubtopic}
                disabled={!isQuizPassed || isCompleting}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white dark:text-gray-100 dark:text-gray-100 font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCompleting ? (
                  <><Loader className="animate-spin" size={20} /> Completing...</>
                ) : isLastSubtopic ? (
                  'Finish Course'
                ) : 'Next Subtopic'}
                {!isCompleting && <ChevronRight size={20} />}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h1 className="text-2xl font-bold">Welcome!</h1>
            <p>Select a topic from the sidebar to begin.</p>
          </div>
        )}
      </main>
      </div>

      {showCompletionModal && generatedCertificate && (
        <Certificate
          userName={generatedCertificate.userName}
          courseName={generatedCertificate.courseTitle}
          completionDate={generatedCertificate.issuedDate}
          darkMode={darkMode}
          onClose={() => {
            setShowCompletionModal(false);
            navigate('/my-learning'); // Or to a dedicated certificates page
          }}
        />
      )}
      <style>{`
        @keyframes pop-in {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-pop-in {
          animation: pop-in 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out both;
        }
      `}</style>
    </>
  );
};

export default CoursePlayerPage;


