# 📊 Subscription Analytics Manager

A full-stack subscription management platform with real-time usage analytics, role-based access control, and a production-ready CI/CD pipeline. Built with **React**, **Node.js/Express**, and **PostgreSQL**, containerized with **Docker**, and deployable to **Kubernetes**.

![Dashboard Screenshot](photo/1.png)

---

## 🚀 Features

- **User Authentication** — Secure JWT-based registration & login with bcrypt password hashing
- **Subscription Plans** — Tiered plan system (Free / Pro / Enterprise) with admin-managed pricing
- **Usage Analytics Dashboard** — Real-time 7-day trend charts for API calls and storage consumption
- **Cumulative Metrics** — Running-total usage tracking with add/remove operations
- **Admin Panel** — Manage users, assign plans, and create new subscription tiers
- **Role-Based Access Control** — Separate user and admin experiences
- **Health Monitoring** — Built-in `/health` endpoint for container orchestration
- **CI/CD Pipeline** — Automated Jenkins pipeline with Docker Hub push and Kubernetes deployment

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
│                      (localhost:8040)                         │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────┐       ┌──────────────────────────┐
│   Frontend (React/Vite)  │       │   Backend (Express.js)   │
│   Served via Nginx       │──────▶│   REST API on :5000      │
│   Port 8040 → 80         │       │   JWT Auth Middleware     │
└──────────────────────────┘       └────────────┬─────────────┘
                                                │
                                                ▼
                                   ┌──────────────────────────┐
                                   │  PostgreSQL 15 (Alpine)  │
                                   │  Port 5431 → 5432        │
                                   │  subscription_analytics  │
                                   └──────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer        | Technology                                   |
| ------------ | -------------------------------------------- |
| **Frontend** | React 18, Vite, Chart.js, React Router v6    |
| **Backend**  | Node.js, Express 4, JWT, bcryptjs, pg        |
| **Database** | PostgreSQL 15 (Alpine)                       |
| **Styling**  | Custom CSS with dark theme & glassmorphism   |
| **Proxy**    | Nginx (production frontend serving & API proxy) |
| **Container**| Docker, Docker Compose                       |
| **CI/CD**    | Jenkins (Declarative Pipeline)               |
| **Orchestration** | Kubernetes (Docker Desktop / Minikube)  |

---

## 📂 Project Structure

```
Subscription_man/
├── backend/
│   ├── Dockerfile            # Multi-stage Node.js build
│   ├── db.js                 # PostgreSQL connection pool
│   ├── index.js              # Express API (auth, usage, admin)
│   ├── package.json
│   └── .env                  # Environment variables (local dev)
│
├── frontend/
│   ├── Dockerfile            # Multi-stage Vite build → Nginx
│   ├── nginx.conf            # Reverse proxy config for API
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── App.jsx           # Routes, auth context, navigation
│       ├── main.jsx          # Entry point with BrowserRouter
│       ├── index.css         # Dark theme design system
│       └── components/
│           ├── Auth.jsx      # Login & Registration forms
│           ├── Dashboard.jsx # Usage charts & metric cards
│           └── Admin.jsx     # User management & plan CRUD
│
├── k8s/                      # Kubernetes manifests
│   ├── namespace.yaml
│   ├── secrets.yaml
│   ├── db.yaml               # PostgreSQL StatefulSet + PVC
│   ├── backend.yaml          # Backend Deployment + Service
│   ├── frontend.yaml         # Frontend Deployment + Service
│   └── init-configmap.yaml   # DB init script as ConfigMap
│
├── photo/                    # Screenshots for documentation
├── docker-compose.yml        # Local development orchestration
├── init.sql                  # Database schema & seed data
├── Jenkinsfile               # CI/CD pipeline definition
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (with Docker Compose)
- [Node.js 18+](https://nodejs.org/) (for local development without Docker)
- [Git](https://git-scm.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/rajvbiw/subcription_management.git
cd Subscription_man
```

### 2. Run with Docker Compose (Recommended)

```bash
docker-compose up -d --build
```

This spins up three containers:

| Service      | Container Name          | URL                          |
| ------------ | ----------------------- | ---------------------------- |
| **Frontend** | `subscription_frontend` | http://localhost:8040         |
| **Backend**  | `subscription_backend`  | http://localhost:5000         |
| **Database** | `subscription_db`       | `localhost:5431` (PostgreSQL) |

The database is automatically initialized with schema and seed data from `init.sql`.

### 3. Verify

```bash
# Check backend health
curl http://localhost:5000/health
# Expected: {"status":"ok"}
```

Open **http://localhost:8040** in your browser to access the dashboard.

### 4. Stop

```bash
docker-compose down -v
```

---

## 🧑‍💻 Local Development (Without Docker)

### Backend

```bash
cd backend
npm install

# Create .env file
echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/subscription_analytics > .env
echo JWT_SECRET=your_secret_key >> .env
echo PORT=5000 >> .env

npm run dev   # starts with nodemon
```

### Frontend

```bash
cd frontend
npm install
npm run dev   # starts Vite dev server on http://localhost:5173
```

