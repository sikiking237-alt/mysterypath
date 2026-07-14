import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2, CheckCircle, XCircle, History, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

import { useGetStudentQuizQuery, useSubmitQuizMutation } from '../../features/courses/coursesApi';
import { useMarkLessonCompleteMutation } from '../../features/courses/coursesApi';
import { Button } from '../ui/button';

const QuizPlayer = ({ lesson, courseId, onQuizComplete }) => {
  const { data: quizData, isLoading, isError, refetch } = useGetStudentQuizQuery(lesson.id);
  const [submitQuiz, { isLoading: isSubmitting }] = useSubmitQuizMutation();
  const [markLessonComplete] = useMarkLessonCompleteMutation();

  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [historyPage, setHistoryPage] = useState(1);

  useEffect(() => {
    if (quizData?.attempts?.find(a => a.passed)) {
      // If already passed, show a success message.
      setResult({ passed: true, score: 100, message: "You have already passed this quiz." });
    }
  }, [quizData]);

  const handleAnswerChange = (questionId, optionId) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    const unanswered = quizData.questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      toast.error(`Please answer all ${unanswered.length} remaining questions.`);
      return;
    }

    try {
      const payload = await submitQuiz({ lessonId: lesson.id, courseId, answers }).unwrap();
      setResult(payload);
      if (payload.passed) {
        toast.success(`Quiz passed! Score: ${payload.score.toFixed(0)}%`);
        // Mark lesson as complete and trigger parent callback
        await markLessonComplete({ courseId, lessonId: lesson.id }).unwrap();
        if (onQuizComplete) onQuizComplete();
      } else {
        toast.error(`Quiz failed. Score: ${payload.score.toFixed(0)}%. Please try again.`);
      }
    } catch (error) {
      toast.error('Failed to submit quiz.');
      console.error('Quiz submission error:', error);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setAnswers({});
    setHistoryPage(1);
    refetch();
  };

  if (isLoading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (isError || !quizData?.questions) {
    return <div className="p-8 text-center text-red-500">Could not load the quiz. Please try again later.</div>;
  }

  const { questions, attempts } = quizData;

  // Pagination logic
  const ATTEMPTS_PER_PAGE = 3;
  const totalHistoryPages = Math.ceil((attempts?.length || 0) / ATTEMPTS_PER_PAGE);
  const paginatedAttempts = attempts?.slice(
    (historyPage - 1) * ATTEMPTS_PER_PAGE,
    historyPage * ATTEMPTS_PER_PAGE  );

  if (result) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Quiz Result</h2>
        <div className={`text-4xl font-bold mb-4 flex items-center gap-3 ${result.passed ? 'text-green-500' : 'text-red-500'}`}>
          {result.passed ? <CheckCircle /> : <XCircle />}
          {result.message || (result.passed ? 'Passed!' : 'Try Again')}
        </div>
        {result.score !== undefined && <p className="text-lg">Your score: <span className="font-bold">{result.score.toFixed(0)}%</span></p>}
        
        {!result.message && (
            <div className="mt-6">
            <h3 className="font-bold mb-2">Review Your Answers:</h3>
            {questions.map((q, index) => (
                <div key={q.id} className={`mb-4 p-4 border-l-4 rounded-r-lg bg-gray-50 dark:bg-gray-700/50 ${result.results[q.id]?.is_correct ? 'border-green-500' : 'border-red-500'}`}>
                <p className="font-semibold">{index + 1}. {q.question_text}</p>
                <div className="mt-2 space-y-1 text-sm">
                    {q.options.map(opt => {
                    const isSubmitted = result.results[q.id]?.submitted === opt.id;
                    const isCorrect = result.results[q.id]?.correct === opt.id;
                    let icon = isCorrect ? <CheckCircle className="h-4 w-4 text-green-500 inline-block mr-2" /> : (isSubmitted ? <XCircle className="h-4 w-4 text-red-500 inline-block mr-2" /> : <span className="inline-block w-6"></span>);
                    return (
                        <p key={opt.id} className={`flex items-center ${isCorrect ? 'font-bold text-green-600 dark:text-green-400' : ''} ${isSubmitted && !isCorrect ? 'text-red-600 dark:text-red-400' : ''}`}>
                        {icon} {opt.option_text}
                        </p>
                    );
                    })}
                </div>
                </div>
            ))}
            </div>
        )}

        {!result.passed && <Button onClick={handleRetry} className="mt-4"><RefreshCw className="h-4 w-4 mr-2" /> Try Again</Button>}
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-2">{lesson.title}</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Complete the quiz to test your knowledge and unlock the next lesson.</p>

      {attempts && attempts.length > 0 && (
        <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><History className="h-5 w-5" /> Previous Attempts</h3>
              {totalHistoryPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-medium">{historyPage} / {totalHistoryPages}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))} disabled={historyPage === totalHistoryPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <ul className="list-disc list-inside mt-2 text-sm space-y-1 pl-2">
                {paginatedAttempts.map((att) => (
                    <li key={att.attempted_at}>
                        Score: <span className={`font-semibold ${att.passed ? 'text-green-500' : 'text-red-500'}`}>{att.score.toFixed(0)}%</span>
                        {' '}- <span className={att.passed ? 'text-green-500' : 'text-red-500'}>{att.passed ? 'Passed' : 'Failed'}</span>
                        {' '}on {new Date(att.attempted_at).toLocaleString()}
                    </li>
                ))}
            </ul>
        </div>
      )}

      <div className="space-y-8">
        {questions.map((q, index) => (
          <div key={q.id}>
            <p className="font-semibold text-lg mb-4">{index + 1}. {q.question_text}</p>
            <div className="space-y-3">
              {q.options.map(opt => (
                <label key={opt.id} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${answers[q.id] === opt.id ? 'bg-indigo-50 border-indigo-500 dark:bg-indigo-900/50' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  <input
                    type="radio"
                    name={`question-${q.id}`}
                    value={opt.id}
                    checked={answers[q.id] === opt.id}
                    onChange={() => handleAnswerChange(q.id, opt.id)}
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="ml-4 text-gray-800 dark:text-gray-200">{opt.option_text}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button onClick={handleSubmit} disabled={isSubmitting} size="lg" className="mt-10 w-full">
        {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting...</> : 'Submit Quiz'}
      </Button>
    </div>
  );
};

export default QuizPlayer;