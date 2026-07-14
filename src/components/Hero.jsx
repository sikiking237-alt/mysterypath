import React, { useState } from "react";

const Chat = ({ darkMode, onOpenSupport }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { text: "Hello! How can I help you today?", sender: "bot", time: "Just now" }
  ]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    setMessages([...messages, { text: message, sender: "user", time: "Just now" }]);
    setMessage("");
    
    // Auto-reply
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        text: "Thanks for your message! Our support team will get back to you soon. For immediate help, click the support button below.", 
        sender: "bot", 
        time: "Just now" 
      }]);
    }, 500);
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #667eea, #764ba2)",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.3s"
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
      >
        <span style={{ fontSize: "28px" }}>💬</span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: "fixed",
          bottom: "100px",
          right: "30px",
          width: "350px",
          height: "500px",
          background: darkMode ? "#1e293b" : "white",
          borderRadius: "20px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
          {/* Header */}
          <div style={{
            padding: "20px",
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            color: "white"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px" }}>Learning Assistant</h3>
                <p style={{ margin: "5px 0 0", fontSize: "12px", opacity: 0.9 }}>Online - Usually replies in minutes</p>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: "white", fontSize: "20px", cursor: "pointer" }}>
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            padding: "20px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                display: "flex",
                justifyContent: msg.sender === "user" ? "flex-end" : "flex-start"
              }}>
                <div style={{
                  maxWidth: "80%",
                  padding: "10px 15px",
                  borderRadius: msg.sender === "user" ? "20px 20px 5px 20px" : "20px 20px 20px 5px",
                  background: msg.sender === "user" 
                    ? "linear-gradient(135deg, #667eea, #764ba2)"
                    : darkMode ? "#334155" : "#f1f5f9",
                  color: msg.sender === "user" ? "white" : (darkMode ? "white" : "#1e293b")
                }}>
                  {msg.text}
                  <div style={{ fontSize: "10px", marginTop: "5px", opacity: 0.7 }}>{msg.time}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{
            padding: "15px",
            borderTop: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
            display: "flex",
            gap: "10px"
          }}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type your message..."
              style={{
                flex: 1,
                padding: "10px 15px",
                border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
                borderRadius: "25px",
                background: darkMode ? "#0f172a" : "white",
                color: darkMode ? "white" : "#1e293b",
                outline: "none"
              }}
            />
            <button
              onClick={handleSendMessage}
              style={{
                padding: "10px 20px",
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                color: "white",
                border: "none",
                borderRadius: "25px",
                cursor: "pointer"
              }}
            >
              Send
            </button>
          </div>

          {/* Support Button */}
          <div style={{ padding: "10px 15px 15px" }}>
            <button
              onClick={onOpenSupport}
              style={{
                width: "100%",
                padding: "10px",
                background: "transparent",
                border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
                borderRadius: "25px",
                cursor: "pointer",
                color: darkMode ? "white" : "#1e293b",
                fontSize: "14px"
              }}
            >
              Need more help? Contact Support →
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chat;