# ☕ CafeFinder Davao

CafeFinder Davao is a high-performance, mobile-first web application dedicated to discovering the vibrant coffee scene in Davao City. It serves as a community-driven directory where enthusiasts can explore, rate, and contribute to a curated list of local specialty coffee shops.

---

## 🏗️ Architecture & Design Philosophy

CafeFinder is built on a modern **Full-Stack (Client/Server)** architecture designed for responsiveness and reliability.

- **Community-First**: Beyond a simple directory, users can submit new cafes, share reviews, and claim ownership of their business.
- **Mobile-First UX**: Optimized for the on-the-go coffee explorer, with smooth transitions and touch-friendly interfaces.
- **Relational Data**: Powered by **PostgreSQL** and **Prisma ORM**, ensuring data integrity for complex relationships (Cafes, Reviews, Submissions, Claims).
- **Secure by Design**: Integrated with a custom **HTTP-only cookie session authentication** system for robust user management and role-based access control.

---

## 🚀 Technology Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS 4.0
- **Animations**: Framer Motion (via `motion/react`)
- **Icons**: Lucide React
- **Maps**: Google Maps JavaScript API
- **State Management**: React Context API & Hooks

### Backend
- **Runtime**: Node.js (Runtime Type-Stripping)
- **Server**: Express.js
- **ORM**: Prisma ORM
- **Database**: PostgreSQL (Cloud SQL)
- **Session Management**: Secure, HTTP-only cookie sessions with database-backed storage.

---

## ✨ Key Features

- **🔍 Advanced Discovery**: Search cafes by name or filter by price range and specific amenities.
- **📍 Interactive Mapping**: Visualize cafe locations on an integrated Google Map with custom markers.
- **🖼️ Rich Cafe Profiles**: Explore specialty coffee shops with high-quality photo galleries and detailed info.
- **⭐ Community Reviews**: Authenticated users can leave ratings, text reviews, and upload photos.
- **📝 Cafe Submissions**: Users can contribute new cafes to the platform via a structured submission wizard.
- **⚖️ Admin Moderation**: A comprehensive dashboard for admins to review and moderate cafe submissions and user reviews.
- **🤝 Owner Claims**: Business owners can request to claim their cafe listing to manage their profile.
- **💖 Favorites**: Save your must-visit spots to a personalized favorites list for quick access.
- **📊 Activity Dashboard**: Track your submissions, claims, and reviews in a unified user dashboard.
- **📜 Audit Logs**: Full administrative visibility into actions taken across the platform.

---

## ⚙️ Installation & Setup Guide

### 1. Prerequisites
- **Node.js** (v20+ recommended)
- **PostgreSQL** instance (or MariaDB if configured)
- **Google Maps API Key**

### 2. Environment Configuration
Create a `.env` file in the root directory and configure the following variables:

```env
# Database
PRISMA_DATABASE_URL="postgresql://user:password@localhost:5432/cafefinder"

# Session Secret
SESSION_SECRET="your-secure-session-secret"

# Maps
VITE_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

### 3. Application Initialization
Execute these commands in your terminal:

```bash
# 1. Install dependencies
npm install

# 2. Synchronize database schema
npm run db:push

# 3. Generate Prisma client
npm run db:generate

# 4. Seed the database with initial amenities and an admin user
npm run db:seed
```

### 4. Running the Application
Start the development server:
```bash
npm run dev
```
Access the application at `http://localhost:3000`.

---

## 📡 API Endpoints

### Public Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/cafes` | List all verified cafes |
| `GET` | `/api/cafes/:slug` | Get detailed cafe profile |
| `GET` | `/api/amenities` | List all available cafe amenities |

### User/Owner Endpoints (Auth Required)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/reviews` | Post a new review |
| `POST` | `/api/cafe-submissions` | Submit a new cafe |
| `POST` | `/api/claims` | Request cafe ownership |
| `GET` | `/api/user/favorites` | Get user's favorite cafes |

### Admin Endpoints (Admin Role Required)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard` | Get administrative stats |
| `GET` | `/api/admin/cafe-submissions` | List cafe submissions for moderation |
| `POST` | `/api/admin/cafe-submissions/:id/approve` | Approve a cafe submission |
| `GET` | `/api/admin/reviews` | List reviews for moderation |
| `GET` | `/api/admin/activity-logs` | View administrative audit logs |

---

## 📂 Project Structure

- `/client/src`: React application, components, and pages.
- `/server/src`: Express server, controllers, services, and routes.
- `/prisma`: Database schema and migration tracking.
- `/uploads`: Storage for user-uploaded photos.

---

## 🛣️ Roadmap
- [x] **Stage 11**: Owner Claim System & Cafe Scraper.
- [x] **Stage 12**: User-Generated Cafe Submissions.
- [x] **Stage 13**: Admin Moderation Dashboard & Audit Logs.
- [ ] **Stage 14**: Real-time Notifications & User Messaging.
