require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- AUTHENTICATION MIDDLEWARE ---
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'a_very_secret_key_for_development',
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// --- DATABASE SETUP (PostgreSQL with Sequelize) ---
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false, // Set to console.log to see SQL queries
  dialectOptions: {
    // Use SSL if required by your hosting provider
    // ssl: {
    //   require: true,
    //   rejectUnauthorized: false
    // }
  }
});

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  google_id: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'user',
  },
  xp: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  streak_days: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
});

const findOrCreateUser = async (profile) => {
  const [user, created] = await User.findOrCreate({
    where: { google_id: profile.id },
    defaults: {
      name: profile.displayName,
      email: profile.emails[0].value,
    }
  });

  console.log(created ? '✨ Created new user:' : '✅ Found existing user:', user.name);
  return user.get({ plain: true });
};

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user ? user.get({ plain: true }) : null);
  } catch (err) {
    done(err, null);
  }
});

// --- IN-MEMORY MOCK DATABASES ---
let courses = [
  {
    id: 1,
    title: 'Introduction to React',
    subtitle: 'Learn the fundamentals of React.',
    description: 'This course covers the basic concepts of React, including components, props, and state.',
    level: 'Beginner',
    category: 'Development',
    image_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=200&fit=crop',
    price: 0,
    duration: '5 hours',
    whatYouWillLearn: ['Components', 'Props', 'State', 'Hooks'],
    requirements: ['Basic JavaScript knowledge'],
    targetAudience: [],
    isPublished: true,
    isFeatured: true,
    students: 123,
    topics: [
      {
        id: 'topic-1-1',
        title: 'React Fundamentals',
        subtopics: [
          {
            id: 'subtopic-1-1-1',
            title: 'Components & JSX',
            content: 'Detailed content about what React components and JSX are. JSX is a syntax extension to JavaScript that lets you write HTML-like markup inside a JavaScript file.',
            quiz: {
              questions: [
                { id: 'q1', type: 'multiple_choice', text: 'What is JSX?', options: ['A JavaScript library', 'A syntax extension for JavaScript', 'A CSS preprocessor'], correctAnswer: 'A syntax extension for JavaScript' },
                { id: 'q2', type: 'multiple_choice', text: 'What does `render()` in a React component do?', options: ['Renders the component to the DOM', 'Returns a single React element', 'Updates the component state'], correctAnswer: 'Returns a single React element' },
                { id: 'q3', type: 'multiple_choice', text: 'Can you use `class` as a prop in JSX?', options: ['Yes', 'No, you should use `className`'], correctAnswer: 'No, you should use `className`' }
              ]
            }
          },
          {
            id: 'subtopic-1-1-2',
            title: 'Props',
            content: 'Content about passing data using props from parent to child components. Props are read-only.',
            quiz: {
              questions: [
                { id: 'q1', type: 'multiple_choice', text: 'How are props passed to a component?', options: ['As arguments to a function', 'As attributes in JSX', 'Through global state'], correctAnswer: 'As attributes in JSX' }
              ]
            }
          },
          {
            id: 'subtopic-1-1-3',
            title: 'State and Lifecycle',
            content: 'Content about managing component state with the useState hook and component lifecycle events with useEffect.',
            quiz: {
              questions: [
                { id: 'q1', type: 'multiple_choice', text: 'Which hook manages state in a functional component?', options: ['useEffect', 'useState', 'useContext'], correctAnswer: 'useState' },
                { id: 'q2', type: 'fill_in_the_blank', text: 'To manage side effects in React, you use the ___ hook.', correctAnswer: 'useEffect' }
              ]
            }
          }
        ]
      },
      {
        id: 'topic-1-2',
        title: 'Advanced Concepts',
        subtopics: [
          {
            id: 'subtopic-1-2-1',
            title: 'Handling Events',
            content: 'Learn how to handle user events like clicks and input changes in React...',
            quiz: {
              questions: [
                { id: 'q1', type: 'multiple_choice', text: 'How do you add a click handler to a button in React?', options: ['<button onclick={...}>', '<button onClick={...}>', '<button event:click={...}>'], correctAnswer: '<button onClick={...}>' }
              ]
            }
          }
        ]
      }
    ]
  },
  {
    id: 2,
    title: 'Advanced CSS and Sass',
    subtitle: 'Master advanced CSS techniques.',
    description: 'Dive deep into CSS Grid, Flexbox, and Sass for creating complex layouts.',
    level: 'Advanced',
    category: 'Design',
    image_url: 'https://images.unsplash.com/photo-1524749292158-7540c2494485?w=400&h=200&fit=crop',
    price: 50,
    duration: '8 hours',
    whatYouWillLearn: ['CSS Grid', 'Flexbox', 'Sass', 'Responsive Design'],
    requirements: ['Intermediate CSS knowledge'],
    targetAudience: [],
    isPublished: true,
    isFeatured: false,
    students: 88,
  },
  {
    id: 3,
    title: 'Node.js for Beginners',
    subtitle: 'Build backend applications with Node.js.',
    description: 'Learn to build fast and scalable server-side applications with Node.js and Express.',
    level: 'Beginner',
    category: 'Development',
    image_url: 'https://images.unsplash.com/photo-1542393545-10f5cde2c810?w=400&h=200&fit=crop',
    price: 25,
    duration: '7 hours',
    whatYouWillLearn: ['Node.js basics', 'Express framework', 'REST APIs', 'Asynchronous JavaScript'],
    requirements: ['Basic JavaScript knowledge'],
    targetAudience: [],
    isPublished: false,
    isFeatured: false,
    students: 45,
  }
];
let nextCourseId = 4;

// In-memory "database" for certificates
let certificates = [];
let nextCertificateId = 1;


// In-memory "database" for user progress
let userProgress = {
  // userId: { courseId: Set<subtopicId> }
  'user-1': {
    1: new Set(['subtopic-1-1-1']),
  },
};
// Helper to get user ID from token (mocked)
const getUserIdFromToken = (token) => 'user-1';

// --- PASSPORT GOOGLE STRATEGY ---
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreateUser(profile);
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// --- AUTHENTICATION ROUTES ---

// Mock Email/Password Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  try {
    let user = await User.findOne({ where: { email } });

    // For this demo, if the instructor logs in, create them if they don't exist.
    // This is a workaround because there's no registration flow for email/password.
    // In a real app, you'd validate the password against a hash.
    if (!user && email === 'instructor@learnflow.com') {
      console.log('Creating mock instructor user...');
      user = await User.create({
        google_id: `mock-id-${email}`, // The User model now requires a unique google_id
        name: 'Instructor',
        email: email,
        role: 'instructor',
      });
    }

    if (user) {
      // Mock password check is always successful for this demo
      console.log(`✅ Mock login successful for: ${user.email}`);
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET || 'default_jwt_secret',
        { expiresIn: '1d' }
      );
      return res.json({
        success: true,
        message: 'Login successful',
        access_token: token,
        user: user.get({ plain: true }),
      });
    } else {
      return res.status(401).json({ success: false, error: 'Invalid credentials. User not found.' });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, error: 'An internal server error occurred.' });
  }
});

app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get(
  '/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    const user = req.user;
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'default_jwt_secret',
      { expiresIn: '1d' }
    );
    const userString = encodeURIComponent(JSON.stringify(user));
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
    res.redirect(`${frontendUrl}?token=${token}&user=${userString}`);
  }
);


// --- Instructor Course Management ---

// GET /api/instructor/courses
app.get('/api/instructor/courses', (req, res) => {
  res.json(courses);
});

// POST /api/instructor/courses
app.post('/api/instructor/courses', (req, res) => {
  const newCourse = { ...req.body, id: nextCourseId++, students: 0 };
  courses.push(newCourse);
  res.status(201).json({ success: true, message: 'Course created successfully', course: newCourse });
});

// PUT /api/instructor/courses/:id
app.put('/api/instructor/courses/:id', (req, res) => {
  const courseId = parseInt(req.params.id, 10);
  const courseIndex = courses.findIndex(c => c.id === courseId);

  if (courseIndex === -1) {
    return res.status(404).json({ success: false, error: 'Course not found' });
  }

  courses[courseIndex] = { ...courses[courseIndex], ...req.body };
  res.json({ success: true, message: 'Course updated successfully', course: courses[courseIndex] });
});

// DELETE /api/instructor/courses/:id
app.delete('/api/instructor/courses/:id', (req, res) => {
  const courseId = parseInt(req.params.id, 10);
  const initialLength = courses.length;
  courses = courses.filter(c => c.id !== courseId);

  if (courses.length === initialLength) {
    return res.status(404).json({ success: false, error: 'Course not found' });
  }

  res.json({ success: true, message: 'Course deleted successfully' });
});

// POST /api/upload/image
app.post('/api/upload/image', (req, res) => {
  // This is a mock upload. In a real app, you'd use a library like multer
  // to handle the file upload and save it to a storage service.
  res.json({ success: true, image_url: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400&h=200&fit=crop' });
});


// --- Student Course Player ---

// GET /api/courses/:id
app.get('/api/courses/:id', (req, res) => {
  const courseId = parseInt(req.params.id, 10);
  const course = courses.find(c => c.id === courseId);

  if (course) {
    res.json(course);
  } else {
    res.status(404).json({ success: false, error: 'Course not found' });
  }
});

// --- Student Learning & AI Tutor ---

// GET /api/my-learning
app.get('/api/my-learning', (req, res) => {
  // Return a sample of courses the "user" is enrolled in.
  res.json([
    { id: 1, title: 'Introduction to React', level: 'Beginner', category: 'Development', progress: 50 },
    { id: 2, title: 'Advanced CSS and Sass', level: 'Advanced', category: 'Design', progress: 25 },
  ]);
});

// POST /api/ai/tutor
app.post('/api/ai/tutor', (req, res) => {
  const { message } = req.body;
  
  let reply = "I'm sorry, I'm not sure how to answer that. Try asking me to 'explain a concept' or 'quiz me'.";
  if (message.toLowerCase().includes('explain')) {
    reply = "Of course! Let's break down that concept. What specific topic from your course would you like me to explain?";
  } else if (message.toLowerCase().includes('quiz')) {
    reply = "Great idea! Here's a quick question for you based on your 'Introduction to React' course: What is the purpose of `useState`?";
  }

  res.json({ success: true, reply: reply });
});

// --- Settings ---
app.get('/api/settings/public-content', (req, res) => {
  res.json({
    success: true,
    content: {
      siteName: "MysteryPath",
      siteDescription: "Your mysterious path to knowledge mastery",
      contactEmail: "support@mysterypath.com",
      aboutHeadline: "Unravel the mysteries of modern technology",
      aboutBody: "MysteryPath is an innovative learning platform designed to guide you through complex subjects with clarity and engagement. Our courses are crafted by experts to build practical, real-world skills.",
      privacyPolicy: "We value your privacy. At MysteryPath, we only collect information necessary to provide our services. We are transparent about how we use your data and are committed to keeping it secure. We do not sell your personal information to third parties. Your learning journey is your own, and we respect that.",
      termsOfService: "By accessing the website at MysteryPath, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site."
    }
  });
});


const startServer = async () => {
  try {
    const message = `
      ERROR: This Node.js server (server.js) is a mock/legacy server and should not be run.
      The primary backend for this application is the Python/Flask application.
      Please navigate to the '/backend' directory and follow the instructions there to start the correct server.
    `;
    console.error("\x1b[31m%s\x1b[0m", message); // Print message in red
    process.exit(1);
  } catch (error) {
    console.error('❌ Unable to connect to the database or start server:', error);
    // process.exit(1);
  }
};

startServer();