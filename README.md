# 🅿️ Smart Park SaaS

A full-stack multi-tenant smart parking management platform built with React, Node.js, Express, and MySQL.

---

## 🌐 Live Demo

- **Frontend:** [Vercel Deployment](https://smart-park-saas.vercel.app)
- **Backend API:** [Railway Deployment](https://smart-park-saas.up.railway.app/api/health)

---

## 🚀 Features

- **Multi-role system** — Super Admin, Company Admin, Customer
- **Multi-tenant architecture** — each parking company is completely isolated
- **Interactive Leaflet map** — click to create companies, view locations, find parking
- **Live slot management** — CRUD for parking slots with availability tracking
- **Full booking flow** — select slot → book → exit → auto-calculate price → pay
- **Payment gateway simulation** — animated 3-stage flow (Card / UPI / Cash)
- **Revenue & stats dashboards** — per-role analytics with Recharts graphs
- **Dark / Light mode** — persisted across sessions
- **JWT authentication** — secure, token-based sessions (8h expiry)

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | TailwindCSS + shadcn/ui |
| Charts | Recharts |
| Maps | Leaflet + react-leaflet |
| Routing | React Router v6 |
| Backend | Node.js + Express |
| Database | MySQL 8 (mysql2) |
| Auth | JWT (jsonwebtoken) |
| Deployment | Vercel (frontend) + Railway (backend + DB) |

---

## 🗄️ Database Schema

```
companies  → id, name, latitude, longitude, created_at
users      → id, name, email, password, role, tenant_id, company_name
slots      → id, tenant_id, slot_number, floor, type, status, price_per_hour
bookings   → id, tenant_id, user_id, slot_id, vehicle_number, start_time, duration, status, total_amount
payments   → id, tenant_id, booking_id, amount, method, status, created_at
```

---

## 👥 Role-Based Access

| Role | Capabilities |
|------|-------------|
| `super_admin` | Create / edit / delete companies and admins, see all users, all payments, global stats |
| `company_admin` | Manage slots, view tenant bookings, view tenant payments, tenant stats |
| `customer` | Browse companies on map, book slots, pay, view own history |

---

## 🖥️ Local Development

### Prerequisites
- Node.js 18+
- MySQL 8+

### 1. Clone the repo
```sh
git clone https://github.com/varadharaj0105/smart-park-saas.git
cd smart-park-saas
```

### 2. Install dependencies
```sh
npm install
```

### 3. Set up the database
```sh
# Create and seed the database
mysql -u root -p < backend/schema.sql
```

### 4. Configure environment variables
```sh
cp .env.example .env
```
Edit `.env` with your local MySQL credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=smart_park_saas
JWT_SECRET=any_long_random_string
PORT=5000
```

### 5. Start the backend
```sh
node server.js
```

### 6. Start the frontend (new terminal)
```sh
npm run dev
```

Frontend runs at → **http://localhost:8082**  
Backend runs at  → **http://localhost:5000**

---

## 🔑 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `super@demo.com` | `password` |
| Company Admin | `admin@demo.com` | `password` |
| Customer | `user@demo.com` | `password` |

> ⚠️ **Change these passwords before going to production.**

---

## 🌍 Deployment

See the full guide in [`deployment_guide.md`](./deployment_guide.md) — uses **Railway** (backend + MySQL) and **Vercel** (frontend).

### Environment variables needed

**Backend (Railway)**
```env
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=smart_park_saas
JWT_SECRET=
PORT=5000
FRONTEND_URL=https://your-app.vercel.app
```

**Frontend (Vercel)**
```env
VITE_API_URL=https://your-backend.up.railway.app/api
```

---

## 📁 Project Structure

```
smart-park-saas/
├── backend/
│   ├── middleware/auth.js       # JWT verify + role guard
│   ├── routes/
│   │   ├── auth.js              # /api/auth — login, signup
│   │   ├── user.js              # /api/user — bookings, slots, payments
│   │   ├── admin.js             # /api/admin — slot CRUD, stats
│   │   └── super.js             # /api/super — companies, all users, all payments
│   ├── db.js                    # MySQL pool + connection test
│   └── schema.sql               # Full DB schema + seed data
├── src/
│   ├── components/
│   │   ├── DashboardLayout.tsx  # Sidebar + topbar (role-aware)
│   │   ├── StatCard.tsx         # Metric card component
│   │   └── NotificationProvider.tsx
│   ├── lib/
│   │   ├── api.ts               # All API fetch helpers
│   │   └── auth.ts              # JWT session helpers
│   └── pages/                   # 16 pages (dashboards, booking, map, etc.)
├── server.js                    # Express entry point
├── .env.example                 # Environment variable template
└── vite.config.ts
```

---

## 📝 License

MIT — feel free to use, fork, and build on top of this.
