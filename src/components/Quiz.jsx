import React, { useState } from "react";

const Quiz = ({ questions, onComplete }) => {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  // Helper to calculate total points for the current quiz
  const calculateTotalPoints = (qs) => {
    if (!qs || qs.length === 0) return 0;
    // Use points if available, otherwise default to 1 point per question
    return qs.reduce((total, q) => total + (q.points || 1), 0);
  };

  // Handle different question formats
  const getQuestionText = (q) => {
    return q.question_text || q.question || q.text || "";
  };
  
  const getOptions = (q) => {
    if (q.options && Array.isArray(q.options)) {
      return q.options.map(opt => opt.option_text || opt.text || opt);
    }
    return [];
  };
  
  const getCorrectAnswer = (q) => {
    if (q.options && Array.isArray(q.options)) {
      const correct = q.options.find(opt => opt.is_correct);
      return correct ? correct.option_text || correct.text : null;
    }
    return q.correct_answer || q.correct;
  };
  
  const handleAnswer = (selected) => {
    const currentQ = questions[current];
    const correct = getCorrectAnswer(currentQ);
    
    if (selected === correct) {
      setScore(score + 1);
    }
    
    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      const newFinalScore = score + (selected === correct ? 1 : 0);
      setFinalScore(newFinalScore);
      setShowResult(true);
      onComplete?.(newFinalScore, questions.length);
    }
  };
  
  if (showResult) {
    const percentage = (finalScore / questions.length) * 100;
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <h2>Quiz Complete! 🎉</h2>
        <p style={{ fontSize: "48px", fontWeight: "bold", color: percentage >= 70 ? "#10b981" : "#f59e0b" }}>
          {finalScore} / {questions.length}
        </p>
        <p>{percentage >= 70 ? "Passed! 🎓" : "Try again to improve your score 📚"}</p>
        <button 
          onClick={() => {
            setCurrent(0);
            setScore(0);
            setShowResult(false);
            setFinalScore(0);
          }}
          style={{
            marginTop: "20px",
            padding: "10px 30px",
            background: "#4f46e5",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer"
          }}
        >
          Retry Quiz
        </button>
      </div>
    );
  }
  
  if (!questions || questions.length === 0) {
    return <div>No questions available</div>;
  }
  
  const currentQ = questions[current];
  const options = getOptions(currentQ);
  
  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: "20px" }}>
        <span>Question {current + 1} of {questions.length}</span>
        <div style={{ width: "100%", background: "#e5e7eb", borderRadius: "10px", marginTop: "10px" }}>
          <div style={{ 
            width: `${((current + 1) / questions.length) * 100}%`, 
            background: "#4f46e5", 
            padding: "5px", 
            borderRadius: "10px",
            transition: "width 0.3s ease"
          }} />
        </div>
      </div>
      <h3>{getQuestionText(currentQ)}</h3>
      <div style={{ marginTop: "20px" }}>
        {options.map((opt, i) => (
          <button 
            key={i} 
            onClick={() => handleAnswer(opt)} 
            style={{
              display: "block",
              width: "100%",
              padding: "12px",
              marginBottom: "10px",
              background: "#f3f4f6",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.2s",
              hover: {
                background: "#e5e7eb"
              }
            }}
          >
            {opt}
          </button>
        ))}
      </div>
      <div style={{ marginTop: "20px", fontSize: "14px", color: "#6b7280" }}>
        Points: {currentQ.points || 1} 
        {<span> | Total: {calculateTotalPoints(questions)}</span>}
      </div>
    </div>
  );
};

export default Quiz;