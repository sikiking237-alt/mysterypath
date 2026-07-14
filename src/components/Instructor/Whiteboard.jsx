import React, { useRef, useState, useEffect } from "react";
import {
  Eraser,
  Pencil,
  Trash2,
  Download,
  Undo,
  Redo,
  Minus,
  Plus,
  X,
  MousePointer2,
  Zap,
  Lock,
  Unlock,
  Image as ImageIcon,
  FileImage,
  Grid3X3,
  Video,
  CirclePlay,
  Save,
  Upload,
  Pause,
  Play,
} from "lucide-react";
import { io } from "socket.io-client";
import createSocket from "../../utils/socketClient";

const Whiteboard = ({
  darkMode,
  onClose,
  roomId = "general-class",
  isInstructor = false,
}) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const socketRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState(darkMode ? "#ffffff" : "#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [remotePointers, setRemotePointers] = useState({});
  const [laserTrails, setLaserTrails] = useState({}); // { userId: [{x, y, time}, ...] }
  const [studentPermissions, setStudentPermissions] = useState({
    laser: true,
    drawing: true,
  });
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [showGrid, setShowGrid] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedEvents, setRecordedStrokes] = useState([]);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayCurrentTime, setReplayCurrentTime] = useState(0);
  const [replayTotalTime, setReplayTotalTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("connected");
  const permissionsRef = useRef(studentPermissions);
  const recordingStartTime = useRef(null);
  const replayFileInputRef = useRef(null);
  const activeTimeoutsRef = useRef([]);
  const replayEventsRef = useRef([]);
  const replayIntervalRef = useRef(null);
  const gridRef = useRef(showGrid);
  const bgRef = useRef(null);
  const bgInputRef = useRef(null);
  const lastPos = useRef({ x: 0, y: 0 });

  // Keep refs in sync with state for socket event handlers
  useEffect(() => {
    permissionsRef.current = studentPermissions;
  }, [studentPermissions]);

  useEffect(() => {
    gridRef.current = showGrid;
  }, [showGrid]);

  useEffect(() => {
    bgRef.current = backgroundImage;
  }, [backgroundImage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 2;
    canvas.height = (window.innerHeight - 64) * 2;
    canvas.style.width = "100%";
    canvas.style.height = "100%";

    const context = canvas.getContext("2d");
    context.scale(2, 2);
    context.lineCap = "round";
    context.strokeStyle = color;
    context.lineWidth = brushSize;
    contextRef.current = context;

    saveToHistory();

    // Initialize Socket Connection
    socketRef.current = createSocket({
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socketRef.current.on("connect", () => {
      if (socketRef.current.recovered) {
        setConnectionStatus("connected");
      } else {
        socketRef.current.emit("join-whiteboard", roomId);
        if (!isInstructor) {
          setConnectionStatus("syncing");
          socketRef.current.emit("request-whiteboard-state", roomId);
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

    socketRef.current.on("draw-segment", (data) => {
      drawSegment(
        data.x0,
        data.y0,
        data.x1,
        data.y1,
        data.color,
        data.size,
        false,
      );
    });

    socketRef.current.on("pointer-move", (data) => {
      setRemotePointers((prev) => ({ ...prev, [data.userId]: data }));
    });

    socketRef.current.on("laser-move", (data) => {
      setRemotePointers((prev) => ({ ...prev, [data.userId]: data }));
      setLaserTrails((prev) => ({
        ...prev,
        [data.userId]: [
          ...(prev[data.userId] || []),
          { x: data.x, y: data.y, time: Date.now() },
        ],
      }));
    });

    socketRef.current.on("update-background", (data) => {
      setBackgroundImage(data.imageUrl);
    });

    socketRef.current.on("update-grid", (data) => {
      setShowGrid(data.enabled);
    });

    // State Synchronization Logic (Handshake)
    if (isInstructor) {
      socketRef.current.on("request-whiteboard-state", () => {
        socketRef.current.emit("sync-whiteboard-state", {
          roomId,
          permissions: permissionsRef.current,
          backgroundImage: bgRef.current,
          showGrid: gridRef.current,
        });
      });
    }

    socketRef.current.on("sync-whiteboard-state", (data) => {
      setStudentPermissions(data.permissions);
      setBackgroundImage(data.backgroundImage);
      setShowGrid(data.showGrid);
      setConnectionStatus("connected");

      if (!isInstructor) {
        setTool((current) => {
          if (current === "laser" && !data.permissions.laser) return "pointer";
          if (
            (current === "pencil" || current === "eraser") &&
            !data.permissions.drawing
          )
            return "pointer";
          return current;
        });
      }
    });

    socketRef.current.on("update-permissions", (permissions) => {
      setStudentPermissions(permissions);
      if (!isInstructor) {
        setTool((current) => {
          if (current === "laser" && !permissions.laser) return "pointer";
          if (
            (current === "pencil" || current === "eraser") &&
            !permissions.drawing
          )
            return "pointer";
          return current;
        });
      }
    });

    socketRef.current.on("pointer-leave", (userId) => {
      setRemotePointers((prev) => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    });

    socketRef.current.on("clear-whiteboard", () => {
      const canvas = canvasRef.current;
      contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      socketRef.current.disconnect();
      activeTimeoutsRef.current.forEach(clearTimeout);
      if (replayIntervalRef.current) clearInterval(replayIntervalRef.current);
    };
  }, [roomId]);

  const togglePermission = (type) => {
    const newPermissions = {
      ...studentPermissions,
      [type]: !studentPermissions[type],
    };
    setStudentPermissions(newPermissions);
    socketRef.current.emit("update-permissions", {
      roomId,
      permissions: newPermissions,
    });
  };

  const recordEvent = (type, data) => {
    if (!isRecording) return;
    setRecordedStrokes((prev) => [
      ...prev,
      {
        type,
        timestamp: Date.now() - recordingStartTime.current,
        data,
      },
    ]);
  };

  const toggleGrid = () => {
    const newState = !showGrid;
    setShowGrid(newState);
    socketRef.current.emit("update-grid", { roomId, enabled: newState });
    recordEvent("grid", { enabled: newState });
  };

  const handleBgUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024)
        return alert("Image too large (max 2MB)");
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        setBackgroundImage(dataUrl);
        socketRef.current.emit("update-background", {
          roomId,
          imageUrl: dataUrl,
        });
        recordEvent("bg", { imageUrl: dataUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBackground = () => {
    setBackgroundImage(null);
    socketRef.current.emit("update-background", { roomId, imageUrl: null });
    recordEvent("bg", { imageUrl: null });
  };

  // Trail fading logic
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setLaserTrails((prev) => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach((id) => {
          const filtered = next[id].filter((p) => now - p.time < 800); // 800ms trail duration
          if (filtered.length !== next[id].length) changed = true;
          next[id] = filtered;
        });
        return changed ? next : prev;
      });
    }, 40);
    return () => clearInterval(cleanup);
  }, []);

  const drawSegment = (
    x0,
    y0,
    x1,
    y1,
    strokeColor,
    strokeSize,
    emit = true,
  ) => {
    const context = contextRef.current;
    context.beginPath();
    context.strokeStyle = strokeColor;
    context.lineWidth = strokeSize;
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.stroke();
    context.closePath();

    if (emit) {
      socketRef.current.emit("draw-segment", {
        roomId,
        x0,
        y0,
        x1,
        y1,
        color: strokeColor,
        size: strokeSize,
      });
      recordEvent("draw", {
        x0,
        y0,
        x1,
        y1,
        color: strokeColor,
        size: strokeSize,
      });
    }
  };

  const startRecording = () => {
    if (!window.confirm("Start recording drawing strokes?")) return;
    setRecordedStrokes([]);
    recordingStartTime.current = Date.now();
    setIsRecording(true);
    // Capture initial state
    recordEvent("grid", { enabled: showGrid });
    recordEvent("bg", { imageUrl: backgroundImage });
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const saveRecording = () => {
    const blob = new Blob([JSON.stringify(recordedEvents)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `whiteboard-replay-${new Date().getTime()}.json`;
    link.click();
  };

  const handleLoadReplay = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const events = JSON.parse(event.target.result);
          replaySequence(events);
        } catch (err) {
          alert("Invalid replay file");
        }
      };
      reader.readAsText(file);
    }
  };

  const formatTimeLabel = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const replaySequence = (events, startTimeOffset = 0) => {
    if (events.length === 0) return;

    // Clear any previous replay timers
    activeTimeoutsRef.current.forEach(clearTimeout);
    activeTimeoutsRef.current = [];
    if (replayIntervalRef.current) clearInterval(replayIntervalRef.current);

    setIsReplaying(true);
    setIsPaused(false);
    replayEventsRef.current = events;

    if (startTimeOffset === 0) {
      setReplayCurrentTime(0);
      contextRef.current.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height,
      );
    }

    const totalDuration = events[events.length - 1].timestamp;
    setReplayTotalTime(totalDuration);

    const timerStart = Date.now() - startTimeOffset;
    replayIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - timerStart;
      setReplayCurrentTime(Math.min(elapsed, totalDuration));
      if (elapsed >= totalDuration) {
        clearInterval(replayIntervalRef.current);
        setIsReplaying(false);
      }
    }, 100);

    const remainingEvents = events.filter(
      (e) => e.timestamp >= startTimeOffset,
    );

    if (remainingEvents.length === 0) {
      setIsReplaying(false);
      clearInterval(replayIntervalRef.current);
      return;
    }

    remainingEvents.forEach((event, index) => {
      const timeoutId = setTimeout(() => {
        switch (event.type) {
          case "draw":
            drawSegment(
              event.data.x0,
              event.data.y0,
              event.data.x1,
              event.data.y1,
              event.data.color,
              event.data.size,
              false,
            );
            break;
          case "clear":
            contextRef.current.clearRect(
              0,
              0,
              canvasRef.current.width,
              canvasRef.current.height,
            );
            break;
          case "bg":
            setBackgroundImage(event.data.imageUrl);
            break;
          case "grid":
            setShowGrid(event.data.enabled);
            break;
          default:
            break;
        }
        if (index === remainingEvents.length - 1) {
          setIsReplaying(false);
          if (replayIntervalRef.current)
            clearInterval(replayIntervalRef.current);
        }
      }, event.timestamp - startTimeOffset);
      activeTimeoutsRef.current.push(timeoutId);
    });
  };

  const handleTogglePause = () => {
    if (isPaused) {
      replaySequence(replayEventsRef.current, replayCurrentTime);
    } else {
      setIsPaused(true);
      activeTimeoutsRef.current.forEach(clearTimeout);
      activeTimeoutsRef.current = [];
      if (replayIntervalRef.current) clearInterval(replayIntervalRef.current);
    }
  };

  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle =
        tool === "eraser" ? (darkMode ? "#030712" : "#ffffff") : color;
      contextRef.current.lineWidth = brushSize;
    }
  }, [color, brushSize, tool, darkMode]);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    const imageData = contextRef.current.getImageData(
      0,
      0,
      canvas.width,
      canvas.height,
    );
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, imageData];
    });
    setHistoryIndex((prev) => prev + 1);
  };

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    lastPos.current = { x: offsetX, y: offsetY };
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveToHistory();
  };

  const handleMouseLeave = () => {
    finishDrawing();
    if (tool === "pointer") {
      socketRef.current.emit("pointer-leave", {
        roomId,
        userId: socketRef.current.id,
      });
    }
  };

  const draw = ({ nativeEvent }) => {
    const x = nativeEvent.offsetX;
    const y = nativeEvent.offsetY;

    if (tool === "pointer") {
      socketRef.current.emit("pointer-move", {
        roomId,
        x,
        y,
        userId: socketRef.current.id,
        color,
      });
      return;
    }

    if (tool === "laser") {
      if (!isInstructor && !studentPermissions.laser) return;
      const point = { x, y, time: Date.now() };
      setLaserTrails((prev) => ({
        ...prev,
        [socketRef.current.id]: [...(prev[socketRef.current.id] || []), point],
      }));
      socketRef.current.emit("laser-move", {
        roomId,
        x,
        y,
        userId: socketRef.current.id,
        color,
      });
      return;
    }

    if (!isDrawing) return;
    if (!isInstructor && !studentPermissions.drawing) return;

    const strokeColor =
      tool === "eraser" ? (darkMode ? "#030712" : "#ffffff") : color;

    drawSegment(
      lastPos.current.x,
      lastPos.current.y,
      x,
      y,
      strokeColor,
      brushSize,
    );
    lastPos.current = { x, y };
  };

  const clearCanvas = () => {
    if (!window.confirm("Clear entire whiteboard?")) return;
    const canvas = canvasRef.current;
    contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
    socketRef.current.emit("clear-whiteboard", roomId);
    recordEvent("clear", {});
    saveToHistory();
  };

  const downloadImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas to combine the background worksheet and the drawings
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    // 1. Fill Background Color (ensures visibility of white/black ink in image viewers)
    tempCtx.fillStyle = darkMode ? "#030712" : "#ffffff";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // 2. Draw Background Image if it exists
    if (backgroundImage) {
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = backgroundImage;
      });

      // Replicate the 'object-contain' logic from the UI (p-8 is 32px per side)
      // Since internal resolution is scaled by 2: 32px * 2 sides * scale 2 = 128px
      const totalPadding = 64 * 2;
      const availW = tempCanvas.width - totalPadding;
      const availH = tempCanvas.height - totalPadding;

      const imgRatio = img.width / img.height;
      const containerRatio = availW / availH;

      let drawW, drawH;
      if (imgRatio > containerRatio) {
        drawW = availW;
        drawH = availW / imgRatio;
      } else {
        drawH = availH;
        drawW = availH * imgRatio;
      }

      const offsetX = (tempCanvas.width - drawW) / 2;
      const offsetY = (tempCanvas.height - drawH) / 2;

      tempCtx.globalAlpha = 0.9; // Match the 90% opacity from the UI
      tempCtx.drawImage(img, offsetX, offsetY, drawW, drawH);
      tempCtx.globalAlpha = 1.0;
    }

    // 3. Overlay the main canvas content (the drawings)
    tempCtx.drawImage(canvas, 0, 0);

    // 4. Trigger download
    const link = document.createElement("a");
    link.download = `whiteboard-export-${new Date().getTime()}.png`;
    link.href = tempCanvas.toDataURL("image/png");
    link.click();
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      contextRef.current.putImageData(history[newIndex], 0, 0);
      setHistoryIndex(newIndex);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      contextRef.current.putImageData(history[newIndex], 0, 0);
      setHistoryIndex(newIndex);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[60] flex flex-col ${darkMode ? "bg-gray-950" : "bg-gray-100"}`}
    >
      {/* Toolbar */}
      <div
        className={`flex items-center justify-between p-3 border-b ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}
      >
        <div className="flex items-center gap-4">
          <h2
            className={`font-bold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}
          >
            <Pencil className="text-purple-500" size={20} /> Live Whiteboard
          </h2>

          {isInstructor && (
            <div className="flex items-center gap-1 bg-gray-500/10 p-1 rounded-xl ml-2">
              <button
                onClick={() => togglePermission("drawing")}
                className={`p-1.5 rounded-lg transition ${studentPermissions.drawing ? "text-green-500 hover:bg-gray-700" : "text-red-500 hover:bg-gray-700"}`}
                title={
                  studentPermissions.drawing
                    ? "Student Drawing: Allowed"
                    : "Student Drawing: Locked"
                }
              >
                {studentPermissions.drawing ? (
                  <Unlock size={14} />
                ) : (
                  <Lock size={14} />
                )}
              </button>
              <button
                onClick={() => togglePermission("laser")}
                className={`p-1.5 rounded-lg transition ${studentPermissions.laser ? "text-green-500 hover:bg-gray-700" : "text-red-500 hover:bg-gray-700"}`}
                title={
                  studentPermissions.laser
                    ? "Student Laser: Allowed"
                    : "Student Laser: Locked"
                }
              >
                {studentPermissions.laser ? (
                  <Unlock size={14} />
                ) : (
                  <Lock size={14} />
                )}
              </button>
            </div>
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

          <div className="flex items-center gap-1 bg-gray-500/10 p-1 rounded-xl">
            <button
              onClick={toggleGrid}
              className={`p-2 rounded-lg transition ${showGrid ? "bg-purple-600 text-white" : "text-gray-400 hover:bg-gray-700"}`}
              title="Toggle Grid View"
            >
              <Grid3X3 size={18} />
            </button>
            <button
              onClick={() => replayFileInputRef.current?.click()}
              className={`p-2 rounded-lg transition text-gray-400 hover:bg-gray-700 hover:text-white`}
              title="Load Replay"
              disabled={isRecording || isReplaying}
            >
              <Upload size={18} />
            </button>
            <input
              type="file"
              ref={replayFileInputRef}
              className="hidden"
              accept=".json"
              onChange={handleLoadReplay}
            />
          </div>

          <div className="flex items-center gap-1 bg-gray-500/10 p-1 rounded-xl">
            {isInstructor && (
              <div className="flex items-center gap-1 border-r border-gray-700 pr-1 mr-1">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition"
                    disabled={isReplaying}
                    title="Record Session"
                  >
                    <Video size={18} />
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="p-2 rounded-lg bg-red-600 text-white animate-pulse"
                    title="Stop Recording"
                  >
                    <div className="w-3 h-3 bg-white rounded-sm" />
                  </button>
                )}
                {recordedEvents.length > 0 && !isRecording && (
                  <>
                    <button
                      onClick={saveRecording}
                      className="p-2 rounded-lg text-green-500 hover:bg-green-500/10 transition"
                      disabled={isReplaying}
                      title="Save Recording"
                    >
                      <Save size={18} />
                    </button>
                    <button
                      onClick={() => replaySequence(recordedEvents)}
                      className="p-2 rounded-lg text-blue-500 hover:bg-blue-500/10 transition"
                      disabled={isReplaying}
                      title="Preview Replay"
                    >
                      <CirclePlay size={18} />
                    </button>
                  </>
                )}
              </div>
            )}
            {isInstructor && (
              <>
                <button
                  onClick={() => bgInputRef.current?.click()}
                  className="p-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition"
                  title="Upload Worksheet Background"
                >
                  <ImageIcon size={18} />
                </button>
                <input
                  type="file"
                  ref={bgInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleBgUpload}
                />
                {backgroundImage && (
                  <button
                    onClick={removeBackground}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition"
                    title="Remove Background"
                  >
                    <FileImage size={18} />
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => setTool("pencil")}
              disabled={!isInstructor && !studentPermissions.drawing}
              className={`p-2 rounded-lg transition ${tool === "pencil" ? "bg-purple-600 text-white" : "text-gray-400 hover:bg-gray-700"} disabled:opacity-20`}
              title="Brush"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={() => setTool("eraser")}
              disabled={!isInstructor && !studentPermissions.drawing}
              className={`p-2 rounded-lg transition ${tool === "eraser" ? "bg-purple-600 text-white" : "text-gray-400 hover:bg-gray-700"} disabled:opacity-20`}
              title="Eraser"
            >
              <Eraser size={18} />
            </button>
            <button
              onClick={() => setTool("pointer")}
              className={`p-2 rounded-lg transition ${tool === "pointer" ? "bg-purple-600 text-white" : "text-gray-400 hover:bg-gray-700"}`}
              title="Pointer"
            >
              <MousePointer2 size={18} />
            </button>
            <button
              onClick={() => setTool("laser")}
              disabled={!isInstructor && !studentPermissions.laser}
              className={`p-2 rounded-lg transition ${tool === "laser" ? "bg-purple-600 text-white" : "text-gray-400 hover:bg-gray-700"} disabled:opacity-20`}
              title="Laser Pointer"
            >
              <Zap size={18} />
            </button>
          </div>

          <div className="flex items-center gap-3 border-x border-gray-700 px-4">
            <input
              type="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                setTool("pencil");
              }}
              className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBrushSize(Math.max(1, brushSize - 2))}
                className="p-1 text-gray-400 hover:text-purple-500"
              >
                <Minus size={14} />
              </button>
              <div
                className={`w-8 text-center text-xs font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
              >
                {brushSize}px
              </div>
              <button
                onClick={() => setBrushSize(Math.min(50, brushSize + 2))}
                className="p-1 text-gray-400 hover:text-purple-500"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-500/10 disabled:opacity-20"
              title="Undo"
            >
              <Undo size={18} />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-500/10 disabled:opacity-20"
              title="Redo"
            >
              <Redo size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadImage}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600/10 text-green-600 rounded-lg text-xs font-bold hover:bg-green-600 hover:text-white transition"
          >
            <Download size={14} /> Export
          </button>
          <button
            onClick={clearCanvas}
            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition"
            title="Clear All"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={onClose}
            className="ml-4 p-2 text-gray-400 hover:bg-gray-500/10 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div
        className={`flex-1 relative cursor-crosshair overflow-hidden ${darkMode ? "bg-[#030712]" : "bg-white"}`}
      >
        {/* Replay Timeline Overlay */}
        {isReplaying && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[70] w-full max-w-xl px-4 pointer-events-none">
            <div
              className={`p-4 rounded-2xl shadow-2xl border ${darkMode ? "bg-gray-900/90 border-gray-700" : "bg-white/90 border-gray-200"} backdrop-blur-md pointer-events-auto`}
            >
              <div className="flex items-center gap-4 mb-2">
                <button
                  onClick={handleTogglePause}
                  className="p-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition shadow-lg shrink-0"
                  title={isPaused ? "Resume" : "Pause"}
                >
                  {isPaused ? (
                    <Play size={18} fill="currentColor" />
                  ) : (
                    <Pause size={18} fill="currentColor" />
                  )}
                </button>
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 transition-all duration-100 ease-linear"
                    style={{
                      width: `${(replayCurrentTime / (replayTotalTime || 1)) * 100}%`,
                    }}
                  />
                </div>
                <div
                  className={`text-[10px] font-mono font-bold ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  {formatTimeLabel(replayCurrentTime)} /{" "}
                  {formatTimeLabel(replayTotalTime)}
                </div>
              </div>
              <div className="text-[9px] text-center uppercase tracking-[0.2em] font-bold text-purple-500">
                {isPaused ? "Playback Paused" : "Playback Active"}
              </div>
            </div>
          </div>
        )}

        {/* Grid Layer */}
        {showGrid && (
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              backgroundImage: `linear-gradient(${darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} 1px, transparent 1px), linear-gradient(90deg, ${darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
        )}

        {/* Background Image Layer */}
        {backgroundImage && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 p-8">
            <img
              src={backgroundImage}
              alt="Worksheet Background"
              className="max-w-full max-h-full object-contain opacity-90 shadow-2xl transition-opacity duration-500"
            />
          </div>
        )}

        <canvas
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing}
          onMouseMove={draw}
          onMouseLeave={handleMouseLeave}
          ref={canvasRef}
          className="relative z-10 bg-transparent"
        />

        {/* Laser Trails Overlay */}
        <svg className="absolute inset-0 pointer-events-none w-full h-full z-20">
          {Object.entries(laserTrails).map(([userId, points]) => (
            <polyline
              key={userId}
              points={points.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke={remotePointers[userId]?.color || color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: "blur(1px)", opacity: 0.8 }}
            />
          ))}
        </svg>

        {/* Remote Pointers */}
        {Object.values(remotePointers).map((ptr) => (
          <div
            key={ptr.userId}
            className="absolute pointer-events-none transition-all duration-75 z-30"
            style={{ left: ptr.x, top: ptr.y, color: ptr.color }}
          >
            <MousePointer2 size={24} fill="currentColor" />
            <span className="ml-4 px-2 py-0.5 rounded bg-black/50 text-white text-[10px] whitespace-nowrap">
              Participant
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Whiteboard;
