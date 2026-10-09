# AI-Context: FixMyCity (Smart Community Complaint and Civic Issue Resolution Platform)

## 1. Project Overview
FixMyCity is a modern digital civic complaint management platform designed to replace fragmented, untracked complaint methods (manual office visits, telephone hotlines, social media posts) in Pakistani urban centers.

Citizens register civic complaints with photo evidence, descriptions, and geo-coordinates. The backend state-machine routing engine automatically validates the problem category, maps it to the responsible municipal department (e.g., Road Maintenance, Water & Sanitation, Electricity, Waste Management, Public Safety), calculates and applies a Service Level Agreement (SLA) turnaround deadline, and logs status transitions. A city-wide geospatial heatmap visualizes problem concentrations for municipal resource allocation.

### Target Users & Roles
- **Citizen (`citizen`)**: Submits geo-tagged complaints, tracks real-time progress via tracking numbers (e.g. `FMC-2026-XXXX`), upvotes urgent community issues, receives in-app and email status notifications.
- **Authority Staff (`authority`)**: Department-scoped officers who view assigned incident queues, transition status (`Pending` -> `In Progress` -> `Resolved` / `Rejected`), log work notes, attach proof of repair, and monitor SLA deadlines.
- **Super Administrator (`admin`)**: Municipal directorate level with city-wide visibility, department performance KPIs, SLA audit execution, and category routing configuration.

---

## 2. Technology Stack
- **Frontend Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, Lucide React icons
- **Geospatial & Mapping**: Leaflet.js, OpenStreetMap tiles, custom weighted density heatmap engine & coordinate picker
- **Backend Framework**: Laravel 12 (PHP 8.2) REST API
- **Database**: MySQL (Database: `fixmycity` on 127.0.0.1:3306) via Eloquent ORM migrations
- **Authentication**: Laravel Sanctum token-based authentication with Role-Based Access Control (RBAC) middleware
- **Architecture**: Decoupled Client-Server REST architecture with CORS enabled

---

## 3. Project Structure

```text
/FixMyCity
  ├── AI-context.md                             # Architectural map & system guide for AI agents
  │
  ├── backend/                                  # Laravel 12 API Application
  │   ├── app/
  │   │   ├── Console/Commands/
  │   │   │   └── CheckSlaDeadlines.php         # Artisan command: php artisan sla:check
  │   │   ├── Http/
  │   │   │   ├── Controllers/Api/
  │   │   │   │   ├── AuthController.php        # Register, Login, Me, Logout
  │   │   │   │   ├── ComplaintController.php   # CRUD, Routing, Status Update, Upvoting
  │   │   │   │   ├── DepartmentController.php  # Department statistics and CRUD
  │   │   │   │   ├── CategoryController.php    # Category mapping definitions
  │   │   │   │   ├── HeatmapController.php     # Weighted geospatial points for Leaflet
  │   │   │   │   ├── AnalyticsController.php   # City-wide & department KPIs
  │   │   │   │   └── NotificationController.php# User in-app notifications
  │   │   │   └── Middleware/
  │   │   │       └── RoleMiddleware.php        # RBAC route protection ('citizen','authority','admin')
  │   │   ├── Models/
  │   │   │   ├── User.php                      # Sanctum tokens, role helpers, department relationship
  │   │   │   ├── Department.php                # Municipal authority records and default SLA hours
  │   │   │   ├── Category.php                  # Issue categories with department foreign keys
  │   │   │   ├── Complaint.php                 # Core complaint entity with SLA status & accessors
  │   │   │   ├── StatusHistory.php             # State machine audit trail
  │   │   │   ├── Upvote.php                    # Community voting record (unique [complaint, user])
  │   │   │   └── Notification.php              # Real-time alert records
  │   │   └── Services/
  │   │       ├── ComplaintRoutingEngine.php   # Automated category-to-department state-machine
  │   │       └── SlaMonitoringService.php      # Audit background engine for overdue & warning alerts
  │   ├── database/
  │   │   ├── migrations/                       # Clean schema migrations for all tables
  │   │   └── seeders/DatabaseSeeder.php        # Realistic Pakistani municipal data (Karachi/Lahore)
  │   ├── routes/
  │   │   └── api.php                           # 22 REST API endpoints
  │   └── tests/Feature/FixMyCityApiTest.php    # Automated feature test suite (120 assertions)
  │
  └── frontend/                                 # Next.js App Router Application
      ├── app/
      │   ├── layout.tsx                        # Global shell with AuthProvider, Navbar, Footer
      │   ├── page.tsx                          # Landing page with stats, problem/solution, live feed
      │   ├── explore/page.tsx                  # Interactive map & city-wide heatmap density dashboard
      │   ├── report/page.tsx                   # Guided complaint submission with Leaflet GPS picker
      │   ├── complaints/page.tsx               # Public searchable & filterable complaints directory
      │   ├── complaints/[id]/page.tsx          # Complaint detail, SLA clock, status timeline & officer action box
      │   ├── track/page.tsx                    # Quick tracking lookup by tracking number (e.g. FMC-2026-1001)
      │   ├── dashboard/page.tsx                # Role-aware portal (Citizen, Authority, Admin)
      │   ├── login/page.tsx                    # Auth login with 1-click Demo quick-switch buttons
      │   └── register/page.tsx                 # Resident & Municipal Staff registration
      ├── components/
      │   ├── Navbar.tsx                        # Responsive navigation with notifications drawer
      │   ├── Footer.tsx                        # Academic attribution & municipal directory
      │   ├── LeafletMap.tsx                    # Dynamic client-side Leaflet (Heatmap, Markers, Picker)
      │   ├── ComplaintCard.tsx                 # Interactive card with live upvoting
      │   ├── StatusBadge.tsx                   # Visual status badge (Pending, In Progress, Resolved)
      │   ├── PriorityBadge.tsx                 # Urgency badge (Urgent, High, Medium, Low)
      │   ├── SlaBadge.tsx                      # SLA status & overdue countdown
      │   └── NotificationModal.tsx             # In-app notifications drawer
      ├── context/
      │   └── AuthContext.tsx                   # Global authentication context & token persistence
      └── lib/
          ├── api.ts                            # REST API client
          └── types.ts                          # Full TypeScript interfaces
```

