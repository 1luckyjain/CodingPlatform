# ⚡ CodingCollege — Competitive Programming Platform

A full-stack, production-ready competitive coding platform built with the **MERN stack** (MongoDB, Express, React, Node.js).

![Platform Preview](https://img.shields.io/badge/Stack-MERN-blue) ![Judge0](https://img.shields.io/badge/Execution-Judge0_CE-green) ![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 🚀 Features

### 👤 User Role
- ✅ Register / Login with JWT authentication
- ✅ Dashboard with personal stats and recent submissions
- ✅ Browse & search problems with difficulty filter
- ✅ Monaco code editor (VS Code in browser)
- ✅ Run & Submit code in **JavaScript, Python, C++, C, Java**
- ✅ Real-time verdicts: Accepted / Wrong Answer / TLE / Runtime Error / Compilation Error
- ✅ View submission history
- ✅ Join contests with live countdown timer
- ✅ Contest leaderboard
- ✅ Global leaderboard

### 🏆 Host Role
- ✅ Create problems with sample + hidden test cases
- ✅ Create and manage contests
- ✅ Analytics dashboard with charts (Recharts)
- ✅ View submission stats per problem

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | React, Monaco Editor, Recharts, React Router v6 |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Mongoose) |
| **Auth** | JWT (JSON Web Tokens) |
| **Code Execution** | [Judge0 CE](https://ce.judge0.com) (free, no key needed) |
| **Styling** | Vanilla CSS (custom dark theme design system) |

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Git

### 1. Clone the repo
```bash
git clone https://github.com/1luckyjain/CodingPlatform.git
cd CodingPlatform
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env and add your MongoDB URI and JWT secret
npm run dev
```

### 3. Setup Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm start
```

### 4. Seed the Database (first time only)
```bash
cd backend
npm run seed
```

This creates:
- 8 sample coding problems (Easy / Medium / Hard)
- 2 sample contests
- 3 demo accounts

---

## 🔑 Demo Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| 🏆 Host | `host@demo.com` | `demo123` |
| 👤 User | `user@demo.com` | `demo123` |

---

## 📁 Project Structure

```
CodingPlatform/
├── backend/
│   ├── config/          # DB connection
│   ├── controllers/     # Route handlers
│   ├── middleware/       # Auth, error handling
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routes
│   ├── services/        # Judge0 code execution
│   ├── seed.js          # Database seeder
│   └── server.js        # Express entry point
│
└── frontend/
    ├── public/
    └── src/
        ├── components/  # Navbar, ProtectedRoute
        ├── context/     # AuthContext
        ├── pages/
        │   ├── auth/    # Login, Register
        │   ├── user/    # Dashboard, Problems, Contests...
        │   ├── host/    # HostDashboard, Analytics...
        │   └── Landing  # Landing page
        └── services/    # API client (axios)
```

---

## 🌐 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/problems` | Get all problems |
| GET | `/api/problems/:id` | Get problem details |
| POST | `/api/submissions` | Submit code |
| POST | `/api/submissions/run` | Run code (no save) |
| GET | `/api/contests` | Get all contests |
| GET | `/api/analytics/leaderboard` | Global leaderboard |

---

## 📄 License

MIT © 2026 CodingCollege
