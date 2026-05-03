# Admin Panel - Complete Implementation Guide

## Overview

Production-grade Admin Panel for Consistency App with full system visibility, operational control, business analytics, user management, monetization control, and AI monitoring.

---

## Architecture

### Backend Stack
- **Framework**: FastAPI
- **Database**: MySQL 8.0
- **Cache**: Redis 7
- **Auth**: JWT with role-based access control (RBAC)
- **ORM**: SQLAlchemy 2.0

### Frontend Stack
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: TanStack React Query
- **Routing**: React Router v6
- **Charts**: Recharts
- **HTTP Client**: Axios

---

## Database Schema

### New Tables

#### admin_users
```sql
- id (BIGINT, PK)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- name (VARCHAR)
- role (ENUM: super_admin, admin, analyst)
- is_active (BOOLEAN)
- last_login_at (DATETIME)
- created_at (DATETIME)
- updated_at (DATETIME)
```

#### audit_logs
```sql
- id (BIGINT, PK)
- admin_id (BIGINT, FK -> admin_users.id)
- action (VARCHAR)
- entity_type (VARCHAR)
- entity_id (BIGINT)
- metadata (JSON)
- ip_address (VARCHAR)
- user_agent (VARCHAR)
- created_at (DATETIME)
```

#### payments
```sql
- id (BIGINT, PK)
- user_id (BIGINT, FK -> users.id)
- subscription_id (BIGINT, FK -> subscriptions.id)
- amount (FLOAT)
- currency (VARCHAR)
- status (ENUM: pending, completed, failed, refunded)
- provider (VARCHAR)
- provider_transaction_id (VARCHAR)
- metadata (JSON)
- created_at (DATETIME)
- updated_at (DATETIME)
```

### Modified Tables

#### users (added columns)
```sql
- banned_at (DATETIME)
- ban_reason (TEXT)
```

---

## Backend Setup

### 1. Run Database Migration

```bash
cd backend
alembic upgrade head
```

### 2. Create Admin User

```bash
export ADMIN_EMAIL=admin@consistency.com
export ADMIN_PASSWORD=your_secure_password
export ADMIN_NAME="Super Admin"
export ADMIN_ROLE=super_admin

python create_admin.py
```

**Security Note**: Never hardcode credentials. Always use environment variables.

### 3. Start Backend

```bash
uvicorn app.main:app --reload --port 8000
```

---

## Frontend Setup

### 1. Install Dependencies

```bash
cd admin-panel
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_API_URL=http://localhost:8000/api/v1
```

### 3. Start Development Server

```bash
npm run dev
```

Access at: http://localhost:3000

### 4. Build for Production

```bash
npm run build
```

---

## API Endpoints

### Authentication
```
POST   /api/v1/admin/login
GET    /api/v1/admin/me
```

### User Management
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
GET    /api/v1/admin/analytics/overview
GET    /api/v1/admin/analytics/users?days=30
GET    /api/v1/admin/analytics/tasks
GET    /api/v1/admin/analytics/streaks
```

### Tasks & Activity
```
GET    /api/v1/admin/tasks
GET    /api/v1/admin/activity-logs
```

### Subscriptions
```
GET    /api/v1/admin/subscriptions
POST   /api/v1/admin/subscriptions
PATCH  /api/v1/admin/subscriptions/{id}
```

### Payments
```
GET    /api/v1/admin/payments
```

### System Health
```
GET    /api/v1/admin/system/health
GET    /api/v1/admin/system/metrics
```

---

## Role-Based Access Control (RBAC)

### Roles

1. **super_admin**
   - Full system access
   - Can delete users
   - Can manage all resources

2. **admin**
   - User management (ban/unban/update)
   - Subscription management
   - Analytics access
   - Cannot delete users

3. **analyst**
   - Read-only access
   - View analytics
   - View users, tasks, subscriptions
   - Cannot modify any data

### Implementation

```python
# Require specific roles
@router.get("/users", dependencies=[Depends(require_role("super_admin", "admin", "analyst"))])

# Get current admin
admin: AdminUser = Depends(get_current_admin)
```

---

## Security Features

### 1. JWT Authentication
- Token-based authentication
- Role embedded in token
- Automatic token validation

### 2. Audit Logging
- All admin actions logged
- IP address tracking
- User agent tracking
- Metadata storage

### 3. Password Security
- Bcrypt hashing
- No plaintext storage
- Secure password verification

### 4. Input Validation
- Pydantic schemas
- Type checking
- Pattern validation

### 5. Rate Limiting
- Existing rate limit middleware applies
- Prevents abuse

---

## Analytics Engine

### Metrics Computed

#### User Analytics
- Total users
- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- Monthly Active Users (MAU)
- User growth over time
- Retention rate

#### Task Analytics
- Total tasks
- Active tasks
- Completion rate
- Average difficulty
- Completions by time period

#### Engagement
- Average streak
- Longest streak
- Streak distribution
- Consistency index

#### Revenue
- Total revenue
- Monthly Recurring Revenue (MRR)
- Active subscriptions
- Payment status distribution

### Performance Optimization

1. **Efficient Queries**
   - Indexed columns
   - Optimized joins
   - Aggregation at DB level

2. **Caching Strategy**
   - Redis for analytics
   - 5-minute cache TTL
   - Cache invalidation on updates

3. **Pagination**
   - All list endpoints paginated
   - Default page size: 20
   - Max page size: 100

---

## Frontend Architecture

### Directory Structure

```
admin-panel/
├── src/
│   ├── components/
│   │   └── Layout.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Users.tsx
│   │   ├── Analytics.tsx
│   │   ├── Subscriptions.tsx
│   │   ├── Payments.tsx
│   │   └── System.tsx
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### Key Features

