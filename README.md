# TaskFlow — Team Task Manager

A full-stack web application for project and task management with role-based access control.

## 🚀 Features
- **Authentication** — Signup, Login with JWT
- **Projects** — Create, manage, delete projects
- **Teams** — Add/remove members with Admin/Member roles
- **Tasks** — Create, assign, track with Kanban board
- **Dashboard** — Real-time stats, overdue alerts
- **Role-Based Access** — Admin vs Member permissions

## ⚙️ Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite) |
| Backend | Node.js + Express |
| Database | MongoDB (Mongoose) |
| Auth | JWT + bcryptjs |
| Deployment | Railway |

## 📦 Project Structure
```
task-manager/
├── backend/          # Express API + Mongoose
│   ├── src/
│   │   ├── models/        # User, Project, Task
│   │   ├── controllers/   # Business logic
│   │   ├── routes/        # API endpoints
│   │   └── middleware/    # Auth, RBAC, errors
│   └── package.json
├── frontend/         # React + Vite
│   └── src/
│       ├── pages/         # Login, Signup, Dashboard, Projects
│       ├── components/    # Navbar, ParticleCanvas
│       └── context/       # AuthContext
├── scripts/          # Build helpers
├── nixpacks.toml     # Railway build config
└── railway.json      # Railway deploy config
```

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- MongoDB running locally

### Setup
```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Create backend/.env
MONGO_URI="mongodb://localhost:27017/taskmanager"
JWT_SECRET="your_secret_key"
PORT=5000
NODE_ENV=development

# Start backend (terminal 1)
cd backend && npm run dev

# Start frontend (terminal 2)
cd frontend && npm run dev
```

Open `http://localhost:5173` in your browser.

## 🌐 Railway Deployment
1. Push to GitHub
2. Create Railway project → Deploy from GitHub
3. Add MongoDB Atlas connection string as `MONGO_URI`
4. Set `JWT_SECRET` and `NODE_ENV=production`
5. Deploy!

## 📝 API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | ❌ | Register |
| POST | `/api/auth/login` | ❌ | Login |
| GET | `/api/auth/me` | ✅ | Current user |
| GET | `/api/dashboard` | ✅ | Dashboard stats |
| GET/POST | `/api/projects` | ✅ | List/Create projects |
| GET/PUT/DELETE | `/api/projects/:id` | ✅ | Project CRUD |
| GET/POST/DELETE | `/api/projects/:id/members` | ✅ | Member management |
| GET/POST | `/api/projects/:id/tasks` | ✅ | Task list/create |
| PUT/PATCH/DELETE | `/api/tasks/:id` | ✅ | Task update/delete |

## 👨‍💻 Author
Built with ❤️ using MongoDB, Express, React & Node.js
