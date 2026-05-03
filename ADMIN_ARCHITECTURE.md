# Admin Panel - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ADMIN PANEL SYSTEM                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Login     │  │  Dashboard  │  │    Users    │             │
│  │    Page     │  │    Page     │  │    Page     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Analytics  │  │Subscriptions│  │  Payments   │             │
│  │    Page     │  │    Page     │  │    Page     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                   │
│  ┌─────────────┐                                                 │
│  │   System    │                                                 │
│  │    Page     │                                                 │
│  └─────────────┘                                                 │
│                                                                   │
│  React 18 + TypeScript + Vite + TanStack Query + Recharts       │
│                                                                   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             │ HTTP/REST
                             │ JWT Token
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                         API GATEWAY                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              FastAPI Main Application                       │ │
│  │  - CORS Middleware                                          │ │
│  │  - Rate Limiting                                            │ │
│  │  - Request Logging                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                      AUTHENTICATION LAYER                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐              │
│  │  JWT Validation  │────────▶│  RBAC Middleware │              │
│  │  - Token decode  │         │  - super_admin   │              │
│  │  - Expiry check  │         │  - admin         │              │
│  │  - Admin verify  │         │  - analyst       │              │
│  └──────────────────┘         └──────────────────┘              │
│                                                                   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                         ROUTER LAYER                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  /api/v1/admin/                                                   │
│  ├── /login                    (Auth)                            │
│  ├── /me                       (Auth)                            │
│  ├── /users                    (User Management)                 │
│  ├── /analytics                (Analytics)                       │
│  ├── /subscriptions            (Subscriptions)                   │
│  ├── /payments                 (Payments)                        │
│  ├── /tasks                    (Tasks)                           │
│  ├── /activity-logs            (Activity)                        │
│  └── /system                   (System Health)                   │
│                                                                   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                        SERVICE LAYER                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              AdminService                                 │   │
│  │  - authenticate_admin()                                   │   │
│  │  - create_admin_token()                                   │   │
│  │  - log_admin_action()                                     │   │
│  │  - get_users()                                            │   │
│  │  - ban_user() / unban_user()                              │   │
│  │  - get_analytics_overview()                               │   │
│  │  - get_user_growth()                                      │   │
│  │  - get_subscriptions()                                    │   │
│  │  - get_payments()                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                      REPOSITORY LAYER                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            AdminRepository                                │   │
│  │  - get_admin_by_email()                                   │   │
│  │  - create_audit_log()                                     │   │
│  │  - get_users_paginated()                                  │   │
│  │  - ban_user() / unban_user()                              │   │
│  │  - get_analytics_overview()                               │   │
│  │  - get_user_growth()                                      │   │
│  │  - get_task_analytics()                                   │   │
│  │  - get_subscriptions_paginated()                          │   │
│  │  - get_payments_paginated()                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                         DATA LAYER                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │    MySQL     │  │    Redis     │  │   MongoDB    │           │
│  │              │  │              │  │              │           │
│  │ - admin_users│  │ - Analytics  │  │ - Logs       │           │
│  │ - audit_logs │  │   cache      │  │ - Events     │           │
│  │ - payments   │  │ - Session    │  │              │           │
│  │ - users      │  │   data       │  │              │           │
│  │ - tasks      │  │              │  │              │           │
│  │ - subs       │  │              │  │              │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Admin Login Flow

```
┌──────────┐
│  Admin   │
│  User    │
└────┬─────┘
     │
     │ 1. POST /admin/login
     │    { email, password }
     ▼
┌────────────────┐
│  API Gateway   │
└────┬───────────┘
     │
     │ 2. Validate credentials
     ▼
┌────────────────┐
│ AdminService   │
│ - Verify email │
│ - Check bcrypt │
└────┬───────────┘
     │
     │ 3. Query admin_users
     ▼
┌────────────────┐
│    MySQL       │
└────┬───────────┘
     │
     │ 4. Admin found
     ▼
┌────────────────┐
│ AdminService   │
│ - Create JWT   │
│ - Log action   │
└────┬───────────┘
     │
     │ 5. Return token
     ▼
┌────────────────┐
│  Frontend      │
│ - Store token  │
│ - Redirect     │
└────────────────┘
```

---

### 2. User Ban Flow

