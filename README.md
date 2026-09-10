# ☕ CafeFinder

CafeFinder is a production-ready, mobile-first web application designed for discovering local coffee shops. It provides a curated directory where users can explore cafes based on atmosphere, amenities, and specialty coffee types.

---

## 🏗️ Architecture & Core Philosophy

CafeFinder follows a traditional **Full-Stack (Client/Server)** architecture to ensure high performance, security, and scalability.

- **Mobile-First Design**: The UI is crafted with a focus on small-screen usability without compromising the desktop experience.
- **Relational Integrity**: Uses **MariaDB** with a normalized schema to manage complex relationships between cafes, amenities, reviews, and hours.
- **Type Safety**: End-to-end TypeScript implementation ensures data consistency from the database layer to the UI components.
- **Lazy Connectivity**: The application backend is resilient to configuration delays, using lazy initialization for database connections.

---

## 🚀 Technology Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS (Utility-first)
- **Routing**: React Router
- **Icons**: Lucide React
- **Animations**: Framer Motion

### Backend
- **Runtime**: Node.js & Express
- **ORM**: Prisma (using stable v5)
- **Security**: Helmet, CORS, Morgan (logging)
- **Validation**: Zod (planned for Stage 2)

### Database
- **Primary**: MariaDB (connected via the MySQL protocol)

---

## 📂 Project Structure

```text
cafefinder/
├── client/                 # React Frontend (SPA)
│   ├── src/
│   │   ├── components/     # Reusable UI (CafeCard, Navbar, etc.)
│   │   ├── layouts/        # Shared page shells
│   │   ├── pages/          # View components (Home, Explore, Profile)
│   │   ├── services/       # API abstraction layer
│   │   └── types/          # Shared TS interfaces
│   └── index.html          # Frontend entry point
├── server/                 # Express Backend
│   ├── src/
│   │   ├── controllers/    # API request handlers
│   │   ├── lib/            # Shared utilities (Prisma client)
│   │   └── routes/         # API endpoint definitions
├── prisma/                 # Database Layer
│   ├── schema.prisma       # Database models
│   └── seed.ts             # Demo data populator
├── uploads/                # Placeholder for local photo storage
├── .env.example            # Configuration template
└── package.json            # Root configuration & scripts
```

---

## ⚙️ Detailed Setup & Configuration

### 1. Database Provisioning
CafeFinder requires a MariaDB instance.
```sql
CREATE DATABASE cafefinder;
```

### 2. Environment Configuration
Create a `.env` file or configure your project secrets in the AI Studio panel:
- `DATABASE_URL`: `mysql://USER:PASS@HOST:PORT/cafefinder`
- `NODE_ENV`: `development`
- `PORT`: `3000`

> **Note on MariaDB Protocol**: If your provider gives you a `mariadb://` URL, the app automatically normalizes it to `mysql://` for Prisma compatibility.

### 3. Application Initialization
Run the following commands in order:
```bash
# 1. Install all dependencies
npm install

# 2. Generate the Prisma client
npm run prisma:generate

# 3. Apply the database schema
npm run prisma:migrate

# 4. Populate the demo cafes
npm run prisma:seed
```

### 4. Development Workflow
Start the unified dev server (Express + Vite):
```bash
npm run dev
```
The application will be served at `http://localhost:3000`.

---

## 📡 API Endpoints (Current Implementation)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service status check |
| `GET` | `/api/cafes` | Paginated list of active cafes |
| `GET` | `/api/cafes/:slug` | Detailed cafe profile by URL slug |
| `POST` | `/api/cafes` | (Stage 2) Create new cafe |

### Response Format
Successful requests always return:
```json
{
  "success": true,
  "data": { ... }
}
```

---

## 🛠️ Internal Mechanics & Fixes

### Database Resiliency
The backend uses a **Lazy Prisma Initialization** pattern. The server will boot even if the `DATABASE_URL` is missing. A connection error will only be triggered when a route actually requests database access, allowing the server to remain "Up" while configuration is finalized.

### URL Protocol Normalization
In `server/src/lib/prisma.ts`, we handle protocol mismatches. Prisma's `mysql` provider is strict; if a `mariadb://` string is detected, it is silently converted to `mysql://` to ensure the driver functions correctly with standard MariaDB hosts.

---

## 🗺️ Roadmap
- **Stage 1 (Current)**: Core directory foundation, API infrastructure, and exploration views.
- **Stage 2**: User Authentication, Cafe Ownership Claims, and Photo Uploads.
- **Stage 3**: Advanced Filtering, Map Integrations (Google/Mapbox), and Reviews.
