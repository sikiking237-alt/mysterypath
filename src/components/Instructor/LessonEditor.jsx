import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Upload, FileText, Save, Video, PlusCircle, Trash2, ListChecks, Lock, Percent } from 'lucide-react';
import Editor from '@monaco-editor/react';

import {
  useUploadCourseFileMutation,
  useUpdateLessonMutation,
  useCreateLessonMutation,
  useGetLessonQuizQuery,
  useUpdateLessonQuizMutation,
} from '../../features/courses/coursesApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const LessonEditor = ({ lesson, courseId, moduleId, onSave, onCancel }) => {
  // Internal state for the form fields
  const [title, setTitle] = useState('');
  const [type, setType] = useState('text');
  const [notes, setNotes] = useState('');
  const [slidesUrl, setSlidesUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [duration, setDuration] = useState('');
  const [questions, setQuestions] = useState([]);
  const [isRequiredToPass, setIsRequiredToPass] = useState(false);
  const [passingScore, setPassingScore] = useState(70);

  // RTK Query mutations for backend operations
  const [uploadCourseFile, { isLoading: isUploadingFile }] = useUploadCourseFileMutation();
  const [updateLesson, { isLoading: isUpdating }] = useUpdateLessonMutation();
  const [createLesson, { isLoading: isCreating }] = useCreateLessonMutation();
  const [updateLessonQuiz, { isLoading: isSavingQuiz }] = useUpdateLessonQuizMutation();

  // Fetch quiz data if the lesson is a quiz
  const { data: quizData, isLoading: isLoadingQuiz } = useGetLessonQuizQuery(lesson?.id, {
    skip: !lesson || lesson.type !== 'quiz',
  });

  // Populate form when an existing lesson is passed as a prop
  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title ?? '');
      setType(lesson.type ?? 'text');
      setNotes(lesson.content ?? '');
      setSlidesUrl(lesson.slides_url ?? '');
      setVideoUrl(lesson.video_url ?? '');
      setDuration(lesson.duration ?? '');
      setPassingScore(lesson.passing_score ?? 70);
      setIsRequiredToPass(lesson.is_required_to_pass ?? false);
      setQuestions(lesson.type === 'quiz' && quizData ? quizData.questions : []);
    } else {
      // Reset form for creating a new lesson
      setTitle('');
      setType('text');
      setNotes('');
      setSlidesUrl('');
      setVideoUrl('');
      setDuration('');
      setPassingScore(70);
      setIsRequiredToPass(false);
      setQuestions([]);
    }
  }, [lesson]);

  useEffect(() => {
    if (quizData && lesson?.type === 'quiz') {
      setQuestions(quizData.questions || []);
    }
  }, [quizData, lesson]);

  // Handler for the slide file upload
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await uploadCourseFile(formData).unwrap();
      setSlidesUrl(result.file_url);
      toast.success('Slides uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload slides. Please try again.');
      console.error('File upload error:', error);
    }
  };

  // Handler for the video file upload
  const handleVideoFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await uploadCourseFile(formData).unwrap();
      setVideoUrl(result.file_url);
      toast.success('Video uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload video. Please try again.');
      console.error('Video file upload error:', error);
    }
  };

  // Handler for the save button
  const handleSave = async () => {
    const lessonData = {
      title,
      type,
      slides_url: slidesUrl,
      video_url: type === 'video' ? videoUrl : '',
      duration,
      passing_score: type === 'quiz' ? passingScore : 70,
      is_required_to_pass: type === 'quiz' ? isRequiredToPass : false,
      // Content is notes for 'text', or JSON for 'quiz'
      content: type === 'text' ? notes : (type === 'quiz' ? JSON.stringify({ title: 'Quiz' }) : ''),
    };

    try {
      let savedLessonPayload;
      if (lesson && lesson.id) {
        // Update existing lesson
        savedLessonPayload = await updateLesson({ courseId, lessonId: lesson.id, lessonData }).unwrap();
        toast.success('Lesson updated successfully!');
      } else {
        // Create new lesson
        savedLessonPayload = await createLesson({ courseId, moduleId, lessonData }).unwrap();
        toast.success('Lesson created successfully!');
      }

      // After lesson is saved, if it's a quiz, save the questions
      if (lessonData.type === 'quiz' && savedLessonPayload?.lesson?.id) {
        await updateLessonQuiz({ lessonId: savedLessonPayload.lesson.id, questions }).unwrap();
        toast.success('Quiz questions saved successfully!');
      }

      if (onSave) {
        onSave(); // Callback to parent to close modal or refetch data
      }
    } catch (error) {
      toast.error('Failed to save lesson.');
      console.error('Save lesson error:', error);
    }
  };

  const isLoading = isUploadingFile || isUpdating || isCreating || isSavingQuiz || isLoadingQuiz;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        {lesson ? 'Edit Lesson' : 'Create New Lesson'}
      </h2>

      {/* Lesson Title Input */}
      <div>
        <Label htmlFor="lesson-title" className="text-gray-700 dark:text-gray-300">Lesson Title</Label>
        <Input
          id="lesson-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Introduction to React Hooks"
          className="mt-1"
          disabled={isLoading}
        />
      </div>

      {/* Lesson Type and Duration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="lesson-type" className="text-gray-700 dark:text-gray-300">Lesson Type</Label>
          <select
            id="lesson-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm border-gray-300 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isLoading}
          >
            <option value="text">Text & Slides</option>
            <option value="video">Video & Slides</option>
            <option value="quiz">Quiz</option>
          </select>
        </div>
        <div>
          <Label htmlFor="lesson-duration" className="text-gray-700 dark:text-gray-300">Duration</Label>
          <Input
            id="lesson-duration"
            type="text"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="e.g., 15 mins"
            className="mt-1"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Slides Upload Section */}
      <div>
        <Label htmlFor="slides-upload" className="text-gray-700 dark:text-gray-300">Upload Slides (PDF, PPTX)</Label>
        <div className="mt-1 flex items-center space-x-4">
          <Input
            id="slides-upload"
            type="file"
            onChange={handleFileChange}
            disabled={isLoading}
            className="flex-grow file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
            accept=".pdf,.pptx,.ppt"
          />
        </div>
        {slidesUrl && (
          <div className="mt-2 text-sm text-green-600 dark:text-green-400">
            <a href={slidesUrl} target="_blank" rel="noopener noreferrer" className="flex items-center hover:underline">
              <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">Current slides: {slidesUrl.split('/').pop()}</span>
            </a>
          </div>
        )}
      </div>

      {/* Conditional Content Section */}
      {type === 'video' && (
        <div>
          <Label className="text-gray-700 dark:text-gray-300">Video Content</Label>
          <div className="mt-1 space-y-4 p-4 border rounded-md border-gray-300 dark:border-gray-600">
            <div>
              <Label htmlFor="video-url" className="text-sm">Video URL (e.g., YouTube, Vimeo)</Label>
              <Input
                id="video-url"
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://example.com/video.mp4"
                className="mt-1"
                disabled={isLoading}
              />
            </div>
            <div className="text-center text-xs text-gray-500">OR</div>
            <div>
              <Label htmlFor="video-upload" className="text-sm">Upload Video File</Label>
              <Input id="video-upload" type="file" onChange={handleVideoFileChange} disabled={isLoading} className="mt-1" accept="video/*" />
              {videoUrl && (
                <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                  <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center hover:underline">
                    <Video className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Current video: {videoUrl.split('/').pop()}</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {type === 'text' && (
        <div>
          <Label className="text-gray-700 dark:text-gray-300">Lesson Notes</Label>
          <div className="mt-1 border rounded-md overflow-hidden border-gray-300 dark:border-gray-600">
            <Editor height="300px" language="markdown" value={notes} onChange={(value) => setNotes(value || '')} theme="vs-dark" options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: 'on' }} />
          </div>
        </div>
      )}
      {type === 'quiz' && (
        <div>
          <QuizBuilder questions={questions} setQuestions={setQuestions} disabled={isLoading} />
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600 space-y-4">
            <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Quiz Settings</h4>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="is-required-to-pass"
                checked={isRequiredToPass}
                onChange={(e) => setIsRequiredToPass(e.target.checked)}
                disabled={isLoading}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <Label htmlFor="is-required-to-pass" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 cursor-pointer"><Lock className="h-4 w-4" /> Require passing to unlock the next lesson</Label>
            </div>
            <div>
              <Label htmlFor="passing-score" className={`text-sm font-medium flex items-center gap-2 ${!isRequiredToPass ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}><Percent size={14}/> Passing Score</Label>
              <Input
                id="passing-score"
                type="number"
                value={passingScore}
                onChange={(e) => setPassingScore(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                disabled={isLoading || !isRequiredToPass}
                className="mt-1 w-full md:w-48"
              />
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        {onCancel && <Button variant="ghost" onClick={onCancel} disabled={isLoading}>Cancel</Button>}
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Saving...' : <><Save className="h-4 w-4 mr-2" /> Save Lesson</>}
        </Button>
      </div>
    </div>
  );
};

const QuizBuilder = ({ questions, setQuestions, disabled }) => {
  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        options: [
          { option_text: '', is_correct: true },
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false },
        ],
      },
    ]);
  };

  const handleQuestionChange = (qIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].question_text = value;
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex].option_text = value;
    setQuestions(newQuestions);
  };

  const handleCorrectOptionChange = (qIndex, oIndex) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.forEach((opt, i) => {
      opt.is_correct = i === oIndex;
    });
    setQuestions(newQuestions);
  };

  const handleDeleteQuestion = (qIndex) => {
    const newQuestions = questions.filter((_, i) => i !== qIndex);
    setQuestions(newQuestions);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Label className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <ListChecks className="h-5 w-5" />
          Quiz Builder
        </Label>
        <Button variant="outline" size="sm" onClick={handleAddQuestion} disabled={disabled}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {questions.map((q, qIndex) => (
          <div key={q.id || qIndex} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Question {qIndex + 1}</Label>
              <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(qIndex)} disabled={disabled}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
            <Input
              type="text"
              placeholder="Enter the question text..."
              value={q.question_text}
              onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
              disabled={disabled}
            />
            <div className="space-y-2 pt-2">
              <Label className="text-xs uppercase font-bold text-gray-500">Options</Label>
              {q.options.map((opt, oIndex) => (
                <div key={opt.id || oIndex} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-option-${qIndex}`}
                    checked={opt.is_correct}
                    onChange={() => handleCorrectOptionChange(qIndex, oIndex)}
                    disabled={disabled}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <Input
                    type="text"
                    placeholder={`Option ${oIndex + 1}`}
                    value={opt.option_text}
                    onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                    disabled={disabled}
                    className={opt.is_correct ? 'border-green-500' : ''}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {questions.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg text-gray-500">
          <p>No questions yet. Click "Add Question" to start building your quiz.</p>
        </div>
      )}
    </div>
  );
};

export default LessonEditor;