// frontend/src/components/AIAssistant.jsx
import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  FileText,
  HelpCircle,
  Plus,
  X,
  Brain,
  Zap,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { apiEndpoints } from "../config/apiConfig";

const AIAssistant = ({ darkMode, type = "instructor" }) => {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [level, setLevel] = useState("beginner");

  const token = localStorage.getItem("token");

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem(`ai_history_${type}`);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Error loading history:", e);
      }
    }
  }, [type]);

  // Save history to localStorage
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem(`ai_history_${type}`, JSON.stringify(history));
    }
  }, [history, type]);

  const handleGenerate = async () => {
    if (!input.trim()) {
      setError("Please enter a topic");
      return;
    }

    setLoading(true);
    setError("");
    setResult("");

    try {
      let endpoint = "";
      let body = {};

      if (type === "notes") {
        endpoint = apiEndpoints.ai.generateNotes;
        body = {
          topic: input,
          context: "Course content preparation",
          level: level,
        };
      } else if (type === "questions") {
        endpoint = apiEndpoints.ai.generateQuestions;
        body = {
          topic: input,
          difficulty: difficulty,
          count: questionCount,
        };
      } else if (type === "explain") {
        endpoint = apiEndpoints.ai.explainTopic;
        body = {
          topic: input,
          level: level,
        };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        let content = "";
        if (type === "questions" && data.questions) {
          content = formatQuestions(data.questions);
        } else {
          content =
            data.notes ||
            data.explanation ||
            data.content ||
            JSON.stringify(data, null, 2);
        }

        setResult(content);

        // Add to history
        const newEntry = {
          id: Date.now(),
          topic: input,
          result: content,
          type: type,
          timestamp: new Date().toISOString(),
          difficulty: difficulty,
          level: level,
        };
        setHistory([newEntry, ...history.slice(0, 19)]); // Keep last 20
      } else {
        setError(data.error || "Failed to generate content");
      }
    } catch (err) {
      setError(
        "Error connecting to AI service. Please make sure the backend is running.",
      );
      console.error("AI Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatQuestions = (questions) => {
    if (!Array.isArray(questions)) return JSON.stringify(questions, null, 2);

    return questions
      .map((q, i) => {
        let text = `**Question ${i + 1}:** ${q.question_text || q.question}\n`;
        if (q.options && Array.isArray(q.options)) {
          q.options.forEach((opt, oi) => {
            const letter = String.fromCharCode(65 + oi); // A, B, C, D
            text += `  ${letter}. ${opt.option_text || opt.text}${opt.is_correct ? " ✅" : ""}\n`;
          });
        }
        if (q.points) text += `  *Points: ${q.points}*\n`;
        text += "\n";
        return text;
      })
      .join("");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearHistory = () => {
    if (window.confirm("Clear all history?")) {
      setHistory([]);
      localStorage.removeItem(`ai_history_${type}`);
    }
  };

  const loadFromHistory = (entry) => {
    setInput(entry.topic);
    setResult(entry.result);
    setShowHistory(false);
  };

  const getPlaceholder = () => {
    if (type === "notes")
      return 'Enter a topic to generate course notes... (e.g., "React Hooks")';
    if (type === "questions")
      return 'Enter a topic to generate quiz questions... (e.g., "JavaScript Arrays")';
    return 'Enter a topic to get an explanation... (e.g., "What is CSS Grid?")';
  };

  const getButtonText = () => {
    if (type === "notes") return "Generate Notes";
    if (type === "questions") return "Generate Questions";
    return "Explain Topic";
  };

  const getIcon = () => {
    if (type === "notes") return <BookOpen className="w-5 h-5" />;
    if (type === "questions") return <HelpCircle className="w-5 h-5" />;
    return <Brain className="w-5 h-5" />;
  };

  const getTitle = () => {
    if (type === "notes") return "AI Notes Generator";
    if (type === "questions") return "AI Question Generator";
    return "AI Topic Explainer";
  };

  const getDescription = () => {
    if (type === "notes")
      return "Generate comprehensive course notes on any topic";
    if (type === "questions")
      return "Create quiz questions with multiple choice options";
    return "Get simple explanations of complex topics";
  };

  return (
    <div
      className={`p-6 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`p-2 rounded-lg ${darkMode ? "bg-purple-900/30" : "bg-purple-100"}`}
          >
            {getIcon()}
          </div>
          <div>
            <h3
              className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}
            >
              {getTitle()}
            </h3>
            <p
              className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              {getDescription()}
            </p>
          </div>
        </div>
        <Sparkles
          className={`w-5 h-5 ${darkMode ? "text-purple-400" : "text-purple-600"}`}
        />
      </div>

      <div className="space-y-4">
        {/* Settings for different modes */}
        {type === "questions" && (
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[120px]">
              <label
                className={`block text-xs font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
              >
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-gray-50 border-gray-200"
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <label
                className={`block text-xs font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
              >
                Questions
              </label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-gray-50 border-gray-200"
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
              >
                {[3, 5, 10, 15, 20].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {(type === "notes" || type === "explain") && (
          <div>
            <label
              className={`block text-xs font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              Level
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-gray-50 border-gray-200"
              } focus:outline-none focus:ring-2 focus:ring-purple-500`}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        )}

        {/* Input */}
        <div>
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={getPlaceholder()}
              className={`w-full p-3 pr-10 rounded-lg border resize-none h-20 ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                  : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500"
              } focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition`}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
            />
            <button
              onClick={() => setInput("")}
              className={`absolute top-2 right-2 p-1 rounded-lg transition ${
                input ? "opacity-100" : "opacity-0 pointer-events-none"
              } ${darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"}`}
            >
              <X
                className={`w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              />
            </button>
          </div>
          <p
            className={`text-xs mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}
          >
            Press Enter to generate (Shift+Enter for new line)
          </p>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !input.trim()}
          className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition ${
            loading || !input.trim()
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg text-white"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              {getButtonText()}
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div
            className={`p-3 rounded-lg flex items-start gap-2 ${
              darkMode
                ? "bg-red-900/30 text-red-300 border border-red-800"
                : "bg-red-50 text-red-600 border border-red-200"
            }`}
          >
            <span className="text-sm">⚠️</span>
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Result */}
        {result && (
          <div
            className={`mt-4 p-4 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}
          >
            <div className="flex justify-between items-center mb-3">
              <span
                className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}
              >
                Generated Content
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className={`p-1.5 rounded-lg transition ${darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"}`}
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setResult("")}
                  className={`p-1.5 rounded-lg transition ${darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"}`}
                  title="Clear result"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div
              className={`max-h-96 overflow-y-auto text-sm whitespace-pre-wrap ${darkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              {result}
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div>
            <div
              onClick={() => setShowHistory(!showHistory)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowHistory(!showHistory);
                }
              }}
              role="button"
              tabIndex={0}
              className={`w-full flex items-center justify-between p-2 rounded-lg transition cursor-pointer ${
                darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
              }`}
            >
              <span
                className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}
              >
                History ({history.length})
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearHistory();
                  }}
                  className={`text-xs ${darkMode ? "text-red-400 hover:text-red-300" : "text-red-500 hover:text-red-700"}`}
                >
                  Clear All
                </button>
                {showHistory ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </div>

            {showHistory && (
              <div
                className={`mt-2 max-h-48 overflow-y-auto space-y-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                {history.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => loadFromHistory(entry)}
                    className={`w-full text-left p-2 rounded-lg text-sm transition ${
                      darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{entry.topic}</span>
                      <span
                        className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}
                      >
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;