1. **Dashboard**
   - KPI cards
   - User growth chart
   - Streak distribution
   - Revenue metrics

2. **Users Management**
   - Search & filter
   - Ban/unban users
   - View user details
   - Pagination

3. **Analytics**
   - User growth trends
   - Task completion analytics
   - Interactive charts

4. **Subscriptions**
   - View all subscriptions
   - Create new subscriptions
   - Filter by status

5. **Payments**
   - Payment history
   - Filter by status
   - Revenue tracking

6. **System Health**
   - Service status monitoring
   - API latency
   - System metrics

---

## Chart Implementations

### Line Chart (User Growth)
```tsx
<LineChart data={growth}>
  <Line dataKey="new_users" stroke="#3182ce" />
  <Line dataKey="total_users" stroke="#38a169" />
</LineChart>
```

### Pie Chart (Streak Distribution)
```tsx
<PieChart>
  <Pie data={streaks} dataKey="count" nameKey="range" />
</PieChart>
```

### Bar Chart (Task Completions)
```tsx
<BarChart data={completions}>
  <Bar dataKey="value" fill="#3182ce" />
</BarChart>
```

---

## Deployment

### Backend

1. **Environment Variables**
```bash
DATABASE_URL=mysql+pymysql://user:pass@host:3306/db
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_production_secret
REDIS_URL=redis://host:6379/0
```

2. **Run Migrations**
```bash
alembic upgrade head
```

3. **Create Admin**
```bash
python create_admin.py
```

4. **Start Server**
```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Frontend

1. **Build**
```bash
npm run build
```

2. **Serve**
- Use Nginx, Apache, or CDN
- Configure API proxy
- Enable HTTPS

---

## Monitoring & Maintenance

### Health Checks
- `/api/v1/admin/system/health` - Service status
- `/api/v1/admin/system/metrics` - Performance metrics

### Audit Logs
- Review admin actions regularly
- Monitor for suspicious activity
- Export logs for compliance

### Database Maintenance
- Regular backups
- Index optimization
- Query performance monitoring

---

## Advanced Features

### Export Data (Future)
```python
@router.get("/export/users")
def export_users(format: str = "csv"):
    # Generate CSV/Excel export
    pass
```

### Real-time Updates (Future)
```python
# WebSocket for live dashboard updates
@router.websocket("/ws/dashboard")
async def dashboard_ws(websocket: WebSocket):
    pass
```

### Alert System (Future)
```python
# Email/Slack alerts for critical events
def send_alert(event: str, severity: str):
    pass
```

---

## Testing

### Backend Tests
```bash
pytest tests/test_admin.py -v
```

### Frontend Tests
```bash
npm test
```

### Manual Testing Checklist
- [ ] Admin login
- [ ] User search & filter
- [ ] Ban/unban user
- [ ] View analytics
- [ ] Create subscription
- [ ] View payments
- [ ] System health check
- [ ] Role-based access
- [ ] Audit logging

---

## Troubleshooting

### Issue: Admin login fails
**Solution**: Check JWT_SECRET, verify admin user exists, check password

### Issue: Charts not loading
**Solution**: Verify API endpoints, check CORS settings, inspect network tab

### Issue: Permission denied
**Solution**: Verify admin role, check token validity, review RBAC rules

### Issue: Slow analytics
**Solution**: Add Redis caching, optimize queries, add database indexes

---

## Security Best Practices

1. **Never commit credentials**
2. **Use HTTPS in production**
3. **Rotate JWT secrets regularly**
4. **Implement rate limiting**
5. **Enable audit logging**
6. **Regular security audits**
7. **Keep dependencies updated**
8. **Use strong passwords**
9. **Implement 2FA (future)**
10. **Monitor for anomalies**

---

## Performance Optimization

### Database
- Add indexes on frequently queried columns
- Use connection pooling
- Optimize complex queries
- Regular VACUUM/ANALYZE

### Caching
- Cache analytics for 5 minutes
- Cache user lists for 1 minute
- Invalidate on updates

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Bundle size optimization

---

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- Load balancer ready
- Session in Redis

### Database Scaling
- Read replicas for analytics
- Sharding strategy
- Connection pooling

### Caching Strategy
- Redis cluster
- Cache warming
- Distributed caching

---

## Support & Maintenance

### Regular Tasks
- Review audit logs weekly
- Monitor system health daily
- Update dependencies monthly
- Backup database daily
- Review analytics weekly

### Emergency Procedures
1. System down: Check health endpoint
2. Data breach: Revoke all tokens
3. Performance issues: Check slow queries
4. High error rate: Review logs

---

## Future Enhancements

1. **Advanced Analytics**
   - Cohort analysis
   - Funnel visualization
   - A/B testing dashboard

2. **Machine Learning**
   - Churn prediction
   - Anomaly detection
   - User segmentation

3. **Automation**
   - Auto-ban suspicious users
   - Auto-scaling
   - Automated reports

4. **Integrations**
   - Slack notifications
   - Email campaigns
   - CRM integration

---

## License

MIT

---

## Contact

For support: admin@consistency.com
