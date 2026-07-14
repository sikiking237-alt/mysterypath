// src/utils/calculations.js
export const calculateTotalPoints = (questions) => {
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return 0;
  }
  return questions.reduce((total, q) => {
    const points = q.points || q.xpReward || 0;
    return total + points;
  }, 0);
};