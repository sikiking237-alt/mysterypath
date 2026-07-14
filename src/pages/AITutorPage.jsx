import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bot,
  Send,
  Sparkles,
  Brain,
  BookOpen,
  MessageSquare,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { apiEndpoints, apiCall } from "../config/apiConfig";

const AITutorPage = ({ darkMode }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your MysteryPath AI Tutor. I can help explain concepts, create short quizzes, and guide your studying using your enrolled course context. What would you like to learn today?",
      sender: "ai",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState("");
  const [courseContext, setCourseContext] = useState([]);
  const [showPrerequisiteWarning, setShowPrerequisiteWarning] = useState(false);
  const [isWarningDismissed, setIsWarningDismissed] = useState(false);
  const [beginnerCourse, setBeginnerCourse] = useState(null);
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isTyping]);

  useEffect(() => {
    if (courseContext.length > 0) {
      const hasCompletedBeginner = courseContext.some(
        (c) => c.level === "Beginner" && c.progress === 100
      );
      const isEnrolledInAdvanced = courseContext.some(
        (c) => c.level !== "Beginner"
      );

      if (isEnrolledInAdvanced && !hasCompletedBeginner) {
        const firstBeginner = courseContext.find(c => c.level === 'Beginner' && c.progress < 100); // Find an uncompleted beginner course
        setBeginnerCourse(firstBeginner);
        setShowPrerequisiteWarning(true);
      } else {
        setShowPrerequisiteWarning(false);
        setBeginnerCourse(null);
      }
    } else {
      setShowPrerequisiteWarning(false);
      setBeginnerCourse(null);
    }
  }, [courseContext]);
  
  const loadFallbackCourseContext = useCallback(async () => {
    if (!token) return;

    const data = await apiCall(apiEndpoints.enrollments.myLearning);

    if (Array.isArray(data)) {
      setCourseContext(data);
      return;
    }

    if (Array.isArray(data?.courses)) {
      setCourseContext(data.courses);
    } else if (data?.error) {
      setError("Could not load course context for the tutor.");
    }
  }, [token]);

  useEffect(() => {
    loadFallbackCourseContext();
  }, [loadFallbackCourseContext]);

  const buildHistory = () =>
    messages
      .filter((msg) => msg.sender === "user" || msg.sender === "ai")
      .map((msg) => ({
        role: msg.sender === "ai" ? "assistant" : "user",
        content: msg.text,
      }));

  const buildFallbackTutorReply = (prompt, enrolledCourses = []) => {
    const normalizedPrompt = (prompt || "").trim();
    const activeCourses = Array.isArray(enrolledCourses) ? enrolledCourses : [];
    const sortedCourses = [...activeCourses].sort(
      (a, b) => (a?.progress ?? 0) - (b?.progress ?? 0),
    );
    const focusCourse = sortedCourses[0];
    const strongestCourse = [...activeCourses].sort(
      (a, b) => (b?.progress ?? 0) - (a?.progress ?? 0),
    )[0];

    if (/study plan|plan/i.test(normalizedPrompt)) {
      return [
        "Here’s a polished study plan for this week:",
        "",
        focusCourse
          ? `Primary focus: ${focusCourse.title} (${focusCourse.progress ?? 0}% complete)`
          : "Primary focus: your least-complete course or most difficult recent topic.",
        strongestCourse
          ? `Secondary review: ${strongestCourse.title} (${strongestCourse.progress ?? 0}% complete)`
          : "Secondary review: revisit your strongest topic briefly to improve retention.",
        "",
        "Monday — Review one weak lesson and write a 5-line summary.",
        "Tuesday — Re-study one key concept and create 3 flash questions.",
        "Wednesday — Practice recall without notes for 20 minutes.",
        "Thursday — Solve one exercise or explain the topic out loud.",
        "Friday — Review mistakes and mark one clear improvement goal.",
        "Weekend — Do a 45-minute recap and plan the next study block.",
        "",
        focusCourse
          ? `Best next step: continue with ${focusCourse.title} until you can explain the last topic without checking notes.`
          : "Once course data is fully available, I can personalize this plan even more precisely.",
      ].join("\n");
    }

    if (/quiz|test me|question/i.test(normalizedPrompt)) {
      const quizTopic = focusCourse?.title || "your current studies";
      return [
        `Quick tutor quiz on ${quizTopic}:`,
        "1. What is the main concept you studied most recently?",
        "2. Explain it in one or two simple sentences.",
        "3. Give one real example or use case.",
        "4. What is one mistake students commonly make with it?",
        "5. What should you study next to strengthen your understanding?",
        "",
        "Send me your answers and I’ll review them like a tutor.",
      ].join("\n");
    }

    if (
      /explain|difficult concept|hard topic|concept/i.test(normalizedPrompt)
    ) {
      const conceptCourse = focusCourse?.title || strongestCourse?.title;
      return [
        conceptCourse
          ? `Let’s tackle a difficult concept from ${conceptCourse}.`
          : "Let’s tackle a difficult concept in a simple, structured way.",
        "",
        "Use this learning pattern:",
        "1. Start with a plain-language definition.",
        "2. Identify why the concept matters.",
        "3. Connect it to one practical example.",
        "4. Compare it to something similar so the difference is clear.",
        "5. Finish by teaching it back in your own words.",
        "",
        conceptCourse
          ? `A strong next move is to open ${conceptCourse} and pick the lesson you understand least, then summarize it in 3 bullet points.`
          : "Pick the lesson you understand least, then summarize it in 3 bullet points before moving on.",
      ].join("\n");
    }

    return [
      "I’m ready to help with your studies right now.",
      "",
      `You asked: ${normalizedPrompt || "Help me learn better"}`,
      "",
      "Recommended tutor approach:",
      "- Break the topic into definition, example, and common mistake.",
      "- Study for 25 focused minutes, then recall from memory for 5 minutes.",
      "- Turn one lesson into 3 self-test questions.",
      "- End with one action you will take next.",
      "",
      activeCourses.length
        ? `Current course context available: ${activeCourses
            .slice(0, 3)
            .map((course) => `${course.title} (${course.progress ?? 0}%)`)
            .join(", ")}.`
        : "Course-aware live tutoring will become even better once the backend AI endpoint is restored.",
    ].join("\n");
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !token || isTyping) return;

    const prompt = input.trim();
    const userMsg = { id: Date.now(), text: prompt, sender: "user" };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setIsTyping(true);

    try {
      const data = await apiCall(apiEndpoints.ai.tutor, {
        method: "POST",
        body: {
          message: prompt,
          history: nextMessages
            .filter((msg) => msg.sender === "user" || msg.sender === "ai")
            .slice(-8)
            .map((msg) => ({
              role: msg.sender === "ai" ? "assistant" : "user",
              content: msg.text,
            })),
        },
      });

      console.log("AI tutor endpoint:", apiEndpoints.ai.tutor, data);

      if (data?.error || !data?.success) {
        const fallbackReply = buildFallbackTutorReply(prompt, courseContext);
        setError(
          "AI tutor is in smart offline mode right now. You can still study normally.",
        );
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: fallbackReply,
            sender: "ai",
          },
        ]);
        return;
      }

      setCourseContext(data.context?.enrolled_courses || []);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: data.reply,
          sender: "ai",
        },
      ]);
    } catch (err) {
      const fallbackReply = buildFallbackTutorReply(prompt, courseContext);
      setError(
        "AI tutor is in smart offline mode right now. You can still study normally.",
      );
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: fallbackReply,
          sender: "ai",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickPrompts = [
    "Explain a difficult concept from my enrolled courses",
    "Quiz me on what I should study next",
    "Help me make a study plan for this week",
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto h-[calc(100vh-120px)] flex gap-6">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Bot size={28} />
            </div>
            <div>
              <h1
                className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
              >
                Academic AI Tutor
              </h1>
              <p className="text-xs text-green-500 font-bold flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Live tutor with course context
              </p>
            </div>
          </div>
          <div className="hidden md:flex gap-2">
            <button
              type="button"
              onClick={() =>
                setInput(
                  "Summarize what I should focus on in my enrolled courses right now.",
                )
              }
              className={`p-2 rounded-xl border ${darkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"}`}
              title="Summarize study priorities"
            >
              <Brain size={20} />
            </button>
            <button
              type="button"
              onClick={() =>
                setInput(
                  "Give me a short quiz based on my current learning progress.",
                )
              }
              className={`p-2 rounded-xl border ${darkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"}`}
              title="Quiz me"
            >
              <Sparkles size={20} />
            </button>
          </div>
        </div>

        {showPrerequisiteWarning && !isWarningDismissed && (
          <div
            className={`mb-4 flex items-start gap-3 rounded-2xl p-4 ${
              darkMode
                ? "border border-amber-700 bg-amber-900/20 text-amber-300"
                : "border border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            <AlertTriangle size={24} className="text-amber-500 mt-0.5" />
            <div>
              <h3 className="font-bold">Build Your Foundation First</h3>
              <p className="text-sm mt-1">We noticed you're enrolled in intermediate or advanced courses but haven't completed a beginner course yet. We strongly recommend mastering the fundamentals to get the most out of your learning path.</p>
              {beginnerCourse && (
                <button
                  onClick={() => navigate(`/course-player/${beginnerCourse.id}`)}
                  className={`mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    darkMode
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'bg-amber-500 text-white hover:bg-amber-600'
                  }`}
                >
                  Go to Your Beginner Course <ArrowRight size={16} />
                </button>
              )}
              <button
                onClick={() => setIsWarningDismissed(true)}
                className={`ml-3 mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div
          className={`flex-1 overflow-y-auto mb-4 p-6 rounded-3xl border transition-all ${darkMode ? "bg-gray-900 border-gray-800 shadow-inner" : "bg-white border-gray-100 shadow-sm"}`}
        >
          <div className="space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl whitespace-pre-wrap ${
                    msg.sender === "user"
                      ? "bg-indigo-600 text-white rounded-tr-none"
                      : darkMode
                        ? "bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700"
                        : "bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div
                  className={`p-4 rounded-2xl rounded-tl-none ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}
                >
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setInput(prompt)}
              className={`px-4 py-2 rounded-full text-sm border ${darkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              {prompt}
            </button>
          ))}
        </div>

        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your tutor anything about your courses..."
            className={`w-full pl-6 pr-16 py-4 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
              darkMode
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-100 text-gray-900 shadow-lg"
            }`}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            <Send size={20} />
          </button>
        </form>
      </div>

      <aside
        className={`hidden xl:block w-80 rounded-3xl border p-5 ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100 shadow-sm"}`}
      >
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={18} className="text-indigo-500" />
          <h2
            className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
          >
            Enrolled course context
          </h2>
        </div>
        {courseContext.length === 0 ? (
          <div
            className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Start a conversation to load your enrolled course context for the
            tutor.
          </div>
        ) : (
          <div className="space-y-3">
            {courseContext.map((course) => (
              <div
                key={course.id}
                className={`rounded-2xl border p-4 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-100"}`}
              >
                <div className="flex items-start gap-3">
                  <MessageSquare size={16} className="text-indigo-500 mt-1" />
                  <div>
                    <p
                      className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}
                    >
                      {course.title}
                    </p>
                    <p
                      className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {course.level} · {course.category}
                    </p>
                    <p className="text-xs mt-2 text-indigo-500 font-semibold">
                      Progress: {course.progress}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
};

export default AITutorPage;
