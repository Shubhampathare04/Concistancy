# Admin Panel - Quick Start

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Backend running on port 8000
- MySQL database running
- Node.js 18+ installed

---

## Step 1: Database Setup

```bash
cd backend

# Run migration to create admin tables
alembic upgrade head
```

---

## Step 2: Create Admin User

```bash
# Set environment variables
export ADMIN_EMAIL=admin@consistency.com
export ADMIN_PASSWORD=YourSecurePassword123!
export ADMIN_NAME="Super Admin"
export ADMIN_ROLE=super_admin

# Create admin user
python create_admin.py
```

**Output:**
```
✅ Admin user created successfully!
   ID: 1
   Email: admin@consistency.com
   Name: Super Admin
   Role: super_admin

🔐 Keep your credentials secure!
```

---

## Step 3: Start Backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Verify at: http://localhost:8000/docs

---

## Step 4: Setup Frontend

```bash
cd admin-panel

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start dev server
npm run dev
```

---

## Step 5: Login

1. Open http://localhost:3000/login
2. Enter your admin credentials
3. Access the dashboard

---

## 📊 Features

### Dashboard
- Total users, DAU, tasks, completion rate
- User growth chart (30 days)
- Streak distribution
- Revenue metrics

### Users Management
- Search users by email/name
- Filter by status (active/banned/inactive)
- Ban/unban users
- View user details
- Pagination

### Analytics
- User growth trends (90 days)
- Task completion analytics
- Engagement metrics
- Interactive charts

### Subscriptions
- View all subscriptions
- Create new subscriptions
- Filter by status
- Update subscription plans

### Payments
- Payment history
- Filter by status
- Revenue tracking

### System Health
- Service status (MySQL, Redis, MongoDB)
- API latency monitoring
- System metrics

---

## 🔐 Admin Roles

### super_admin
- Full access
- Can delete users
- All permissions

### admin
- User management
- Subscription management
- Analytics access
- Cannot delete users

### analyst
- Read-only access
- View analytics
- View users/tasks/subscriptions
- Cannot modify data

---

## 🛠️ API Endpoints

### Auth
```
POST /api/v1/admin/login
GET  /api/v1/admin/me
```

### Users
```
GET    /api/v1/admin/users
GET    /api/v1/admin/users/{id}
PATCH  /api/v1/admin/users/{id}
POST   /api/v1/admin/users/{id}/ban
POST   /api/v1/admin/users/{id}/unban
DELETE /api/v1/admin/users/{id}
```

### Analytics
```
GET /api/v1/admin/analytics/overview
GET /api/v1/admin/analytics/users?days=30
GET /api/v1/admin/analytics/tasks
GET /api/v1/admin/analytics/streaks
```

### Subscriptions
```
GET   /api/v1/admin/subscriptions
POST  /api/v1/admin/subscriptions
PATCH /api/v1/admin/subscriptions/{id}
```

### Payments
```
GET /api/v1/admin/payments
```

### System
```
GET /api/v1/admin/system/health
GET /api/v1/admin/system/metrics
```

---

## 🔧 Configuration

### Backend (.env)
```bash
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/consistency_db
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
REDIS_URL=redis://localhost:6379/0
CORS_ORIGINS=["http://localhost:3000"]
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:8000/api/v1
```

---

## 📝 Common Tasks

### Create Additional Admin
```bash
export ADMIN_EMAIL=analyst@consistency.com
export ADMIN_PASSWORD=SecurePass123!
export ADMIN_ROLE=analyst
python create_admin.py
```

### Ban a User
1. Go to Users page
2. Search for user
3. Click "Ban" button
4. Enter reason
5. Confirm

### View Analytics
1. Go to Analytics page
2. View user growth chart
3. Check task completion metrics
4. Analyze streak distribution

### Create Subscription
1. Go to Subscriptions page
2. Click "Create Subscription"
3. Enter user ID
4. Select plan (free/pro/elite)
5. Set duration in days
6. Submit

---

## 🐛 Troubleshooting

### Login fails
- Check admin user exists: `SELECT * FROM admin_users;`
- Verify password is correct
- Check JWT_SECRET in .env

### Charts not loading
- Verify backend is running
- Check browser console for errors
- Ensure CORS is configured

### Permission denied
- Check admin role
- Verify JWT token is valid
- Review RBAC rules

### Slow performance
- Add Redis caching
- Optimize database queries
- Check database indexes

---

## 📚 Documentation

- **Full Guide**: See `ADMIN_PANEL_GUIDE.md`
- **TODO List**: See `ADMIN_TODO.md`
- **API Docs**: http://localhost:8000/docs

---

## 🔒 Security

- ✅ JWT authentication
- ✅ Role-based access control
- ✅ Password hashing (bcrypt)
- ✅ Audit logging
- ✅ Input validation
- ⚠️ Use HTTPS in production
- ⚠️ Rotate JWT secrets regularly
- ⚠️ Enable rate limiting

---

## 📊 Tech Stack

**Backend:**
- FastAPI
- SQLAlchemy
- MySQL
- Redis
- JWT

**Frontend:**
- React 18
- TypeScript
- Vite
- TanStack Query
- Recharts
- Axios

---

## 🚀 Production Deployment

### Backend
```bash
# Build
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start with Gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Frontend
```bash
# Build
npm run build

# Serve with Nginx/Apache
# dist/ folder contains production build
```

---

## 📞 Support

Questions? Check:
1. `ADMIN_PANEL_GUIDE.md` - Comprehensive guide
2. `ADMIN_TODO.md` - Implementation checklist
3. API docs at `/docs`

---

## ✨ Next Steps

1. ✅ Create admin user
2. ✅ Login to admin panel
3. ✅ Explore dashboard
4. ✅ Test user management
5. ✅ Review analytics
6. 📝 Customize as needed
7. 🚀 Deploy to production

---

**Built with ❤️ for Consistency App**