---

## 4. Architecture & Data Flow

```text
[ Citizen / Resident ]
        │  (Fills complaint form: category, text, photo, GPS coordinates)
        ▼
[ Next.js Frontend ]  ── POST /api/complaints ──► [ Laravel REST API ]
                                                          │
                                         [ ComplaintRoutingEngine ]
                                         - Validates Category ID
                                         - Resolves target Department ID
                                         - Calculates SLA Deadline (category_hours * priority_multiplier)
                                         - Generates Unique Tracking ID (FMC-2026-XXXX)
                                                          │
                                         [ Database Layer (MySQL / SQLite) ]
                                         - INSERT INTO complaints (status = 'Pending')
                                         - INSERT INTO status_history (transition log)
                                         - INSERT INTO notifications
                                                          │
                                         [ Feedback Loop ]
                                         - Returns Tracking ID to Citizen
                                         - Visible on Public Heatmap & Directory
                                                          │
[ Municipal Authority Officer ] ◄── In-App & Email Notification
        │
        ├── Inspects Evidence & Coordinates
        └── Updates Status (e.g., 'In Progress' -> 'Resolved') via /api/complaints/{id}/status
                    │
                    ▼
          [ State Machine Engine ]
          - Validates legal transition
          - Logs into status_history with officer user_id & resolution notes
          - If 'Resolved', timestamps resolved_at & stores completion photo
          - Dispatches notification to citizen
```

---

## 5. Database Schema & Tables

1. **`users`**: `id`, `name`, `email`, `password`, `role` ('citizen', 'authority', 'admin'), `department_id` (nullable FK), `phone`, timestamps.
2. **`departments`**: `id`, `department_name`, `contact_email`, `phone`, `description`, `sla_hours`, timestamps.
3. **`categories`**: `id`, `category_name`, `department_id` (FK), `description`, `default_priority`, `sla_hours`, `icon`, timestamps.
4. **`complaints`**: `id`, `tracking_number` (unique), `user_id` (nullable FK), `category_id` (FK), `department_id` (FK), `title`, `description`, `image_path`, `latitude`, `longitude`, `address`, `status` ('Pending', 'In Progress', 'Resolved', 'Rejected'), `priority` ('Low', 'Medium', 'High', 'Urgent'), `sla_deadline`, `resolved_at`, `resolution_notes`, `resolution_image`, timestamps.
5. **`status_history`**: `id`, `complaint_id` (FK), `old_status`, `new_status`, `changed_by` (FK -> users), `notes`, `changed_at`, timestamps.
6. **`upvotes`**: `id`, `complaint_id` (FK), `user_id` (FK), timestamps. Unique constraint: `[complaint_id, user_id]`.
7. **`notifications`**: `id`, `user_id` (FK), `complaint_id` (nullable FK), `title`, `message`, `type`, `is_read`, timestamps.