```
┌──────────┐
│  Admin   │
│  Panel   │
└────┬─────┘
     │
     │ 1. POST /admin/users/{id}/ban
     │    { reason: "spam" }
     │    Authorization: Bearer <token>
     ▼
┌────────────────┐
│  API Gateway   │
└────┬───────────┘
     │
     │ 2. Validate JWT
     ▼
┌────────────────┐
│ Auth Middleware│
│ - Decode token │
│ - Check role   │
└────┬───────────┘
     │
     │ 3. Check permission
     │    (admin or super_admin)
     ▼
┌────────────────┐
│ RBAC Middleware│
└────┬───────────┘
     │
     │ 4. Execute ban
     ▼
┌────────────────┐
│ AdminService   │
│ - Ban user     │
│ - Log action   │
└────┬───────────┘
     │
     │ 5. Update database
     ▼
┌────────────────┐
│    MySQL       │
│ UPDATE users   │
│ SET banned_at  │
│ INSERT audit   │
└────┬───────────┘
     │
     │ 6. Success response
     ▼
┌────────────────┐
│  Frontend      │
│ - Show success │
│ - Refresh list │
└────────────────┘
```

---

### 3. Analytics Query Flow

```
┌──────────┐
│  Admin   │
│  Panel   │
└────┬─────┘
     │
     │ 1. GET /admin/analytics/overview
     ▼
┌────────────────┐
│  API Gateway   │
└────┬───────────┘
     │
     │ 2. Check cache
     ▼
┌────────────────┐
│     Redis      │
│ analytics:     │
│ overview       │
└────┬───────────┘
     │
     │ 3. Cache miss
     ▼
┌────────────────┐
│AdminRepository │
│ - Aggregate    │
│   queries      │
└────┬───────────┘
     │
     │ 4. Execute queries
     ▼
┌────────────────┐
│    MySQL       │
│ - COUNT users  │
│ - AVG streak   │
│ - SUM revenue  │
└────┬───────────┘
     │
     │ 5. Compute metrics
     ▼
┌────────────────┐
│ AdminService   │
│ - Format data  │
│ - Cache result │
└────┬───────────┘
     │
     │ 6. Return JSON
     ▼
┌────────────────┐
│  Frontend      │
│ - Render KPIs  │
│ - Draw charts  │
└────────────────┘
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                           │
└─────────────────────────────────────────────────────────────┘

Layer 1: Network Security
┌──────────────────────────────────────────────────────────────┐
│  - HTTPS/TLS encryption                                       │
│  - CORS policy                                                │
│  - Rate limiting                                              │
└──────────────────────────────────────────────────────────────┘
                             │
                             ▼
Layer 2: Authentication
┌──────────────────────────────────────────────────────────────┐
│  - JWT token validation                                       │
│  - Token expiry check                                         │
│  - Admin user verification                                    │
└──────────────────────────────────────────────────────────────┘
                             │
                             ▼
Layer 3: Authorization
┌──────────────────────────────────────────────────────────────┐
│  - Role-based access control (RBAC)                           │
│  - Permission checking                                        │
│  - Resource-level authorization                               │
└──────────────────────────────────────────────────────────────┘
                             │
                             ▼
Layer 4: Input Validation
┌──────────────────────────────────────────────────────────────┐
│  - Pydantic schema validation                                 │
│  - Type checking                                              │
│  - SQL injection prevention                                   │
└──────────────────────────────────────────────────────────────┘
                             │
                             ▼
Layer 5: Audit & Monitoring
┌──────────────────────────────────────────────────────────────┐
│  - Action logging                                             │
│  - IP tracking                                                │
│  - Anomaly detection (future)                                 │
└──────────────────────────────────────────────────────────────┘
```

---

## Database Schema Relationships

```
┌─────────────────┐
│  admin_users    │
│─────────────────│
│ id (PK)         │◄──────────┐
│ email           │           │
│ password_hash   │           │
│ role            │           │
│ is_active       │           │
└─────────────────┘           │
                              │
                              │ FK: admin_id
                              │
                    ┌─────────┴──────┐
                    │  audit_logs    │
                    │────────────────│
                    │ id (PK)        │
                    │ admin_id (FK)  │
                    │ action         │
                    │ entity_type    │
                    │ entity_id      │
                    │ metadata       │
                    └────────────────┘

┌─────────────────┐
│     users       │
│─────────────────│
│ id (PK)         │◄──────────┬──────────┬──────────┐
│ email           │           │          │          │
│ banned_at       │           │          │          │
│ ban_reason      │           │          │          │
└─────────────────┘           │          │          │
                              │          │          │
                    ┌─────────┴──────┐  │          │
                    │ subscriptions  │  │          │
                    │────────────────│  │          │
                    │ id (PK)        │  │          │
                    │ user_id (FK)   │  │          │
                    │ plan           │  │          │
                    │ status         │  │          │
                    │ expires_at     │  │          │
                    └────────┬───────┘  │          │
                             │          │          │
                             │ FK       │          │
                             │          │          │
                    ┌────────▼──────┐   │          │
                    │   payments    │   │          │
                    │───────────────│   │          │
                    │ id (PK)       │   │          │
                    │ user_id (FK)  │───┘          │
                    │ sub_id (FK)   │              │
                    │ amount        │              │
                    │ status        │              │
                    └───────────────┘              │
                                                   │
                                         ┌─────────┴──────┐
                                         │     tasks      │
                                         │────────────────│
                                         │ id (PK)        │
                                         │ user_id (FK)   │
                                         │ title          │
                                         │ difficulty     │
                                         └────────────────┘
```

