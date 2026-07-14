import React, { useState, useEffect } from "react";
import { apiCall, apiEndpoints } from "../../config/apiConfig";

const QuizViewer = ({ quizId, darkMode, onComplete }) => {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  useEffect(() => {
    if (timeLeft > 0 && !showResults) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResults) {
      submitQuiz();
    }
  }, [timeLeft, showResults]);

  const loadQuiz = async () => {
    setLoading(true);
    setError("");
    const response = await apiCall(apiEndpoints.quizzes.get(quizId));
    setLoading(false);

    if (response.error) {
      setError(response.error || "Failed to load quiz.");
    } else {
      setQuiz(response);
      if (response.time_limit && response.time_limit > 0) {
        setTimeLeft(response.time_limit * 60);
      }
    }
  };

  const selectAnswer = (questionId, answerId) => {
    setAnswers({ ...answers, [questionId]: answerId });
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const submitQuiz = async () => {
    setLoading(true);
    setError("");
    const response = await apiCall(apiEndpoints.quizzes.attempt(quizId), {
      method: "POST",
      body: { answers },
    });
    setLoading(false);

    if (response.error) {
      setError(response.error || "Failed to submit quiz attempt.");
    } else {
      setResult(response);
      setShowResults(true);
      if (onComplete) onComplete(response);
    }
  };

  const resetQuiz = () => {
    setAnswers({});
    setResult(null);
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setError("");
    // Re-fetch quiz to reset timer and get fresh data
    loadQuiz();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgressPercentage = () => {
    if (!quiz) return 0;
    return (Object.keys(answers).length / quiz.questions.length) * 100;
  };

  if (loading && !quiz) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 rounded-xl text-center ${darkMode ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-700'}`}>
        <h3 className="font-bold">Error</h3>
        <p className="text-sm mt-2">{error}</p>
        <button
          onClick={resetQuiz}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }
  if (showResults && result) {
    return (
      <div
        className={`p-6 rounded-xl ${result.passed ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"} border ${result.passed ? "border-green-200 dark:border-green-800" : "border-red-200 dark:border-red-800"}`}
      >
        <div className="text-center">
          <div className="text-6xl mb-4">{result.passed ? "🎉" : "📚"}</div>
          <h2
            className={`text-2xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}
          >
            {result.passed ? "Congratulations!" : "Good Try!"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your score:{" "}
            <span className="font-bold text-indigo-600">
              {Math.round(result.score)}%
            </span>
            {result.passed && (
              <span> • +{result.xp_earned || 50} XP earned!</span>
            )}
          </p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-6">
            <div
              className={`h-full rounded-full transition-all duration-500 ${result.passed ? "bg-green-500" : "bg-red-500"}`}
              style={{ width: `${result.score}%` }}
            ></div>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={resetQuiz}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📝</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Quiz not found
        </h2>
        <p className="text-gray-500 mt-2">
          The quiz you're looking for doesn't exist.
        </p>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isAnswered = answers[currentQuestion?.id] !== undefined;
  const progress = getProgressPercentage();

  return (
    <div
      className={`rounded-xl p-6 ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm border ${darkMode ? "border-gray-700" : "border-gray-100"}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4 flex-wrap gap-4">
        <div>
          <h2
            className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
          >
            {quiz.title}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {quiz.description}
          </p>
        </div>
        {timeLeft !== null && (
          <div
            className={`text-right p-3 rounded-lg ${timeLeft < 60 ? "bg-red-100 dark:bg-red-900/30 animate-pulse" : "bg-gray-100 dark:bg-gray-700"}`}
          >
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Time Left
            </div>
            <div
              className={`text-xl font-bold ${timeLeft < 60 ? "text-red-600" : "text-indigo-600"}`}
            >
              {formatTime(timeLeft)}
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">Progress</span>
          <span className="text-gray-500">
            {Object.keys(answers).length} / {quiz.questions.length} answered
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Question Navigation */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {quiz.questions.map((q, idx) => (
          <button
            key={q.id}
            onClick={() => setCurrentQuestionIndex(idx)}
            className={`w-10 h-10 rounded-full transition-all ${
              currentQuestionIndex === idx
                ? "bg-indigo-600 text-white"
                : answers[q.id]
                  ? "bg-green-500 text-white"
                  : darkMode
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      {/* Current Question */}
      <div
        className={`p-6 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"} mb-6`}
      >
        <div className="flex justify-between items-start mb-4">
          <h3
            className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}
          >
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </h3>
          <span className="text-sm text-gray-500">
            {currentQuestion.points} point(s)
          </span>
        </div>

        <p
          className={`text-base mb-6 ${darkMode ? "text-gray-200" : "text-gray-800"}`}
        >
          {currentQuestion.text}
        </p>

        <div className="space-y-3">
          {currentQuestion.answers.map((answer) => (
            <label
              key={answer.id}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                answers[currentQuestion.id] === answer.id
                  ? "bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-500"
                  : darkMode
                    ? "hover:bg-gray-600 border-2 border-transparent"
                    : "hover:bg-gray-100 border-2 border-transparent"
              }`}
            >
              <input
                type="radio"
                name={`question_${currentQuestion.id}`}
                value={answer.id}
                checked={answers[currentQuestion.id] === answer.id}
                onChange={() => selectAnswer(currentQuestion.id, answer.id)}
                className="w-4 h-4 text-indigo-600"
              />
              <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                {answer.text}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={goToPreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className={`px-4 py-2 rounded-lg transition ${
            currentQuestionIndex === 0
              ? "bg-gray-300 cursor-not-allowed opacity-50"
              : "bg-gray-500 hover:bg-gray-600 text-white"
          }`}
        >
          ← Previous
        </button>

        {currentQuestionIndex < quiz.questions.length - 1 ? (
          <button
            onClick={goToNextQuestion}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={submitQuiz}
            disabled={Object.keys(answers).length !== quiz.questions.length}
            className={`px-6 py-2 rounded-lg transition ${
              Object.keys(answers).length === quiz.questions.length
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-300 cursor-not-allowed opacity-50"
            }`}
          >
            Submit Quiz ✓
          </button>
        )}
      </div>

      {/* Warning if not all questions answered */}
      {Object.keys(answers).length !== quiz.questions.length &&
        currentQuestionIndex === quiz.questions.length - 1 && (
          <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm">
            ⚠️ You have {quiz.questions.length - Object.keys(answers).length}{" "}
            unanswered question(s). Please answer all questions before
            submitting.
          </div>
        )}
    </div>
  );
};

export default QuizViewer;
