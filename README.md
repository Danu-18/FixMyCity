# FixMyCity — Smart Community Complaint & Civic Issue Resolution Platform

> **Academic Project Implementation**  
> Based on the *Interim Research Report* and *Project Proposal* by **Danial Arif** (Student ID: 202539).

FixMyCity is a modern digital civic governance platform designed to eliminate the inefficiencies of traditional civic reporting in metropolitan municipalities. It replaces unmonitored hotlines, manual paperwork, and fragmented social media complaints with automated, transparent, state-machine driven complaint routing, geospatial intelligence, and strict Service Level Agreement (SLA) turnaround monitoring.

---

## 🌟 Key Features

1. **Automated State-Machine Routing**
   - Directs complaints immediately to the responsible municipal department (Roads, Water & Sanitation, Electricity, Waste Management, Public Safety) based on problem category.
   - Enforces valid lifecycle status progressions: `Pending` ➔ `In Progress` ➔ `Resolved` / `Rejected`.

2. **Geospatial Incident Mapping & Issue Density Heatmap**
   - Real-time city-wide interactive map powered by Leaflet.js and OpenStreetMap.
   - Dynamic issue density heatmap visualizing civic incident hotspots for municipal resource allocation.
   - Interactive coordinate picker allowing residents to pinpoint exact problem locations.

3. **Service Level Agreement (SLA) Turnaround Monitoring**
   - Department- and category-specific SLA resolution deadlines (e.g. 12h for Live Wire / Missing Manhole, 24h for Water Main Leakage).
   - Automated background monitoring command (`php artisan sla:check`) flags overdue tickets and generates urgent notifications for authority officers.

4. **Community Upvoting & Civic Priority Escalation**
   - Citizens can upvote unresolved neighborhood issues to prioritize municipal response.
   - Complaint priority dynamically elevates as community endorsement increases.

5. **Complete Audit Trail & Public Transparency**
   - Every status transition is permanently recorded in `status_history` with the officer's identity, timestamps, official remarks, and repair proof photos.
   - Public tracking via unique tracking numbers (e.g. `FMC-2026-1001`) with zero login requirement.

6. **Role-Based Access Control (RBAC)**
   - **Citizen**: Submit complaints, track incidents, upvote issues, view personalized report history.
   - **Department Authority**: Department-scoped dashboard, queue management, status updating, work note logging, and repair photo uploads.
   - **Administrator**: City-wide cross-department oversight, SLA compliance triggers, real-time resolution metrics.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React |
| **Geospatial** | Leaflet.js, OpenStreetMap tiles, Leaflet Heatmap Layer |
| **Backend** | Laravel 12 (PHP 8.2), REST API, Eloquent ORM |
| **Authentication** | Laravel Sanctum token-based authentication with RBAC middleware |
| **Database** | MySQL (`fixmycity` on port 3306) via Eloquent ORM migrations |
| **Testing** | PHPUnit / Laravel Feature Tests (120 assertions passing) |

---

## 🚀 Quick Start Guide

### Prerequisites
- **PHP** 8.2+ with SQLite and cURL extensions
- **Composer** 2.x
- **Node.js** 18+ and **npm**

---

### 1. Backend Setup

```bash
cd d:\FixMyCity\backend

# 1. Install PHP dependencies
composer install

# 2. Setup environment configuration
cp .env.example .env
php artisan key:generate

# 3. Run database migrations and seed realistic municipal data
php artisan migrate:fresh --seed

# 4. Link public storage for complaint photo attachments
php artisan storage:link

# 5. Start the backend REST API (runs on port 8000)
php artisan serve --port=8000
```

> **API Base URL:** `http://127.0.0.1:8000/api`

---

### 2. Frontend Setup

```bash
cd d:\FixMyCity\frontend

# 1. Install Node dependencies
npm install

# 2. Configure environment variables (.env.local)
# NEXT_PUBLIC_API_URL=http://localhost:8000/api

# 3. Start the Next.js development server
npm run dev
```

> **Frontend Application URL:** `http://localhost:3000`

---

## 🔑 Demo Accounts (Pre-Seeded)

The database includes pre-configured demo accounts for all roles with 1-click switcher buttons on the `/login` page:

| Role | Email | Password | Department Scope |
|---|---|---|---|
| **Citizen** | `citizen@fixmycity.org` | `password123` | Public Resident |
| **Roads Authority** | `roads@fixmycity.org` | `password123` | Infrastructure & Road Maintenance |
| **Water Authority** | `water@fixmycity.org` | `password123` | Water & Sanitation |
| **Admin** | `admin@fixmycity.org` | `password123` | Central Administration (Full Access) |

---

## 🧪 Testing & SLA Check Execution

### Run Automated Backend Tests:
```bash
cd d:\FixMyCity\backend
php artisan test
```
*Executes `tests/Feature/FixMyCityApiTest.php` covering authentication, category auto-routing, state transitions, upvoting, and heatmap data with 120 passing assertions.*

### Run SLA Deadline Background Audit:
```bash
cd d:\FixMyCity\backend
php artisan sla:check
```
*Scans active complaints, updates `is_overdue` flags, and creates high-priority alerts for breached SLA targets.*

---

## 📁 Repository Structure

```text
/FixMyCity
  ├── AI-context.md                             # Architectural map & system reference
  ├── README.md                                 # Project documentation & run guide
  ├── 202539_Danial_Arif_Project_Proposal...    # Academic Project Proposal
  ├── 202539_Danial_Arif_Interim_Research...    # Academic Interim Research Report
  │
  ├── backend/                                  # Laravel 12 API Application
  │   ├── app/
  │   │   ├── Console/Commands/CheckSlaDeadlines.php
  │   │   ├── Http/Controllers/Api/             # 7 API Controllers
  │   │   ├── Models/                           # 7 Eloquent Models
  │   │   └── Services/                         # Routing & SLA Services
  │   ├── database/migrations/                  # Clean database schema
  │   ├── database/seeders/DatabaseSeeder.php   # Realistic municipal seed data
  │   └── tests/Feature/FixMyCityApiTest.php    # Automated API tests
  │
  └── frontend/                                 # Next.js 16 App Router Application
      ├── app/                                  # 11 App routes (explore, report, track, dashboard, etc.)
      ├── components/                           # LeafletMap, ComplaintCard, Badges, Modals
      ├── context/AuthContext.tsx               # Session & notification state
      └── lib/                                  # API client & TypeScript interfaces
```