---

## Component Hierarchy (Frontend)

```
App
│
├── BrowserRouter
│   │
│   ├── Route: /login
│   │   └── Login
│   │
│   └── Route: /
│       └── Layout
│           ├── Sidebar
│           │   ├── Navigation Links
│           │   └── User Info
│           │
│           └── Outlet
│               │
│               ├── Route: /
│               │   └── Dashboard
│               │       ├── KPI Cards
│               │       ├── User Growth Chart
│               │       └── Streak Distribution
│               │
│               ├── Route: /users
│               │   └── Users
│               │       ├── Search Bar
│               │       ├── Filter Dropdown
│               │       ├── User Table
│               │       └── Pagination
│               │
│               ├── Route: /analytics
│               │   └── Analytics
│               │       ├── Metric Cards
│               │       ├── Growth Chart
│               │       └── Completion Chart
│               │
│               ├── Route: /subscriptions
│               │   └── Subscriptions
│               │       ├── Filter
│               │       ├── Create Button
│               │       ├── Subscription Table
│               │       └── Pagination
│               │
│               ├── Route: /payments
│               │   └── Payments
│               │       ├── Filter
│               │       ├── Payment Table
│               │       └── Pagination
│               │
│               └── Route: /system
│                   └── System
│                       ├── Service Status
│                       └── Metrics Dashboard
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      PRODUCTION SETUP                        │
└─────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │   Cloudflare │
                    │      CDN     │
                    └──────┬───────┘
                           │
                           │ HTTPS
                           │
                    ┌──────▼───────┐
                    │  Load Balancer│
                    │   (Nginx)     │
                    └──────┬───────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
    │  Frontend   │ │  Frontend  │ │  Frontend  │
    │  (Static)   │ │  (Static)  │ │  (Static)  │
    └─────────────┘ └────────────┘ └────────────┘
                           │
                           │ API Calls
                           │
                    ┌──────▼───────┐
                    │  API Gateway │
                    │   (FastAPI)  │
                    └──────┬───────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
    │   MySQL     │ │   Redis    │ │  MongoDB   │
    │  (Primary)  │ │  (Cache)   │ │   (Logs)   │
    └─────────────┘ └────────────┘ └────────────┘
           │
           │ Replication
           │
    ┌──────▼──────┐
    │   MySQL     │
    │  (Replica)  │
    └─────────────┘
```

---

## Technology Stack Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      TECH STACK                              │
└─────────────────────────────────────────────────────────────┘

Frontend
├── React 18.2.0
├── TypeScript 5.3.3
├── Vite 5.0.8
├── TanStack React Query 5.14.2
├── React Router 6.20.0
├── Recharts 2.10.3
├── Axios 1.6.2
└── date-fns 3.0.0

Backend
├── FastAPI 0.111.0
├── Uvicorn 0.29.0
├── SQLAlchemy 2.0.30
├── Alembic 1.13.1
├── PyMySQL 1.1.1
├── Redis 5.0.4
├── Motor 3.3.2 (MongoDB)
├── python-jose 3.3.0 (JWT)
├── passlib 1.7.4 (bcrypt)
└── Pydantic 2.7.1

Database
├── MySQL 8.0
├── Redis 7
└── MongoDB Atlas

DevOps
├── Docker
├── Docker Compose
├── Alembic (migrations)
└── Git
```

---

This architecture is designed for:
- ✅ Scalability (millions of users)
- ✅ Security (multiple layers)
- ✅ Performance (caching, indexing)
- ✅ Maintainability (clean architecture)
- ✅ Observability (logging, monitoring)