---

## 6. Key REST API Endpoints

### Public
- `POST /api/auth/register`: Create user account.
- `POST /api/auth/login`: Authenticate and receive Sanctum bearer token.
- `GET /api/departments`: All departments with real-time complaint & staff counts.
- `GET /api/categories`: All categories mapped to departments and SLA hours.
- `GET /api/complaints`: Searchable, filterable (department, category, status, SLA status), sorted, paginated complaints.
- `GET /api/complaints/{idOrTracking}`: Single complaint details with complete `status_history` audit trail.
- `POST /api/complaints`: Submit new complaint (triggers state-machine routing).
- `GET /api/heatmap`: Lightweight weighted points `[lat, lng, intensity, status, priority]` for Leaflet density heatmap.
- `GET /api/analytics/overview`: City-wide metrics (total, pending, resolved, SLA compliance %, average hours).

### Authenticated (`auth:sanctum`)
- `GET /api/auth/me`: Current user details and department affiliation.
- `POST /api/auth/logout`: Revoke token.
- `POST /api/complaints/{id}/upvote`: Toggle upvote on a complaint.
- `GET /api/notifications`: Current user notifications list and unread count.
- `PATCH /api/notifications/{id}/read`: Mark notification as read.
- `PATCH /api/notifications/read-all`: Mark all as read.

### Authority & Admin (`role:authority,admin`)
- `MATCH (PATCH/POST) /api/complaints/{id}/status`: Transition complaint status with notes and resolution photo.

### Admin Only (`role:admin`)
- `POST /api/departments`: Create department.
- `PUT /api/departments/{id}`: Update department parameters.
- `POST /api/categories`: Create category.
- `PUT /api/categories/{id}`: Update category.
- `POST /api/sla/trigger-check`: Trigger real-time SLA deadline audit.

---

## 7. Demo Accounts & Credentials
For testing and evaluator demonstration:
| Role | Email | Password | Details |
|---|---|---|---|
| **Citizen** | `citizen@fixmycity.org` | `password123` | Danial Arif (Can report, upvote, track) |
| **Citizen 2** | `citizen2@fixmycity.org` | `password123` | Ayesha Khan |
| **Road Authority** | `roads@fixmycity.org` | `password123` | Engr. Tariq Mehmood (Roads Dept) |
| **Water Authority** | `water@fixmycity.org` | `password123` | Zubair Ahmed (Water & Sanitation) |
| **Power Authority** | `power@fixmycity.org` | `password123` | Farhan Ali (Electricity & Power) |
| **Waste Authority** | `waste@fixmycity.org` | `password123` | Sadia Qureshi (Waste Management) |
| **Safety Authority**| `safety@fixmycity.org` | `password123` | Inspector Majid Raza (Public Safety) |
| **Administrator**   | `admin@fixmycity.org` | `password123` | Director General Civic Affairs |

---

## 8. Development & Verification Commands

### Backend (`/backend`)
```bash
# Run migrations & seed data
php artisan migrate:fresh --seed

# Run automated tests
php artisan test --filter=FixMyCityApiTest

# Run SLA background audit
php artisan sla:check

# Run backend development server
php artisan serve --port=8000
```

### Frontend (`/frontend`)
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run production build & verify TypeScript
npm run build
```

---

## 9. Current Implementation Status
- [x] Full database schema with migrations and Eloquent relationships.
- [x] Comprehensive Pakistani municipal seed data (departments, categories, users, complaints, upvotes, status history).
- [x] Automated state-machine routing engine (`ComplaintRoutingEngine`).
- [x] SLA monitoring engine & artisan command (`sla:check`).
- [x] Multi-role authentication (RBAC) with Sanctum tokens.
- [x] All 22 backend REST API endpoints fully operational.
- [x] Feature test suite with 100% passing tests and 120 assertions.
- [x] Next.js 16 frontend with Tailwind CSS v4 and full responsiveness.
- [x] Interactive Leaflet.js map with heatmap density visualization and coordinate picker.
- [x] Community upvoting system with live counters and toggle support.
- [x] Public complaints directory with multi-faceted search, filter, and sorting.
- [x] Comprehensive complaint tracking page with visual status stepper and audit trail.
- [x] Quick tracking lookup page for anyone with a tracking ID.
- [x] Role-aware dashboard for Citizens, Authority Officers, and City Administrators.
- [x] In-app notification system with unread badge and dropdown modal.
- [x] Zero placeholders, zero mock APIs — 100% database-backed full-stack implementation.
