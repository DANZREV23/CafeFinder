# ☕ CafeFinder Davao

CafeFinder Davao is a high-performance, mobile-first web application dedicated to discovering the vibrant coffee scene in Davao City. It serves as a community-driven directory where enthusiasts can explore, rate, and contribute to a curated list of local specialty coffee shops.

---

## 🏗️ Architecture & Design Philosophy

CafeFinder is built on a modern **Full-Stack (Client/Server)** architecture designed for responsiveness and reliability.

- **Community-First**: Beyond a simple directory, users can submit new cafes, share reviews, and claim ownership of their business.
- **Mobile-First UX**: Optimized for the on-the-go coffee explorer, with smooth transitions and touch-friendly interfaces.
- **Relational Data**: Powered by **PostgreSQL** and **Prisma ORM**, ensuring data integrity for complex relationships (Cafes, Reviews, Submissions, Claims).
- **Secure by Design**: Integrated with **Firebase Authentication** and **Firebase Admin SDK** for robust user management and role-based access control.

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
- **File Handling**: Multer (Local storage with Cloud compatibility)

---

## ✨ Key Features

- **🔍 Advanced Discovery**: Search cafes by name or filter by price range and specific amenities (e.g., "Good for working", "Outdoor seating").
- **📍 Interactive Mapping**: Visualize cafe locations on an integrated Google Map with custom markers and info windows.
- **🖼️ Rich Cafe Profiles**: Explore specialty coffee shops with high-quality photo galleries, detailed descriptions, and operating info.
- **⭐ Community Reviews**: Authenticated users can leave detailed ratings, text reviews, and upload photos of their experience.
- **📝 Cafe Submissions**: Share new gems with the community via a structured, multi-step submission wizard.
- **🤝 Owner Claims**: Business owners can request to claim their cafe listing to manage their profile and interact with reviews.
- **💖 Favorites**: Save your must-visit spots to a personalized favorites list for quick access.
- **📊 Activity Dashboard**: Track your submissions, claims, and reviews in a unified user dashboard.

---

## ⚙️ Installation & Setup Guide

### 1. Prerequisites
- **Node.js** (v20+ recommended)
- **PostgreSQL** instance
- **Firebase Project** (for Authentication)
- **Google Maps API Key**

### 2. Environment Configuration
Create a `.env` file in the root directory and configure the following variables:

```env
# Database
PRISMA_DATABASE_URL="postgresql://user:password@localhost:5432/cafefinder"

# Firebase (Client-side)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Firebase (Server-side)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Maps
VITE_GOOGLE_MAPS_API_KEY=
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

# 4. (Optional) Seed the database with initial amenities
npm run db:seed

# 5. (Optional) Run the cafe scraper for Davao cafes
npm run scrape:cafes
```

### 4. Running the Application
Start the development server (Express + Vite):
```bash
npm run dev
```
Access the application at `http://localhost:3000`.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/cafes` | List all verified cafes |
| `GET` | `/api/cafes/:slug` | Get detailed cafe profile |
| `POST` | `/api/reviews` | Post a new review (Auth required) |
| `POST` | `/api/cafe-submissions` | Submit a new cafe (Auth required) |
| `GET` | `/api/amenities` | List all available cafe amenities |
| `POST` | `/api/claims` | Request cafe ownership (Auth required) |

---

## 📂 Project Structure

- `/client/src`: React application, components, and pages.
- `/server/src`: Express server, controllers, and routes.
- `/prisma`: Database schema and migration tracking.
- `/uploads`: Storage for user-uploaded photos (reviews and submissions).

---

## 🛣️ Roadmap
- [x] **Stage 11**: Owner Claim System & Cafe Scraper.
- [x] **Stage 12**: User-Generated Cafe Submissions.
- [ ] **Stage 13**: Admin Moderation Dashboard (In Progress).
- [ ] **Stage 14**: Real-time Notifications & User Messaging.
