import React, { useState } from "react";

const VideoPlayer = ({ videoUrl, title, onComplete }) => {
  const [watched, setWatched] = useState(false);
  
  const handleVideoEnd = () => {
    if (!watched) {
      setWatched(true);
      onComplete?.();
      alert("✅ Lesson completed! +10 XP");
    }
  };
  
  return (
    <div style={{ background: "#000", borderRadius: "16px", overflow: "hidden" }}>
      <video
        controls
        width="100%"
        onEnded={handleVideoEnd}
        poster="https://via.placeholder.com/800x450?text=Course+Preview"
        style={{ width: "100%" }}
      >
        <source src={videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4"} type="video/mp4" />
      </video>
      <div style={{ padding: "16px", background: "white" }}>
        <h3>{title}</h3>
        {watched && <span style={{ color: "#10b981" }}>✓ Completed</span>}
      </div>
    </div>
  );
};