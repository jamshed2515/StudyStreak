# StudyStreak - Study Challenge Tracker

A MERN stack application for students to track their study challenges and daily tasks. Perfect for JEE/BTech students preparing for exams.

## Features

- **User Authentication** - Secure signup/login with JWT
- **Challenge System** - Create 21/30/45/60 day challenges
- **Daily Task Management** - Add, complete, and track tasks by category
- **Streak Tracking** - Visual streak counter to maintain motivation
- **Exam Countdown** - Live countdown to your exam date
- **Progress Calendar** - Visual calendar showing completed days
- **Category-based Tasks** - Physics, Chemistry, Mathematics, DSA, Coding, etc.
- **Priority Levels** - High, Medium, Low priority tasks
- **Beautiful Dark UI** - Modern, responsive design

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Auth**: JWT (JSON Web Tokens)
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB (local or Atlas cloud)

### Installation

1. **Clone and install dependencies**

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

2. **Configure environment variables**

```bash
# In server/.env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/study-streak
JWT_SECRET=your-secret-key
```

3. **Start the development servers**

```bash
# Terminal 1 - Start backend
cd server
npm run dev

# Terminal 2 - Start frontend
cd client
npm run dev
```

4. **Open your browser**

Navigate to `http://localhost:3000`

## Project Structure

```
study-streak/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context (Auth)
│   │   └── api/            # Axios instance
│   └── package.json
├── server/                 # Express backend
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── middleware/         # Auth middleware
│   ├── config/             # Database config
│   └── server.js
└── README.md
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Challenges
- `POST /api/challenges` - Create challenge
- `GET /api/challenges` - Get all challenges
- `GET /api/challenges/active` - Get active challenge
- `GET /api/challenges/:id/stats` - Get challenge stats
- `POST /api/challenges/:id/complete-day` - Mark day complete

### Tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/today` - Get today's tasks
- `PUT /api/tasks/:id/toggle` - Toggle task completion
- `DELETE /api/tasks/:id` - Delete task

## Where Your Data Is Stored

All app data is stored in **MongoDB**.

- **Connection**: Set in `server/.env` as `MONGODB_URI`.
  - Local: `mongodb://localhost:27017/study-streak`
  - Cloud: use a MongoDB Atlas connection string.
- **Database name**: `study-streak` (or the database name in your URI).
- **Collections**:
  - **users** – name, email (hashed password), examType, examDate, etc.
  - **challenges** – title, startDate, endDate, targetDays, completedDays, streaks, etc.
  - **tasks** – title, category, subtopic, priority, date, isCompleted, estimatedMinutes, etc.

To view data locally: use **MongoDB Compass** or run `mongosh`, connect to the same URI, then use database `study-streak`.

## Deployment

### Backend (Render/Railway)
1. Push code to GitHub
2. Connect to Render/Railway
3. Set environment variables
4. Deploy

### Frontend (Vercel/Netlify)
1. Push code to GitHub
2. Connect to Vercel/Netlify
3. Set `VITE_API_URL` to your backend URL
4. Deploy

## License

MIT
