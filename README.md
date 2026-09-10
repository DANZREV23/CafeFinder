# ☕ CafeFinder

CafeFinder is a production-ready, mobile-first web application designed for discovering local coffee shops. It provides a curated directory where users can explore cafes based on atmosphere, amenities, and specialty coffee types.

---

## 🏗️ Architecture & Core Philosophy

CafeFinder follows a traditional **Full-Stack (Client/Server)** architecture to ensure high performance, security, and scalability.

- **Mobile-First Design**: The UI is crafted with a focus on small-screen usability without compromising the desktop experience.
- **Relational Integrity**: Configured for **MariaDB/MySQL** with **Drizzle ORM** for type-safe, performant queries. (Optimized for local development).
- **Unified Auth**: Integrated with **Firebase Authentication** for secure, multi-role user management.
- **Type Safety**: End-to-end TypeScript implementation ensures data consistency from the database layer to the UI components.

---

## 🚀 Technology Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS (Utility-first)
- **Routing**: React Router
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Auth**: Firebase Client SDK

### Backend
- **Runtime**: Node.js & Express
- **ORM**: Drizzle ORM
- **Security**: Firebase Admin SDK, CORS, Morgan (logging)

### Database
- **Primary**: MariaDB / MySQL

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
│   │   ├── routes/         # API endpoint definitions
│   │   └── middleware/     # Auth and other Express middlewares
├── src/
│   ├── db/                 # Database Layer (Drizzle)
│   │   ├── schema.ts       # Database models
│   │   ├── index.ts        # Database connection
│   │   └── seed.ts         # Demo data populator
│   └── lib/                # Shared utilities (Firebase, etc.)
├── drizzle/                # Drizzle migrations (auto-generated)
├── drizzle.config.ts       # Drizzle configuration
├── .env.example            # Configuration template
└── package.json            # Root configuration & scripts
```

---

## ⚙️ Detailed Setup & Configuration

### 1. Database Provisioning
Ensure you have a MariaDB or MySQL instance running.
```sql
CREATE DATABASE cafefinder;
```

### 2. Environment Configuration
Create a `.env` file or configure your project secrets:
- `DB_HOST`: Database host (e.g., `localhost`)
- `DB_PORT`: Database port (default `3306`)
- `DB_USERNAME`: Database user
- `DB_PASSWORD`: Database password
- `DB_NAME`: `cafefinder`

### 3. Application Initialization
Run the following commands in order:
```bash
# 1. Install all dependencies (Required for drivers and tools)
npm install

# 2. Push the schema to the database (Uses drizzle.config.ts)
npm run db:push
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

### Response Format
Successful requests always return:
```json
{
  "success": true,
  "data": { ... }
}
```

---

## 🛠️ Internal Mechanics

### Auth Middleware
The backend uses a `requireAuth` middleware (`server/src/middleware/auth.ts`) that verifies Firebase ID tokens sent in the `Authorization: Bearer <token>` header.

---

## 🗺️ Roadmap
- **Stage 1 (Current)**: Managed Cloud SQL & Drizzle foundation, API infrastructure, and exploration views.
- **Stage 2**: User Authentication (Firebase), Cafe Ownership Claims, and Photo Uploads.
- **Stage 3**: Advanced Filtering, Map Integrations (Google/Mapbox), and Reviews.
