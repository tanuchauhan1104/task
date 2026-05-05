# ⚡ TaskFlow — Team Task Manager

A full-stack web app for managing projects, assigning tasks, and tracking team progress with role-based access control.

## 🚀 Live Demo
> Deploy using the Railway instructions below. App will be live at your Railway URL.

## ✨ Features

- **Authentication** — JWT-based signup/login with role selection (Admin / Member)
- **Role-Based Access Control** — Admins manage projects & members; members work on tasks
- **Projects** — Create projects, invite team members by email, track progress
- **Tasks** — Create, assign, update, and delete tasks with priority & due dates
- **Kanban Board** — Visual status tracking (To Do / In Progress / Done)
- **Dashboard** — Overview stats, recent tasks, overdue alerts
- **Filters** — Filter tasks by status, priority, assignee, overdue

## 🏗 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, React Router v6 |
| Backend | Node.js, Express.js |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT + bcrypt |
| Deployment | Railway |

## 📁 Project Structure

```
task-manager/
├── backend/
│   ├── routes/
│   │   ├── auth.js       # Login, signup, /me
│   │   ├── projects.js   # Project CRUD + members
│   │   ├── tasks.js      # Task CRUD + dashboard stats
│   │   └── users.js      # User listing
│   ├── middleware/
│   │   └── auth.js       # JWT middleware
│   ├── db.js             # SQLite setup & schema
│   └── server.js         # Express app entry
├── frontend/
│   ├── src/
│   │   ├── context/AuthContext.js
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Signup.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Projects.js
│   │   │   ├── ProjectDetail.js
│   │   │   └── Tasks.js
│   │   ├── components/Layout.js
│   │   ├── api.js
│   │   └── App.js
├── railway.toml
└── package.json
```

## ⚙️ Local Development

### Prerequisites
- Node.js 18+
- npm

### Setup

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Run

**Terminal 1 — Backend:**
```bash
cd backend
node server.js
# Running on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
# Running on http://localhost:3000
```

The frontend's `proxy` in `package.json` forwards `/api/*` to the backend automatically.

## 🌐 Deploy to Railway

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/task-manager.git
   git push -u origin main
   ```

2. **Create Railway project:**
   - Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
   - Select your repository

3. **Railway auto-detects** `railway.toml` and:
   - Builds the React frontend
   - Starts the Express backend (which serves the built frontend)

4. **Environment Variables** (optional but recommended):
   ```
   JWT_SECRET=your_super_secret_key_here
   NODE_ENV=production
   ```

5. **Generate domain:** Settings → Networking → Generate Domain

That's it! Your app is live. 🎉

## 🔐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | My projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Project detail |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/projects/:id/members` | List members |
| POST | `/api/projects/:id/members` | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Remove member |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks (filterable) |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Task detail |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/tasks/dashboard/stats` | Dashboard stats |

## 🏷 Role Permissions

| Action | Admin | Member |
|--------|-------|--------|
| Create project | ✅ | ✅ |
| Delete project | ✅ (owner) | ❌ |
| Add/remove members | ✅ | ❌ |
| Create tasks | ✅ | ✅ |
| Update any task | ✅ | Own/assigned only |
| Delete any task | ✅ | Own tasks only |
# task
# task
# task
# task
