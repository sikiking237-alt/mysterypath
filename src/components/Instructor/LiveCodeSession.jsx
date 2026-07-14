import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  Code2,
  Layout,
  Lock,
  Unlock,
  Download,
  Terminal,
  Trash2,
  RotateCcw,
  GitCompare,
} from "lucide-react";
import Editor, { DiffEditor } from "@monaco-editor/react";
import { io } from "socket.io-client";
import createSocket from "../../utils/socketClient";

const STARTER_CODE = {
  html: "<h1>Live Coding Session</h1>\n<p>Start typing to collaborate!</p>",
  css: "body { font-family: sans-serif; padding: 20px; }\nh1 { color: #6366f1; }",
  js: 'console.log("Live coding initialized!");',
};

const LiveCodeSession = ({
  darkMode,
  onClose,
  roomId = "live-code-room",
  isInstructor = false,
}) => {
  const [code, setCode] = useState(STARTER_CODE);
  const [activeTab, setActiveTab] = useState("html");
  const [canEdit, setCanEdit] = useState(isInstructor);
  const [studentPermissions, setStudentPermissions] = useState({
    canEdit: false,
  });
  const [showDiff, setShowDiff] = useState(false);
  const [logs, setLogs] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("connected"); // 'connected', 'disconnected', 'reconnecting', 'syncing'
  const socketRef = useRef(null);
  const codeRef = useRef(code);
  const permissionsRef = useRef(studentPermissions);
  const debounceTimerRef = useRef({});

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    permissionsRef.current = studentPermissions;
  }, [studentPermissions]);

  useEffect(() => {
    // Initialize Socket Connection
    socketRef.current = createSocket({
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socketRef.current.on("connect", () => {
      // If recovered is true, the server has already restored our room state and missed events
      if (socketRef.current.recovered) {
        setConnectionStatus("connected");
      } else {
        socketRef.current.emit("join-live-code", roomId);
        if (!isInstructor) {
          setConnectionStatus("syncing");
          socketRef.current.emit("request-coding-state", roomId);
        } else {
          setConnectionStatus("connected");
        }
      }
    });

    socketRef.current.on("disconnect", () =>
      setConnectionStatus("disconnected"),
    );
    socketRef.current.io.on("reconnect_attempt", () =>
      setConnectionStatus("reconnecting"),
    );

    socketRef.current.on("code-update", (data) => {
      if (data.userId !== socketRef.current.id) {
        setCode((prev) => ({ ...prev, [data.language]: data.value }));
      }
    });

    socketRef.current.on("update-coding-permissions", (permissions) => {
      setStudentPermissions(permissions);
      if (!isInstructor) setCanEdit(permissions.canEdit);
    });

    // State Synchronization Handshake (for late joiners)
    if (isInstructor) {
      socketRef.current.on("request-coding-state", () => {
        socketRef.current.emit("sync-coding-state", {
          roomId,
          code: codeRef.current,
          permissions: permissionsRef.current,
        });
      });
    }

    socketRef.current.on("sync-coding-state", (data) => {
      setCode(data.code);
      setStudentPermissions(data.permissions);
      if (!isInstructor) setCanEdit(data.permissions.canEdit);
      setConnectionStatus("connected");
    });

    return () => {
      socketRef.current.disconnect();
      Object.values(debounceTimerRef.current).forEach(clearTimeout);
    };
  }, [roomId, isInstructor]);

  // Listener for Iframe Console Messages
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === "CONSOLE_LOG") {
        const newLog = {
          id: Date.now() + Math.random(),
          logType: event.data.logType,
          content: event.data.content,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        };

        setLogs((prev) => [...prev.slice(-49), newLog]);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [roomId]);

  const handleCodeChange = (language, value) => {
    if (!canEdit && !isInstructor) return;

    setCode((prev) => ({ ...prev, [language]: value }));

    // Debounce the socket emission to reduce network traffic
    if (debounceTimerRef.current[language]) {
      clearTimeout(debounceTimerRef.current[language]);
    }

    debounceTimerRef.current[language] = setTimeout(() => {
      socketRef.current?.emit("code-update", {
        roomId,
        language,
        value,
        userId: socketRef.current.id,
      });
    }, 500);
  };

  const togglePermission = () => {
    const newPermissions = { canEdit: !studentPermissions.canEdit };
    setStudentPermissions(newPermissions);
    socketRef.current.emit("update-coding-permissions", {
      roomId,
      permissions: newPermissions,
    });
  };

  const handleReset = () => {
    if (
      !window.confirm(
        "Are you sure you want to reset all code to the starter template? This will affect everyone in the room.",
      )
    )
      return;

    setCode(STARTER_CODE);
    // Broadcast resets for all languages to ensure full synchronization across the room
    Object.keys(STARTER_CODE).forEach((lang) => {
      if (socketRef.current) {
        socketRef.current.emit("code-update", {
          roomId,
          language: lang,
          value: STARTER_CODE[lang],
          userId: socketRef.current.id,
        });
      }
    });
  };

  const downloadProject = () => {
    const combined = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Live Code Session Export</title>
  <style>${code.css}</style>
</head>
<body>
  ${code.html}
  <script>${code.js}</script>
</body>
</html>`;
    const blob = new Blob([combined], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `live-coding-${new Date().getTime()}.html`;
    link.click();
  };

  const previewDoc = useMemo(
    () => `
    <html>
      <head>
        <style>${code.css}</style>
        <script>
          (function() {
            const handleLog = (type, args) => {
              window.parent.postMessage({
                type: 'CONSOLE_LOG',
                logType: type,
                content: args.map(arg => {
                  try {
                    return typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg);
                  } catch(e) { return "[Unserializable Object]"; }
                }).join(' ')
              }, '*');
            };
            console.log = (...args) => handleLog('log', args);
            console.error = (...args) => handleLog('error', args);
            console.warn = (...args) => handleLog('warn', args);
            console.info = (...args) => handleLog('info', args);
            window.onerror = (msg, url, line) => handleLog('error', [msg + " (Line: " + line + ")"]);
          })();
        </script>
      </head>
      <body>
        ${code.html}
        <script>
          try {
            ${code.js}
          } catch (err) {
            console.error(err.message);
          }
        </script>
      </body>
    </html>
  `,
    [code.html, code.css, code.js],
  );

  return (
    <div
      className={`fixed inset-0 z-[60] flex flex-col ${darkMode ? "bg-gray-950" : "bg-gray-100"}`}
    >
      {/* Header Toolbar */}
      <div
        className={`flex items-center justify-between p-3 border-b ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}
      >
        <div className="flex items-center gap-4">
          <h2
            className={`font-bold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}
          >
            <Code2 className="text-indigo-500" size={20} /> Live Coding Platform
          </h2>

          {isInstructor && (
            <button
              onClick={togglePermission}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                studentPermissions.canEdit
                  ? "bg-green-600/10 text-green-500 border border-green-500/20"
                  : "bg-red-600/10 text-red-500 border border-red-500/20"
              }`}
            >
              {studentPermissions.canEdit ? (
                <Unlock size={14} />
              ) : (
                <Lock size={14} />
              )}
              {studentPermissions.canEdit
                ? "Students: Editing Enabled"
                : "Students: Editing Locked"}
            </button>
          )}

          {connectionStatus !== "connected" && (
            <div
              className={`flex items-center gap-2 px-2 py-1 rounded-md text-[10px] font-bold uppercase transition-colors animate-pulse ${
                connectionStatus === "syncing"
                  ? "bg-blue-500/10 text-blue-500"
                  : connectionStatus === "reconnecting"
                    ? "bg-yellow-500/10 text-yellow-600"
                    : "bg-red-500/10 text-red-500"
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${connectionStatus === "syncing" ? "bg-blue-500" : connectionStatus === "reconnecting" ? "bg-yellow-500" : "bg-red-500"}`}
              />
              {connectionStatus}...
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {(isInstructor || canEdit) && (
            <button
              onClick={handleReset}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                darkMode
                  ? "bg-orange-600/10 text-orange-500 border border-orange-500/20 hover:bg-orange-600/20"
                  : "bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100"
              }`}
            >
              <RotateCcw size={14} /> Reset Code
            </button>
          )}
          <button
            onClick={downloadProject}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/10 text-indigo-500 rounded-lg text-xs font-bold hover:bg-indigo-600 hover:text-white transition shadow-sm"
          >
            <Download size={14} /> Export HTML
          </button>
          <button
            onClick={onClose}
            className="ml-4 p-2 text-gray-400 hover:bg-gray-500/10 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Pane */}
        <div
          className={`w-1/2 flex flex-col border-r ${darkMode ? "border-gray-800" : "border-gray-200"}`}
        >
          <div
            className={`flex items-center justify-between border-b ${darkMode ? "bg-gray-900 border-gray-800" : "bg-gray-50 border-gray-200"}`}
          >
            <div className="flex">
              {["html", "css", "js"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
                    activeTab === tab
                      ? "text-indigo-500 bg-white dark:bg-gray-800"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowDiff(!showDiff)}
              className={`mr-4 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                showDiff
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800"
              }`}
              title="Compare with Starter Code"
            >
              <GitCompare size={14} />
              {showDiff ? "Hide Changes" : "View Changes"}
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            {showDiff ? (
              <DiffEditor
                height="100%"
                original={STARTER_CODE[activeTab]}
                modified={code[activeTab]}
                language={activeTab === "js" ? "javascript" : activeTab}
                theme={darkMode ? "vs-dark" : "light"}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: "'Fira Code', monospace",
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  renderSideBySide: true,
                }}
                loading={
                  <div className="flex items-center justify-center h-full text-gray-500 font-mono text-xs">
                    Loading Comparison...
                  </div>
                }
              />
            ) : (
              <Editor
                height="100%"
                language={activeTab === "js" ? "javascript" : activeTab}
                value={code[activeTab]}
                theme={darkMode ? "vs-dark" : "light"}
                onChange={(value) => handleCodeChange(activeTab, value || "")}
                options={{
                  readOnly: !isInstructor && !canEdit,
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: "'Fira Code', monospace",
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  padding: { top: 20 },
                  renderLineHighlight: "all",
                  suggestOnTriggerCharacters: true,
                  acceptSuggestionOnEnter: "on",
                }}
                loading={
                  <div className="flex items-center justify-center h-full text-gray-500 font-mono text-xs">
                    Initializing IDE...
                  </div>
                }
              />
            )}
          </div>
        </div>

        {/* Preview Pane */}
        <div
          className={`w-1/2 flex flex-col ${darkMode ? "bg-gray-900" : "bg-white"}`}
        >
          <div
            className={`flex items-center gap-2 px-4 py-2 border-b ${darkMode ? "bg-gray-900 border-gray-800" : "bg-gray-50 border-gray-200"}`}
          >
            <Layout size={14} className="text-gray-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Real-time Preview
            </span>
          </div>
          <iframe
            title="live-preview"
            srcDoc={previewDoc}
            className="flex-1 w-full border-none bg-white"
            sandbox="allow-scripts"
          />

          {/* Collaborative Console */}
          <div
            className={`h-1/3 flex flex-col border-t ${darkMode ? "bg-gray-950 border-gray-800" : "bg-gray-50 border-gray-200"}`}
          >
            <div
              className={`flex items-center justify-between px-4 py-2 border-b ${darkMode ? "bg-gray-900 border-gray-800" : "bg-gray-100 border-gray-200"}`}
            >
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-indigo-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Collaborative Console
                </span>
              </div>
              <button
                onClick={() => setLogs([])}
                className="text-gray-400 hover:text-red-500 transition"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300 ${log.logType === "error" ? "text-red-500" : log.logType === "warn" ? "text-yellow-500" : darkMode ? "text-indigo-300" : "text-gray-700"}`}
                >
                  <span className="opacity-30 shrink-0">[{log.timestamp}]</span>
                  <span className="break-all whitespace-pre-wrap">
                    {log.content}
                  </span>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-gray-500 italic opacity-50">
                  No output yet...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveCodeSession;
