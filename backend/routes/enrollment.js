const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// In-memory storage (replace with database in production)
let enrollments = [];
let nextId = 1;
let db; // Will be set if a database connection is available

// Demo users storage
const users = [
  { id: 1, name: 'Demo User', email: 'demo@mysterypath.com', xp: 1250, streak_days: 7, longest_streak: 7, total_activities: 25 }
];

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Enroll in a course
router.post('/enroll', authenticateToken, async (req, res) => {
  const { course_id } = req.body;
  const user_id = req.user.id;
  
  if (db) {
    // Database logic
    try {
      const [existingEnrollment] = await db.query(
        'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?',
        [user_id, course_id]
      );
      if (existingEnrollment) {
        return res.status(409).json({ message: 'Already enrolled in this course' });
      }
      await db.query(
        'INSERT INTO enrollments (user_id, course_id, enrolled_at, progress) VALUES (?, ?, NOW(), 0)',
        [user_id, course_id]
      );
      await db.query('UPDATE users SET xp = xp + 20 WHERE id = ?', [user_id]);
      return res.status(201).json({ message: 'Successfully enrolled', xp_earned: 20 });
    } catch (error) {
      return res.status(500).json({ message: 'Server error' });
    }
  }
  
  // Check if already enrolled
  const existingEnrollment = enrollments.find(e => e.user_id === user_id && e.course_id === course_id);
  
  if (existingEnrollment) {
    return res.status(409).json({ message: 'Already enrolled in this course' });
  }
  
  // Create new enrollment
  const enrollment = {
    id: nextId++,
    user_id,
    course_id,
    progress: 0,
    enrolled_at: new Date().toISOString()
  };
  
  enrollments.push(enrollment);
  
  // Update user XP
  const user = users.find(u => u.id === user_id);
  if (user) {
    user.xp += 20;
  }

  res.status(201).json({
    message: `Successfully enrolled`,
    enrollment,
    xp_earned: 20,
    total_xp: user?.xp || 0
  });
});

// Get user's enrolled courses
// ... (other routes can be unified similarly)

module.exports = (database) => {
  if (database) {
    db = database;
  }
  return router;
};