> The frontend dev server proxies API requests to `http://localhost:5000` automatically.

---

## 📡 API Reference

### Authentication

| Method | Endpoint              | Body                              | Description         |
| ------ | --------------------- | --------------------------------- | ------------------- |
| POST   | `/api/auth/register`  | `{ email, password, planId? }`    | Register a new user |
| POST   | `/api/auth/login`     | `{ email, password }`             | Login, returns JWT  |

### Usage Tracking (🔒 Requires Auth Token)

| Method | Endpoint              | Body            | Description                            |
| ------ | --------------------- | --------------- | -------------------------------------- |
| GET    | `/api/usage`          | —               | Get 7-day cumulative usage trends      |
| POST   | `/api/usage/api-call` | `{ count }`     | Record API call activity (±)           |
| POST   | `/api/usage/storage`  | `{ mb }`        | Record storage change in MB (±)        |

### Admin (🔒 Requires Auth + Admin Role)

| Method | Endpoint                        | Body              | Description           |
| ------ | ------------------------------- | ----------------- | --------------------- |
| GET    | `/api/admin/users`              | —                 | List all users        |
| PATCH  | `/api/admin/users/:userId/plan` | `{ planId }`      | Change user's plan    |
| GET    | `/api/admin/plans`              | —                 | List all plans        |
| POST   | `/api/admin/plans`              | `{ name, price }` | Create a new plan     |

### Health Check

| Method | Endpoint   | Description                 |
| ------ | ---------- | --------------------------- |
| GET    | `/health`  | Returns `{ status: "ok" }`  |

---

## 🗄️ Database Schema

```sql
-- Subscription Plans
plans (id, name, price, created_at)

-- Users with plan assignment
users (id, email, password_hash, role, plan_id → plans.id, created_at)

-- Usage metrics (cumulative + daily activity tracking)
usage_logs (id, user_id → users.id, metric_type, value, recorded_date)
```

**Seed Data:** Three default plans are created on initialization:

| Plan         | Price    |
| ------------ | -------- |
| Free         | $0.00    |
| Pro          | $29.99   |
| Enterprise   | $99.99   |

---

## 🔄 CI/CD Pipeline (Jenkins)

The `Jenkinsfile` defines a 7-stage declarative pipeline:

![Jenkins Pipeline](photo/2.png)

| Stage                    | Description                                                          |
| ------------------------ | -------------------------------------------------------------------- |
| **Checkout**             | Pull latest code from the repository                                 |
| **Security Check**       | Scan for exposed `.env` files or sensitive credentials               |
| **Docker Build**         | Build frontend and backend Docker images                             |
| **Health Test**          | Spin up containers, wait for `/health` to return `200 OK`            |
| **Push to Docker Hub**   | Tag and push images to Docker Hub (`rajbirari9737/*`)                |
| **Deploy to Kubernetes** | Apply K8s manifests and verify rollout status                        |
| **Deploy & Prune**       | Clean up dangling Docker images                                      |

### Jenkins Setup

1. Install Jenkins with Docker Pipeline and Credentials plugins
2. Add Docker Hub credentials with ID `dockerhubcreadentials`
3. Create a new Pipeline job and paste the `Jenkinsfile` content
4. Run the build

---

## ☸️ Kubernetes Deployment

The `k8s/` directory contains production-ready manifests:

```bash
# Set context to local cluster
kubectl config use-context docker-desktop

# Deploy all resources
kubectl apply -f k8s/

# Verify deployments
kubectl rollout status deployment/backend -n subscription-man
kubectl rollout status deployment/frontend -n subscription-man

# Check running pods
kubectl get pods -n subscription-man
```

### K8s Resources

| Manifest              | Resource                                        |
| --------------------- | ----------------------------------------------- |
| `namespace.yaml`      | `subscription-man` namespace                    |
| `secrets.yaml`        | DB credentials & JWT secret                     |
| `db.yaml`             | PostgreSQL StatefulSet + PersistentVolumeClaim   |
| `init-configmap.yaml` | Database init SQL as ConfigMap                   |
| `backend.yaml`        | Backend Deployment + ClusterIP Service           |
| `frontend.yaml`       | Frontend Deployment + NodePort Service           |

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable       | Description                       | Default                                              |
| -------------- | --------------------------------- | ---------------------------------------------------- |
| `DATABASE_URL`  | PostgreSQL connection string     | `postgresql://postgres:postgres@db:5432/subscription_analytics` |
| `JWT_SECRET`    | Secret key for JWT signing       | *(required)*                                         |
| `PORT`          | Server port                      | `5000`                                               |

> ⚠️ **Never commit `.env` files to version control.** The `.gitignore` and `.dockerignore` files are configured to exclude them.

---

## 📸 Screenshots

### Dashboard View
![Dashboard](photo/1.png)
*Real-time usage analytics with 7-day trend charts for API calls and storage*

### Jenkins CI/CD Pipeline
![Jenkins Pipeline](photo/2.png)
*Automated build, test, push, and deploy pipeline with stage-level visibility*

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ as part of the <strong>15 Projects in 30 Days</strong> challenge — Project #4
</p>
