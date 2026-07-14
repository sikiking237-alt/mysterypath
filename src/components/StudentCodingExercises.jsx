import React, { useState, useEffect } from "react";

const StudentCodingExercises = ({ courseId, darkMode }) => {
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(true);

  const API_URL = "/api";
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchExercises();
  }, [courseId]);

  const fetchExercises = async () => {
    try {
      const response = await fetch(`${API_URL}/course/exercises/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setExercises(data);
      }
    } catch (error) {
      console.error("Error fetching exercises:", error);
    }
    setLoading(false);
  };

  const runCode = () => {
    setOutput("");
    let consoleOutput = [];
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      consoleOutput.push(args.join(" "));
      originalConsoleLog(...args);
    };
    
    try {
      const runUserCode = new Function(code);
      runUserCode();
      setOutput(consoleOutput.join("\n") || "Code executed successfully!");
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
    
    console.log = originalConsoleLog;
  };

  const completeExercise = async () => {
    if (window.confirm(`Complete this exercise and earn ${selectedExercise.xp_reward} XP?`)) {
      try {
        const response = await fetch(`${API_URL}/complete-exercise`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            exercise_id: selectedExercise.id,
            code: code
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          alert(`✅ Great job! You earned ${data.xp_earned} XP!`);
          setSelectedExercise(null);
          fetchExercises();
        } else {
          alert("Error completing exercise");
        }
      } catch (error) {
        alert("Error connecting to server");
      }
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "40px", color: darkMode ? "#aaa" : "#666" }}>Loading coding exercises...</div>;
  }

  if (selectedExercise) {
    return (
      <div style={{
        background: darkMode ? "#2d2d2d" : "white",
        borderRadius: "16px",
        padding: "24px"
      }}>
        <button
          onClick={() => setSelectedExercise(null)}
          style={{
            background: "none",
            border: "none",
            color: "#667eea",
            cursor: "pointer",
            marginBottom: "16px",
            fontSize: "14px"
          }}
        >
          ← Back to Exercises
        </button>
        
        <h3 style={{ color: darkMode ? "white" : "#1f2937", marginBottom: "8px" }}>
          {selectedExercise.exercise_title}
        </h3>
        <p style={{ color: darkMode ? "#aaa" : "#666", marginBottom: "16px" }}>
          {selectedExercise.description}
        </p>
        
        <div style={{ marginBottom: "16px" }}>
          <label style={{ color: darkMode ? "#aaa" : "#666", display: "block", marginBottom: "8px" }}>Your Code:</label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{
              width: "100%",
              height: "300px",
              padding: "16px",
              fontFamily: "Consolas, Monaco, monospace",
              fontSize: "13px",
              background: darkMode ? "#1a1a1a" : "#f9fafb",
              color: darkMode ? "#e5e7eb" : "#1f2937",
              border: `1px solid ${darkMode ? "#444" : "#ddd"}`,
              borderRadius: "12px",
              outline: "none"
            }}
          />
        </div>
        
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
          <button
            onClick={runCode}
            style={{
              padding: "10px 20px",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            ▶ Run Code
          </button>
          {!selectedExercise.completed && (
            <button
              onClick={completeExercise}
              style={{
                padding: "10px 20px",
                background: "linear-gradient(135deg, #f59e0b, #ea580c)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              🎯 Complete & Earn {selectedExercise.xp_reward} XP
            </button>
          )}
        </div>
        
        <div style={{
          background: "#1f2937",
          borderRadius: "12px",
          padding: "16px"
        }}>
          <div style={{ color: "#9ca3af", fontSize: "12px", marginBottom: "8px" }}>📤 Output:</div>
          <pre style={{
            color: "#10b981",
            fontSize: "13px",
            fontFamily: "monospace",
            margin: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word"
          }}>
            {output || "Run your code to see output..."}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ color: darkMode ? "white" : "#1f2937", marginBottom: "16px" }}>💻 Coding Practice</h3>
      {exercises.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "60px",
          background: darkMode ? "#2d2d2d" : "white",
          borderRadius: "16px",
          color: darkMode ? "#666" : "#999"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>💻</div>
          <p>No coding exercises available for this course yet.</p>
          <p style={{ fontSize: "14px" }}>Check back later for practice challenges!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {exercises.map(ex => (
            <div key={ex.id} style={{
              background: darkMode ? "#2d2d2d" : "white",
              borderRadius: "16px",
              padding: "20px",
              cursor: "pointer",
              border: `1px solid ${darkMode ? "#444" : "#e5e7eb"}`,
              transition: "transform 0.2s"
            }}
            onClick={() => {
              setSelectedExercise(ex);
              setCode(ex.starter_code);
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateX(5px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateX(0)"}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "8px" }}>
                    <h4 style={{ fontSize: "18px", fontWeight: "600", color: darkMode ? "white" : "#1f2937" }}>
                      📝 {ex.exercise_title}
                    </h4>
                    <span style={{
                      background: "#f59e0b20",
                      color: "#f59e0b",
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "500"
                    }}>
                      🏆 +{ex.xp_reward} XP
                    </span>
                  </div>
                  <p style={{ color: darkMode ? "#aaa" : "#666", fontSize: "14px", marginBottom: "8px" }}>
                    {ex.description}
                  </p>
                  <p style={{ color: darkMode ? "#888" : "#999", fontSize: "12px" }}>
                    Lesson: {ex.lesson_title}
                  </p>
                </div>
                {ex.completed && (
                  <div style={{
                    background: "#10b98120",
                    color: "#10b981",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "500",
                    whiteSpace: "nowrap"
                  }}>
                    ✅ Completed
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentCodingExercises;