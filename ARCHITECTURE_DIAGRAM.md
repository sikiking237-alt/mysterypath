# MysteryPath Architecture Diagram

## System Overview

MysteryPath (also known as learnFlow) is a full-stack e-learning platform built with React (frontend) and Flask (backend), featuring role-based access control, real-time communication, and gamification elements.

---

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
    end
    
    subgraph "Frontend - React + Vite"
        App[App.jsx]
        Router[React Router]
        Pages[Pages Components]
        Components[UI Components]
        Redux[Redux Store]
        RTKQuery[RTK Query API]
        SocketClient[Socket.io Client]
    end
    
    subgraph "Backend - Flask"
        Server[Flask Server]
        CORS[CORS Middleware]
        Auth[JWT Auth]
        SocketIO[Socket.io Server]
        Routes[API Routes]
    end
    
    subgraph "Data Layer"
        SQLite[(SQLite Database)]
        Static[Static Files]
        Uploads[Upload Folder]
    end
    
    Browser -->|HTTP/WebSocket| Server
    App --> Router
    Router --> Pages
    Router --> Components
    Pages --> Redux
    Pages --> RTKQuery
    Pages --> SocketClient
    
    Server --> CORS
    CORS --> Auth
    Auth --> Routes
    Auth --> SocketIO
    
    Routes --> SQLite
    Routes --> Static
    Routes --> Uploads
    
    SocketClient -->|WebSocket| SocketIO
    
    RTKQuery -->|HTTP API| Routes
```

---

## Frontend Architecture

```mermaid
graph TB
    subgraph "Entry Point"
        Main[main.jsx]
    end
    
    subgraph "State Management"
        Store[Redux Store]
        CoursesApi[coursesApi.js]
        SettingsSlice[settingsSlice.js]
    end
    
    subgraph "Routing"
        AppRouter[App.jsx Router]
        LoginRoute[Login/Signup]
        StudentRoutes[Student Routes]
        InstructorRoutes[Instructor Routes]
        AdminRoutes[Admin Routes]
    end
    
    subgraph "Pages"
        HomePage[HomePage]
        CoursePlayer[CoursePlayer]
        MyLearning[MyLearningPage]
        CoursesPage[CoursesPage]
        ChatPage[ChatPage]
        NotesPage[NotesPage]
        Flashcards[FlashcardsPage]
        AITutor[AITutorPage]
        Certificates[MyCertificates]
    end
    
    subgraph "Components"
        Navbar[Navbar Components]
        Dashboard[Dashboard Components]
        AdminComp[Admin Components]
        InstructorComp[Instructor Components]
        StudentComp[Student Components]
    end
    
    Main --> Store
    Main --> AppRouter
    
    Store --> CoursesApi
    Store --> SettingsSlice
    
    AppRouter --> LoginRoute
    AppRouter --> StudentRoutes
    AppRouter --> InstructorRoutes
    AppRouter --> AdminRoutes
    
    StudentRoutes --> HomePage
    StudentRoutes --> CoursePlayer
    StudentRoutes --> MyLearning
    StudentRoutes --> ChatPage
    StudentRoutes --> NotesPage
    StudentRoutes --> Flashcards
    StudentRoutes --> AITutor
    StudentRoutes --> Certificates
    
    InstructorRoutes --> InstructorComp
    AdminRoutes --> AdminComp
    
    Pages --> Navbar
    Pages --> Dashboard
    Pages --> Components
```

---

## Backend Architecture

```mermaid
graph TB
    subgraph "Main Application"
        AppPy[app.py]
        Config[config.py]
        Database[database.py]
    end
    
    subgraph "API Routes"
        AuthRoutes[auth.py]
        InstructorRoutes[instructor_routes.py]
        CoursesRoutes[courses.js]
        EnrollmentRoutes[enrollment.js]
    end
    
    subgraph "Middleware"
        CORS[CORS]
        Bcrypt[Flask-Bcrypt]
        JWT[PyJWT]
        SocketIO[Flask-SocketIO]
    end
    
    subgraph "Database Tables"
        Users[users]
        Courses[courses]
        Enrollments[enrollments]
        Modules[modules]
        Lessons[lessons]
        Notifications[notifications]
        Messages[messages]
        PasswordResets[password_resets]
        Settings[settings]
        Questions[questions]
        QuestionOptions[question_options]
    end
    
    AppPy --> Config
    AppPy --> Database
    AppPy --> Middleware
    AppPy --> API Routes
    
    AuthRoutes --> Users
    AuthRoutes --> PasswordResets
    
    InstructorRoutes --> Courses
    InstructorRoutes --> Users
    
    CoursesRoutes --> Courses
    CoursesRoutes --> Modules
    CoursesRoutes --> Lessons
    
    EnrollmentRoutes --> Enrollments
    EnrollmentRoutes --> Courses
    
    Middleware --> Database
```

---

## Database Schema

```mermaid
erDiagram
    users ||--o{ courses : "instructs"
    users ||--o{ enrollments : "enrolls in"
    users ||--o{ notifications : "receives"
    users ||--o{ messages : "sends"
    users ||--o{ messages : "receives"
    
    courses ||--o{ enrollments : "has enrollments"
    courses ||--o{ modules : "contains"
    courses ||--o{ questions : "has quizzes"
    
    modules ||--o{ lessons : "contains"
    
    lessons ||--o{ questions : "may have"
    
    questions ||--o{ question_options : "has options"
    
    users {
        integer id PK
        string name
        string email UK
        string password
        string role
        integer xp
        integer streak_days
        integer longest_streak
        integer total_activities
        text bio
        text profile_image
        timestamp last_login_date
        timestamp created_at
    }
    
    courses {
        integer id PK
        string title
        integer instructor_id FK
        string level
        string category
        text description
        real rating
        string duration
        string students
        text image_url
        integer price
        integer xp_reward
        timestamp created_at
    }
    
    enrollments {
        integer id PK
        integer user_id FK
        integer course_id FK
        integer progress
        timestamp enrolled_date
        timestamp completed_at
    }
    
    modules {
        integer id PK
        integer course_id FK
        string title
        integer order_index
        timestamp created_at
    }
    
    lessons {
        integer id PK
        integer module_id FK
        string title
        string type
        text content
        string duration
        text video_url
        integer order_index
        timestamp created_at
    }
    
    notifications {
        integer id PK
        integer user_id FK
        string title
        text message
        string type
        boolean is_read
        timestamp created_at
    }
    
    messages {
        integer id PK
        integer sender_id FK
        integer receiver_id FK
        text content
        timestamp timestamp
        boolean is_read
    }
    
    questions {
        integer id PK
        integer course_id FK
        text question_text
        string question_type
        integer points
        integer order_index
        timestamp created_at
    }
    
    question_options {
        integer id PK
        integer question_id FK
        text option_text
        boolean is_correct
        integer order_index
        timestamp created_at
    }
```

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database
    
    User->>Frontend: Enter credentials
    Frontend->>Backend: POST /api/login
    Backend->>Database: Query user by email
    Database-->>Backend: User data
    Backend->>Backend: Verify password with bcrypt
    Backend->>Backend: Update streak & last login
    Backend->>Backend: Generate JWT token
    Backend-->>Frontend: Token + User data
    Frontend->>Frontend: Store in localStorage
    Frontend->>Frontend: Update Redux state
    Frontend->>User: Redirect to dashboard
    
    Note over Frontend,Backend: Subsequent requests include JWT in Authorization header
```

---

## Course Enrollment Flow

```mermaid
sequenceDiagram
    participant Student
    participant Frontend
    participant Backend
    participant Database
    
    Student->>Frontend: Click "Enroll" on course
    Frontend->>Backend: POST /api/enroll (with JWT)
    Backend->>Backend: Verify JWT & user role
    Backend->>Database: Check if already enrolled
    alt Not enrolled
        Backend->>Database: Create enrollment record
        Backend->>Database: Award XP to user
        Backend-->>Frontend: Success response
        Frontend->>Frontend: Update UI state
        Frontend->>Student: Show success message
    else Already enrolled
        Backend-->>Frontend: Already enrolled error
        Frontend->>Student: Show "Already enrolled"
    end
```

---

## Real-time Communication (Socket.IO)

```mermaid
graph LR
    subgraph "Frontend"
        SocketClient[Socket.io Client]
        ChatComponent[Chat Component]
        LiveClass[Live Video Class]
        CodeSession[Live Code Session]
    end
    
    subgraph "Backend"
        SocketServer[Socket.io Server]
        Events[Event Handlers]
        Rooms[Room Management]
    end
    
    SocketClient -->|WebSocket| SocketServer
    ChatComponent --> SocketClient
    LiveClass --> SocketClient
    CodeSession --> SocketClient
    
    SocketServer --> Events
    Events --> Rooms
    
    Events -->|Broadcast| SocketClient
```

---

## Role-Based Access Control

```mermaid
graph TB
    subgraph "User Roles"
        Admin[Admin]
        Instructor[Instructor]
        Student[Student]
    end
    
    subgraph "Admin Features"
        AdminDashboard[Admin Dashboard]
        ManageUsers[Manage Users]
        ManageCourses[Manage All Courses]
        ManageInstructors[Manage Instructors]
        SystemSettings[System Settings]
        SendNotifications[Send Notifications]
        RevenueAnalytics[Revenue Analytics]
    end
    
    subgraph "Instructor Features"
        InstructorDashboard[Instructor Dashboard]
        CreateCourses[Create/Edit Courses]
        ManageStudents[Manage Students]
        LiveClasses[Live Video Classes]
        CodeSessions[Live Code Sessions]
        Analytics[Course Analytics]
    end
    
    subgraph "Student Features"
        BrowseCourses[Browse Courses]
        Enroll[Enroll in Courses]
        CoursePlayer[Course Player]
        Chat[Chat/Messaging]
        Notes[Notes]
        Flashcards[Flashcards]
        AITutor[AI Tutor]
        Certificates[Certificates]
        Achievements[Achievements]
    end
    
    Admin --> AdminDashboard
    Admin --> ManageUsers
    Admin --> ManageCourses
    Admin --> ManageInstructors
    Admin --> SystemSettings
    Admin --> SendNotifications
    Admin --> RevenueAnalytics
    
    Instructor --> InstructorDashboard
    Instructor --> CreateCourses
    Instructor --> ManageStudents
    Instructor --> LiveClasses
    Instructor --> CodeSessions
    Instructor --> Analytics
    
    Student --> BrowseCourses
    Student --> Enroll
    Student --> CoursePlayer
    Student --> Chat
    Student --> Notes
    Student --> Flashcards
    Student --> AITutor
    Student --> Certificates
    Student --> Achievements
```

---

## API Endpoints Structure

### Authentication Routes (`/api/auth`)
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /api/profile` - Get user profile
- `POST /api/update-activity` - Update user activity/XP
- `POST /api/forgot-password` - Initiate password reset
- `POST /api/verify-reset-code` - Verify reset code
- `POST /api/reset-password` - Reset password
- `POST /api/complete-registration` - Complete instructor registration

### Instructor Routes (`/api/instructor`)
- `GET /instructor/stats` - Get instructor statistics
- `GET /instructor/courses` - Get instructor's courses
- `POST /instructor/courses` - Create new course
- `PUT /instructor/courses/:id` - Update course
- `DELETE /instructor/courses/:id` - Delete course

### Student Routes (`/api/student`)
- `GET /student/courses/:id/structure` - Get course structure
- `GET /student/enrolled-count` - Get enrolled courses count
- `POST /enroll` - Enroll in course

### Admin Routes (`/api/admin`)
- `GET /admin/stats` - Get platform statistics
- `GET /admin/users` - Get all users
- `GET /admin/all-courses` - Get all courses
- `PUT /admin/courses/:id` - Update any course
- `DELETE /admin/courses/:id` - Delete any course
- `POST /admin/settings/logo` - Update site logo

### General Routes
- `GET /api/settings/logo` - Get site logo
- `POST /api/upload/image` - Upload course image
- `GET /api/test` - Test endpoint

---

## Technology Stack

### Frontend
- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.4.21
- **State Management**: Redux Toolkit 2.12.0
- **API Client**: RTK Query (Redux Toolkit Query)
- **Routing**: React Router DOM 6.30.4
- **Styling**: TailwindCSS 3.4.1
- **Icons**: Lucide React 1.17.0
- **Real-time**: Socket.io Client 4.8.3
- **HTTP Client**: Axios 1.17.0
- **PDF Generation**: jsPDF 4.2.1
- **Video Player**: React Player 2.14.1
- **Charts**: Recharts 2.12.0
- **Code Editor**: Monaco Editor 4.6.0
- **MediaPipe**: Selfie Segmentation 0.1.1675465747

### Backend
- **Framework**: Flask 2.3.3
- **Database**: SQLite
- **Authentication**: Flask-Bcrypt 1.0.1, PyJWT 2.8.0
- **CORS**: Flask-CORS 4.0.0
- **Real-time**: Flask-SocketIO
- **Async Mode**: Eventlet (if available) or Threading

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **PostCSS**: Autoprefixer 10.4.18

---

## Key Features

1. **Multi-Role Authentication**: Admin, Instructor, Student roles with JWT-based authentication
2. **Course Management**: Create, edit, delete courses with modules and lessons
3. **Enrollment System**: Students can enroll in courses and track progress
4. **Gamification**: XP system, streak tracking, achievements
5. **Real-time Features**: Live video classes, live code sessions, chat/messaging
6. **Content Types**: Video lessons, text content, quizzes
7. **Learning Tools**: Notes, flashcards, AI tutor
8. **Certificates**: Generate certificates upon course completion
9. **Admin Dashboard**: Platform analytics, user management, system settings
10. **Instructor Analytics**: Track student progress, course performance

---

## File Structure

```
MysteryPath/
├── app.py                      # Main Flask application (root)
├── package.json                # Frontend dependencies
├── vite.config.js              # Vite configuration
├── tailwind.config.cjs         # TailwindCSS configuration
├── index.html                  # HTML entry point
├── .env                        # Environment variables
├── elearning.db                # SQLite database
│
├── backend/
│   ├── app.py                  # Modular Flask app
│   ├── config.py               # Configuration
│   ├── database.py             # Database initialization
│   ├── requirements.txt        # Python dependencies
│   ├── routes/
│   │   ├── auth.py             # Authentication routes
│   │   ├── instructor_routes.py # Instructor routes
│   │   ├── courses.js          # Course routes
│   │   └── enrollment.js       # Enrollment routes
│   ├── middleware/             # Custom middleware
│   ├── static/                 # Static files
│   └── venv/                   # Python virtual environment
│
├── src/
│   ├── main.jsx                # React entry point
│   ├── App.jsx                 # Main React component
│   ├── store.js                # Redux store configuration
│   ├── coursesApi.js           # RTK Query API configuration
│   ├── index.css               # Global styles
│   ├── App.css                 # App styles
│   │
│   ├── pages/                  # Page components
│   │   ├── HomePage.jsx
│   │   ├── CoursePlayer.jsx
│   │   ├── MyLearningPage.jsx
│   │   ├── CoursesPage.jsx
│   │   ├── ChatPage.jsx
│   │   ├── NotesPage.jsx
│   │   ├── FlashcardsPage.jsx
│   │   ├── AITutorPage.jsx
│   │   ├── AchievementsPage.jsx
│   │   ├── MyCertificates.jsx
│   │   └── ...
│   │
│   ├── components/             # Reusable components
│   │   ├── Admin/              # Admin-specific components
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── ManageUsers.jsx
│   │   │   ├── ManageCourses.jsx
│   │   │   ├── SystemSettings.jsx
│   │   │   └── ...
│   │   ├── Instructor/         # Instructor-specific components
│   │   │   ├── InstructorDashboard.jsx
│   │   │   ├── ManageCourses.jsx
│   │   │   ├── LiveVideoClass.jsx
│   │   │   ├── LiveCodeSession.jsx
│   │   │   └── ...
│   │   ├── Navbar.jsx
│   │   ├── StudentNavbar.jsx
│   │   ├── AdminNavbar.jsx
│   │   ├── InstructorNavbar.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Chat.jsx
│   │   ├── Profile.jsx
│   │   └── ...
│   │
│   ├── assets/                 # Static assets
│   └── config/                 # Configuration files
│
├── public/                     # Public static files
├── logs/                       # Application logs
└── node_modules/               # npm dependencies
```

---

## Data Flow Example: Course Creation

```mermaid
sequenceDiagram
    participant Instructor
    participant Frontend
    participant Redux
    participant Backend
    participant Database
    
    Instructor->>Frontend: Fill course form
    Frontend->>Redux: Dispatch createCourse mutation
    Redux->>Backend: POST /api/instructor/courses
    Backend->>Backend: Verify JWT & instructor role
    Backend->>Backend: Validate course data
    Backend->>Database: Insert course record
    Database-->>Backend: Course ID
    Backend->>Database: Award XP to instructor
    Backend-->>Redux: Success response
    Redux->>Redux: Invalidate courses cache
    Redux-->>Frontend: Update UI
    Frontend->>Instructor: Show success & redirect
```

---

## Security Considerations

1. **JWT Authentication**: All protected routes require valid JWT token
2. **Password Hashing**: Bcrypt for secure password storage
3. **CORS**: Configured for specific origins only
4. **Role-Based Access**: Middleware checks user roles before granting access
5. **SQL Injection Prevention**: Parameterized queries throughout
6. **File Upload Validation**: File type and size restrictions
7. **Rate Limiting**: Password reset attempts limited
8. **Environment Variables**: Sensitive data stored in .env file

---

## Deployment Considerations

1. **Database**: SQLite is suitable for development; consider PostgreSQL for production
2. **Secret Key**: Must be changed from default in production
3. **CORS Origins**: Update ALLOWED_ORIGINS for production domain
4. **File Storage**: Consider cloud storage (S3) for uploaded files in production
5. **Logging**: Rotating file handler configured for error logs
6. **Socket.IO**: Ensure proper WebSocket support in production environment
7. **Frontend**: Build with `npm run build` for production deployment
8. **Backend**: Use production WSGI server (e.g., Gunicorn) instead of Flask dev server

---

## Future Enhancement Opportunities

1. **Payment Integration**: Stripe/PayPal for paid courses
2. **Video Streaming**: Integrate dedicated video hosting (Vimeo, AWS)
3. **Email Service**: Real email notifications (SendGrid, AWS SES)
4. **Advanced Analytics**: More detailed learning analytics
5. **Mobile App**: React Native mobile application
6. **API Documentation**: Swagger/OpenAPI documentation
7. **Testing**: Unit and integration tests
8. **CI/CD**: Automated testing and deployment pipeline
9. **Monitoring**: Application performance monitoring
10. **Scalability**: Move to microservices architecture if needed
