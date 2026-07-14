import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import createSocket from "../utils/socketClient";
import { apiEndpoints, apiCall } from "../config/apiConfig";

const CHAT_ROOMS = {
  GENERAL: "general",
  HELP: "help",
  INSTRUCTORS: "instructors",
};

const Chat = ({ darkMode, onOpenSupport }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [room, setRoom] = useState(CHAT_ROOMS.GENERAL);
  const [isConnected, setIsConnected] = useState(false);
  const [showSupportDropdown, setShowSupportDropdown] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const prevRoomRef = useRef(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!token) {
      console.log("No token found, chat disabled");
      return;
    }

    // Connect to Socket.IO server
    // Use a relative path to connect to the same host, allowing Vite's proxy to work.
    // This avoids CORS issues and removes the hardcoded backend URL.
    socketRef.current = createSocket({
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        token: token,
      },
    });

    // Connection events
    socketRef.current.on("connect", () => {
      console.log("Connected to chat server");
      setIsConnected(true);

      // Join current room
      socketRef.current.emit("join", {
        room: room,
        username: user.name || "Anonymous",
        role: user.role || "user",
      });
    });

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected from chat server");
      setIsConnected(false);
    });

    socketRef.current.on("connected", (data) => {
      console.log("Server connected:", data);
    });

    // Receive messages
    socketRef.current.on("message", (message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    // User typing indicator
    socketRef.current.on("user_typing", (data) => {
      if (data.room === room && data.username !== user.name) {
        setTypingUsers((prev) => {
          if (!prev.includes(data.username)) {
            return [...prev, data.username];
          }
          return prev;
        });

        // Clear typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers((prev) =>
            prev.filter((name) => name !== data.username),
          );
        }, 3000);
      }
    });

    // Online users count
    socketRef.current.on("online_count", (data) => {
      if (data.room === room) {
        setOnlineCount(data.count);
      }
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leave", {
          room: prevRoomRef.current || room,
          username: user.name || "Anonymous",
        });
        socketRef.current.disconnect();
      }
    };
  }, [token, user.name, user.role]); // Rerun on critical info change

  // Load previous messages when room changes
  useEffect(() => {
    if (room) {
      loadPreviousMessages(room);
    }
  }, [room]);

  // Handle room change
  useEffect(() => {
    if (socketRef.current && isConnected) {
      const oldRoom = prevRoomRef.current;
      if (oldRoom && oldRoom !== room) {
        socketRef.current.emit("leave", { room: oldRoom, username: user.name || "Anonymous" });
      }
      socketRef.current.emit("join", { room, username: user.name || "Anonymous", role: user.role || "user" });
    }
    prevRoomRef.current = room;
  }, [room, isConnected, user.name, user.role]);

  // Load previous messages when joining room
  const loadPreviousMessages = async (roomName) => {
    setMessages([]); // Clear messages immediately for better UX
    const result = await apiCall(apiEndpoints.messages.chat(roomName));
    if (result && result.messages && !result.error) {
      setMessages(result.messages);
    } else {
      // apiCall handles toast errors, but you could set a local error state here if needed
      console.error("Error loading messages:", result?.error);
    }
  };

  // Send message
  const sendMessage = (e) => {
    e.preventDefault();

    if (!input.trim() || !socketRef.current || !isConnected) {
      return;
    }

    const messageData = {
      room: room,
      username: user.name || "Anonymous",
      message: input.trim(),
      role: user.role || "user",
    };

    socketRef.current.emit("send_message", messageData);
    setInput("");

    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("typing", {
        room: room,
        username: user.name || "Anonymous",
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit("stop_typing", {
          room: room,
          username: user.name || "Anonymous",
        });
      }, 1000);
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Navigation handler
  const handleSupportNavigation = () => {
    if (onOpenSupport) {
      onOpenSupport();
    } else {
      navigate("/support");
    }
  };

  // Change room
  const changeRoom = (newRoom) => {
    if (newRoom !== room) {
      setRoom(newRoom);
    }
  };

  // Styles based on dark mode
  const bgColor = darkMode ? "#1e1e2e" : "#ffffff";
  const headerBg = darkMode ? "#313244" : "#4f46e5";
  const myMsgBg = darkMode ? "#89b4fa" : "#6366f1";
  const otherMsgBg = darkMode ? "#45475a" : "#f1f5f9";
  const otherMsgText = darkMode ? "#e2e8f0" : "#0f172a";
  const sysText = darkMode ? "#94a3b8" : "#64748b";
  const inputBg = darkMode ? "#313244" : "#ffffff";
  const inputText = darkMode ? "#f1f5f9" : "#0f172a";
  const dropdownBg = darkMode ? "#1e293b" : "#ffffff";
  const dropdownText = darkMode ? "#f1f5f9" : "#0f172a";

  return (
    <div
      style={{
        background: bgColor,
        borderRadius: "20px",
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        height: "500px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          background: headerBg,
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <strong>💬 Live Chat</strong>
          <span style={{ fontSize: "12px", marginLeft: "10px", opacity: 0.8 }}>
            {isConnected
              ? `● Connected (${onlineCount} online)`
              : "○ Disconnected"}
          </span>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            value={room}
            onChange={(e) => changeRoom(e.target.value)}
            style={{
              background: dropdownBg,
              color: dropdownText,
              border: `1px solid ${darkMode ? "#475569" : "#cbd5e1"}`,
              padding: "5px 10px",
              borderRadius: "20px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
              outline: "none",
            }}
          >
            <option value={CHAT_ROOMS.GENERAL}>💬 General</option>
            <option value={CHAT_ROOMS.HELP}>🆘 Help Desk</option>
            {user.role === "instructor" && (
              <option value={CHAT_ROOMS.INSTRUCTORS}>👨‍🏫 Instructors Only</option>
            )}
          </select>

          {/* Support Button */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowSupportDropdown(!showSupportDropdown)}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "20px",
                padding: "5px 12px",
                color: "white",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "500",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.3)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
              }
            >
              ❓ Support
            </button>

            {showSupportDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "8px",
                  background: dropdownBg,
                  borderRadius: "12px",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                  minWidth: "200px",
                  zIndex: 1000,
                  overflow: "hidden",
                  border: `1px solid ${darkMode ? "#475569" : "#e2e8f0"}`,
                }}
              >
                <button
                  onClick={() => {
                    handleSupportNavigation();
                    setShowSupportDropdown(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    textAlign: "left",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: dropdownText,
                    fontSize: "14px",
                    transition: "background 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = darkMode
                      ? "#334155"
                      : "#f1f5f9")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <span>📧</span>
                  <span>Contact Support</span>
                </button>
                <button
                  onClick={() => {
                    navigate("/contact");
                    setShowSupportDropdown(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    textAlign: "left",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: dropdownText,
                    fontSize: "14px",
                    transition: "background 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = darkMode
                      ? "#334155"
                      : "#f1f5f9")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <span>📝</span>
                  <span>Email Support</span>
                </button>
                <button
                  onClick={() => {
                    navigate("/support");
                    setShowSupportDropdown(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    textAlign: "left",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: dropdownText,
                    fontSize: "14px",
                    transition: "background 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = darkMode
                      ? "#334155"
                      : "#f1f5f9")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <span>📚</span>
                  <span>FAQ & Help Center</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {messages.map((msg, idx) =>
          msg.system ? (
            <div
              key={idx}
              style={{
                textAlign: "center",
                fontSize: "12px",
                color: sysText,
                margin: "4px 0",
                fontStyle: "italic",
              }}
            >
              {msg.text}
            </div>
          ) : (
            <div
              key={idx}
              style={{
                alignSelf: msg.user === user.name ? "flex-end" : "flex-start",
                maxWidth: "75%",
                background: msg.user === user.name ? myMsgBg : otherMsgBg,
                color: msg.user === user.name ? "white" : otherMsgText,
                padding: "10px 14px",
                borderRadius: "18px",
                borderBottomRightRadius:
                  msg.user === user.name ? "4px" : "18px",
                borderBottomLeftRadius: msg.user === user.name ? "18px" : "4px",
                wordWrap: "break-word",
              }}
            >
              <div
                style={{ fontSize: "11px", opacity: 0.7, marginBottom: "4px" }}
              >
                {msg.user} {msg.role === "instructor" && "👨‍🏫"} • {msg.time}
              </div>
              <div style={{ fontSize: "14px", lineHeight: "1.4" }}>
                {msg.message}
              </div>
            </div>
          ),
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div
            style={{
              fontSize: "12px",
              color: sysText,
              fontStyle: "italic",
              marginLeft: "16px",
            }}
          >
            {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"}{" "}
            typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={sendMessage}
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "12px",
          borderTop: `1px solid ${darkMode ? "#45475a" : "#e5e7eb"}`,
          background: bgColor,
        }}
      >
        <div style={{ display: "flex", marginBottom: "10px" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyUp={handleTyping}
            placeholder={
              isConnected ? "Type your message..." : "Connecting to chat..."
            }
            disabled={!isConnected}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: "30px",
              border: `1px solid ${darkMode ? "#475569" : "#cbd5e1"}`,
              background: inputBg,
              color: inputText,
              outline: "none",
              fontSize: "14px",
            }}
          />
          <button
            type="submit"
            disabled={!isConnected}
            style={{
              marginLeft: "12px",
              padding: "10px 20px",
              borderRadius: "30px",
              background: "#4f46e5",
              color: "white",
              border: "none",
              cursor: isConnected ? "pointer" : "not-allowed",
              fontWeight: "bold",
              transition: "background 0.2s",
              opacity: isConnected ? 1 : 0.5,
            }}
          >
            Send
          </button>
        </div>

        {/* Support Banner */}
        <div
          style={{
            padding: "10px",
            background: darkMode ? "#313244" : "#f1f5f9",
            borderRadius: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "13px",
          }}
        >
          <span style={{ color: sysText }}>💡 Need immediate assistance?</span>
          <button
            onClick={handleSupportNavigation}
            style={{
              padding: "6px 16px",
              background: "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: "20px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "500",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.05)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Get Support →
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
