// src/utils/calculations.js

/**
 * Calculate total points from a list of questions
 * @param {Array} questions - Array of question objects
 * @returns {number} Total points
 */
export const calculateTotalPoints = (questions) => {
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return 0;
  }
  
  return questions.reduce((total, q) => {
    // Check if question has points directly
    if (q.points) {
      return total + q.points;
    }
    
    // Check if question has answers with points
    if (q.answers && Array.isArray(q.answers)) {
      return total + q.answers.reduce((sum, answer) => sum + (answer.points || 0), 0);
    }
    
    return total;
  }, 0);
};

/**
 * Calculate percentage score
 * @param {number} score - Current score
 * @param {number} total - Total possible points
 * @returns {number} Percentage
 */
export const calculatePercentage = (score, total) => {
  if (total === 0) return 0;
  return Math.round((score / total) * 100);
};

/**
 * Get level based on score percentage
 * @param {number} percentage - Score percentage
 * @returns {string} Level
 */
export const getLevelFromScore = (percentage) => {
  if (percentage >= 90) return 'Expert';
  if (percentage >= 70) return 'Advanced';
  if (percentage >= 50) return 'Intermediate';
  return 'Beginner';
};

/**
 * Calculate total XP reward from course
 * @param {Object} course - Course object
 * @returns {number} Total XP
 */
export const calculateCourseXP = (course) => {
  if (!course) return 0;
  
  let totalXP = course.xpReward || 0;
  
  // Add XP from questions if they have points
  if (course.quiz && course.quiz.questions) {
    totalXP += calculateTotalPoints(course.quiz.questions);
  }
  
  return totalXP;
};

/**
 * Validate if a quiz is complete (has title, passing score, and questions)
 * @param {Object} quiz - Quiz object
 * @returns {boolean} Is quiz valid
 */
export const isValidQuiz = (quiz) => {
  if (!quiz) return false;
  
  const hasTitle = quiz.title && quiz.title.trim().length > 0;
  const hasPassingScore = quiz.passing_score && quiz.passing_score > 0;
  const hasQuestions = quiz.questions && quiz.questions.length > 0;
  
  return hasTitle && hasPassingScore && hasQuestions;
};