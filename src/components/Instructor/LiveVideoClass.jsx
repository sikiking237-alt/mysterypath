// src/components/Instructor/LiveVideoClass.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  Video, VideoOff, Mic, MicOff, PhoneOff,
  Hand, MessageSquare, Send, X, ScreenShare,
  Volume2, VolumeX, Users, Code2
} from "lucide-react";
import { io } from "socket.io-client";
import createSocket from "../../utils/socketClient";
import Peer from "simple-peer";
import Editor from "@monaco-editor/react";

const LiveVideoClass = ({
  darkMode,
  onClose,
  roomId = "main-class",
  userName,
  isInstructor = false,
}) => {
  const [peers, setPeers] = useState([]);
  const [stream, setStream] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [peerStatus, setPeerStatus] = useState({});
  const [raisedHands, setRaisedHands] = useState({});
  const [userNames, setUserNames] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [spotlightedUser, setSpotlightedUser] = useState(null);
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState({
    html: '<h1>Live Coding Session</h1>\n<p>Start typing to collaborate!</p>',
    css: 'body { font-family: sans-serif; padding: 20px; }\nh1 { color: #6366f1; }',
    js: 'console.log("Live coding initialized!");',
  });
  const [activeCodeTab, setActiveCodeTab] = useState("html");
  const [canEditCode, setCanEditCode] = useState(isInstructor);

  const socketRef = useRef();
  const userVideo = useRef();
  const peersRef = useRef([]);
  const streamRef = useRef();

  useEffect(() => {
    const token = localStorage.getItem("token");
    socketRef.current = createSocket({
      transports: ["websocket", "polling"],
      withCredentials: true,
      query: { token },
    });

    const startMedia = async () => {
      try {
        const rawStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        setStream(rawStream);
        streamRef.current = rawStream;
        if (userVideo.current) {
          userVideo.current.srcObject = rawStream;
        }
        return rawStream;
      } catch (err) {
        console.error("Failed to get local stream:", err);
        return null;
      }
    };

    startMedia().then((currentStream) => {
      socketRef.current.emit("join-video-room", {
        roomId,
        userName: userName || "Instructor",
      });

      socketRef.current.emit("join-live-code", {
        roomId: `${roomId}-code`,
      });

      socketRef.current.on("all-users", (userDict) => {
        const peers = [];
        const names = {};
        Object.entries(userDict).forEach(([userID, name]) => {
          if (userID !== socketRef.current.id) {
            const peer = createPeer(
              userID,
              socketRef.current.id,
              currentStream,
            );
            peersRef.current.push({ peerID: userID, peer });
            peers.push({ peerID: userID, peer });
            names[userID] = name;
          }
        });
        setUserNames((prev) => ({ ...prev, ...names }));
        setPeers(peers);
      });

      socketRef.current.on("user-joined", (payload) => {
        const peer = addPeer(payload.signal, payload.callerID, currentStream);
        peersRef.current.push({ peerID: payload.callerID, peer });
        setUserNames((prev) => ({
          ...prev,
          [payload.callerID]: payload.userName,
        }));
        setPeers((users) => [...users, { peerID: payload.callerID, peer }]);
      });
    });

    socketRef.current.on("force-mute", () => {
      if (streamRef.current) {
        streamRef.current
          .getAudioTracks()
          .forEach((track) => (track.enabled = false));
        setIsMicOn(false);
      }
    });

    socketRef.current.on("receiving-returned-signal", (payload) => {
      const item = peersRef.current.find((p) => p.peerID === payload.id);
      if (item && item.peer) item.peer.signal(payload.signal);
    });

    socketRef.current.on("chat-message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socketRef.current.on("audio-status-changed", ({ userId, isMuted }) => {
      setPeerStatus((prev) => ({
        ...prev,
        [userId]: { ...prev[userId], isMuted },
      }));
    });

    socketRef.current.on("video-status-changed", ({ userId, isVideoOff }) => {
      setPeerStatus((prev) => ({
        ...prev,
        [userId]: { ...prev[userId], isVideoOff },
      }));
    });

    socketRef.current.on("hand-state-changed", ({ userId, isRaised }) => {
      setRaisedHands((prev) => ({ ...prev, [userId]: isRaised }));
    });

    socketRef.current.on("spotlight-changed", ({ userId, isSpotlighted }) => {
      setSpotlightedUser(isSpotlighted ? userId : null);
    });

    socketRef.current.on("recording-status-changed", ({ isRecording }) => {
      setIsRecording(isRecording);
    });

    socketRef.current.on("user-left", (id) => {
      const peerObj = peersRef.current.find((p) => p.peerID === id);
      if (peerObj && peerObj.peer) peerObj.peer.destroy();
      const peers = peersRef.current.filter((p) => p.peerID !== id);
      peersRef.current = peers;
      setPeers(peers);
      if (id === spotlightedUser) setSpotlightedUser(null);
      setRaisedHands((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setUserNames((prev) => {
        const n = { ...prev };
        delete n[id];
        return n;
      });
    });

    socketRef.current.on("code-update", (data) => {
      if (data.userId !== socketRef.current.id) {
        setCode((prev) => ({ ...prev, [data.language]: data.value }));
      }
    });

    socketRef.current.on("update-coding-permissions", (permissions) => {
      setCanEditCode(permissions.canEdit);
    });

    socketRef.current.on("sync-coding-state", (data) => {
      setCode(data.code);
      setCanEditCode(data.permissions.canEdit);
    });

    return () => {
      if (socketRef.current && roomId) {
        socketRef.current.emit("leave-video-room", { roomId });
        socketRef.current.emit("leave-live-code", { roomId: `${roomId}-code` });
        socketRef.current.disconnect();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [roomId]);

  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on("signal", (signal) => {
      socketRef.current.emit("sending-signal", {
        userToSignal,
        callerID,
        signal,
        userName,
      });
    });
    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({ initiator: false, trickle: false, stream });
    peer.on("signal", (signal) => {
      socketRef.current.emit("returning-signal", { signal, callerID });
    });
    peer.signal(incomingSignal);
    return peer;
  }

  const toggleMic = () => {
    const newState = !isMicOn;
    stream.getAudioTracks()[0].enabled = newState;
    setIsMicOn(newState);
    socketRef.current.emit("toggle-audio", { roomId, isMuted: !newState });
  };

  const toggleCamera = () => {
    const newState = !isCameraOn;
    stream.getVideoTracks()[0].enabled = newState;
    setIsCameraOn(newState);
    socketRef.current.emit("toggle-video", { roomId, isVideoOff: !newState });
  };

  const toggleRaiseHand = () => {
    const newState = !isHandRaised;
    setIsHandRaised(newState);
    socketRef.current.emit("raise-hand", { roomId, isRaised: newState });
  };

  const handleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          cursor: true,
        });
        const screenTrack = screenStream.getVideoTracks()[0];
        peersRef.current.forEach(({ peer }) => {
          peer.replaceTrack(stream.getVideoTracks()[0], screenTrack, stream);
        });
        setIsScreenSharing(true);
        socketRef.current.emit("toggle-spotlight", {
          roomId,
          isSpotlighted: true,
        });
        setSpotlightedUser(socketRef.current.id);
        screenTrack.onended = () => {
          setIsScreenSharing(false);
          socketRef.current.emit("toggle-spotlight", {
            roomId,
            isSpotlighted: false,
          });
          setSpotlightedUser(null);
        };
      } catch (error) {
        console.error("Failed to start screen share:", error);
      }
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    const msg = {
      sender: userName,
      text: messageInput,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      userId: socketRef.current.id,
    };
    socketRef.current.emit("send-chat-message", { roomId, message: msg });
    setMessages((prev) => [...prev, msg]);
    setMessageInput("");
  };

  const handleCodeChange = (language, value) => {
    if (!canEditCode) return;
    setCode((prev) => ({ ...prev, [language]: value }));
    socketRef.current?.emit("code-update", {
      roomId: `${roomId}-code`,
      language,
      value,
      userId: socketRef.current.id,
    });
  };

  const toggleCodeEdit = () => {
    const newCanEdit = !canEditCode;
    setCanEditCode(newCanEdit);
    socketRef.current?.emit("update-coding-permissions", {
      roomId: `${roomId}-code`,
      permissions: { canEdit: newCanEdit },
    });
  };

  const VideoCard = ({ peer, isHandRaised, isMuted, isVideoOff }) => {
    const ref = useRef();

    useEffect(() => {
      peer.on("stream", (stream) => {
        ref.current.srcObject = stream;
      });
    }, [peer]);

    return (
      <div className={`relative rounded-2xl overflow-hidden bg-gray-900 shadow-xl aspect-video border-2 transition-all duration-300 ${isHandRaised ? "border-yellow-500" : "border-transparent"}`}>
        {isVideoOff ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <VideoOff className="w-12 h-12 text-gray-500" />
          </div>
        ) : (
          <video playsInline autoPlay ref={ref} className="w-full h-full object-cover" />
        )}
        {isHandRaised && (
          <div className="absolute top-4 right-4 bg-yellow-500 p-2 rounded-full shadow-lg">
            <Hand className="text-white" size={16} />
          </div>
        )}
        {isMuted && (
          <div className="absolute top-4 left-4 p-1.5 bg-red-500 rounded-lg text-white">
            <MicOff size={12} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col ${darkMode ? "bg-gray-950 text-white" : "bg-gray-100 text-gray-900"}`}>
      {/* Header */}
      <div className={`p-4 flex justify-between items-center border-b ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Video className="text-white" size={20} />
          </div>
          <div>
            <h2 className="font-bold text-lg">Live Class Session</h2>
            <p className="text-xs text-purple-500 font-medium uppercase tracking-wider">{roomId}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition rounded-lg">
          <PhoneOff size={20} />
        </button>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
        {/* Local Video */}
        <div className="relative rounded-2xl overflow-hidden bg-gray-900 shadow-2xl border-2 border-purple-500/30 aspect-video">
          <video muted ref={userVideo} autoPlay playsInline className="w-full h-full object-cover mirror" />
          <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-xs font-medium flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            {userName} (You)
          </div>
        </div>
        {peers.map((peer) => (
          <VideoCard
            key={peer.peerID}
            peer={peer.peer}
            isMuted={peerStatus[peer.peerID]?.isMuted}
            isVideoOff={peerStatus[peer.peerID]?.isVideoOff}
            isHandRaised={raisedHands[peer.peerID]}
          />
        ))}
      </div>

      {/* Controls */}
      <div className={`p-6 flex justify-center items-center gap-4 border-t ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
        <button onClick={toggleMic} className={`p-4 rounded-2xl transition-all shadow-lg ${isMicOn ? "bg-gray-800 text-white hover:bg-gray-700" : "bg-red-500 text-white animate-pulse"}`}>
          {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
        </button>
        <button onClick={toggleCamera} className={`p-4 rounded-2xl transition-all shadow-lg ${isCameraOn ? "bg-gray-800 text-white hover:bg-gray-700" : "bg-red-500 text-white animate-pulse"}`}>
          {isCameraOn ? <Video size={24} /> : <VideoOff size={24} />}
        </button>
        <button onClick={toggleRaiseHand} className={`p-4 rounded-2xl transition-all shadow-lg ${isHandRaised ? "bg-yellow-500 text-white animate-pulse" : "bg-gray-800 text-white hover:bg-gray-700"}`}>
          <Hand size={24} />
        </button>
        <button onClick={handleScreenShare} className={`p-4 rounded-2xl transition-all shadow-lg ${isScreenSharing ? "bg-blue-600 text-white animate-pulse" : "bg-gray-800 text-white hover:bg-gray-700"}`}>
          <ScreenShare size={24} />
        </button>
        <button onClick={() => setShowChat(!showChat)} className={`p-4 rounded-2xl transition-all shadow-lg ${showChat ? "bg-purple-600 text-white" : "bg-gray-800 text-white hover:bg-gray-700"}`}>
          <MessageSquare size={24} />
        </button>
        <button onClick={() => setShowCode(!showCode)} className={`p-4 rounded-2xl transition-all shadow-lg ${showCode ? "bg-indigo-600 text-white" : "bg-gray-800 text-white hover:bg-gray-700"}`}>
          <Code2 size={24} />
        </button>
        <div className="w-px h-10 bg-gray-800 mx-2" />
        <button onClick={onClose} className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold flex items-center gap-2 shadow-xl transition-all hover:scale-105">
          <PhoneOff size={20} /> End Call
        </button>
      </div>

      {/* Chat */}
      {showChat && (
        <div className={`absolute right-0 top-0 bottom-0 w-80 flex flex-col border-l ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
          <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2"><MessageSquare size={18} className="text-purple-500" /> Class Chat</h3>
            <button onClick={() => setShowChat(false)} className="text-gray-500 hover:text-red-500"><X size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.userId === socketRef.current?.id ? "items-end" : "items-start"}`}>
                <span className="text-[10px] font-bold text-purple-500 uppercase">{msg.sender}</span>
                <div className={`px-3 py-2 rounded-2xl max-w-[90%] text-sm ${msg.userId === socketRef.current?.id ? "bg-purple-600 text-white rounded-tr-none" : "bg-gray-100 dark:bg-gray-800 rounded-tl-none"}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="p-4 border-t dark:border-gray-800 flex gap-2">
            <input type="text" value={messageInput} onChange={(e) => setMessageInput(e.target.value)} placeholder="Type a message..." className={`flex-1 px-3 py-2 rounded-xl text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`} />
            <button type="submit" className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition">
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Live Code Panel */}
      {showCode && (
        <div className={`absolute right-0 top-0 bottom-0 w-[500px] flex flex-col border-l ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
          <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Code2 size={18} className="text-indigo-500" />
              <h3 className="font-bold">Live Code</h3>
              {isInstructor && (
                <button onClick={toggleCodeEdit} className={`text-xs px-2 py-1 rounded ${canEditCode ? "bg-green-600 text-white" : "bg-gray-700 text-gray-300"}`}>
                  {canEditCode ? "Editing On" : "Editing Off"}
                </button>
              )}
            </div>
            <button onClick={() => setShowCode(false)} className="text-gray-500 hover:text-red-500"><X size={18} /></button>
          </div>
          <div className="flex border-b dark:border-gray-800">
            {["html", "css", "js"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveCodeTab(tab)}
                className={`flex-1 py-2 text-sm font-medium uppercase tracking-wider ${
                  activeCodeTab === tab
                    ? "bg-indigo-600 text-white"
                    : darkMode ? "text-gray-400 hover:bg-gray-800" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              language={activeCodeTab}
              theme={darkMode ? "vs-dark" : "light"}
              value={code[activeCodeTab]}
              onChange={(value) => handleCodeChange(activeCodeTab, value || "")}
              options={{
                readOnly: !canEditCode,
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                wordWrap: "on",
                automaticLayout: true,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveVideoClass;
