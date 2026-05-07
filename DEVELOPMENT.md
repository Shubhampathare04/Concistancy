# 💻 Development Guide

Complete development workflow and best practices for the Consistency App.

---

## Development Workflow

### Daily Workflow

```bash
# 1. Start backend
cd backend
source venv/bin/activate
docker compose up -d
uvicorn app.main:app --reload --host 0.0.0.0

# 2. Start mobile (new terminal)
cd mobile
REACT_NATIVE_PACKAGER_HOSTNAME=<YOUR_IP> npx expo start --lan

# 3. Make changes
# 4. Test changes
# 5. Commit changes
git add .
git commit -m "feat: add new feature"
git push
```

### Branch Strategy

```bash
# Main branches
main          # Production-ready code
develop       # Development branch

# Feature branches
feature/task-categories
feature/push-notifications
feature/social-features

# Bugfix branches
bugfix/streak-calculation
bugfix/offline-sync

# Hotfix branches
hotfix/critical-auth-bug
```

### Commit Convention

```bash
# Format
<type>(<scope>): <subject>

# Types
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation
style:    # Formatting
refactor: # Code restructuring
test:     # Tests
chore:    # Maintenance

# Examples
feat(tasks): add task categories
fix(auth): resolve token expiration issue
docs(api): update endpoint documentation
style(mobile): improve button styling
refactor(backend): optimize database queries
test(tasks): add task completion tests
chore(deps): update dependencies
```

---

## Backend Development

### Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app
│   ├── config.py            # Configuration
│   ├── database.py          # Database setup
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── routers/             # API endpoints
│   ├── services/            # Business logic
│   └── utils/               # Utilities
├── tests/                   # Tests
├── requirements.txt         # Dependencies
└── docker-compose.yml       # Infrastructure
```

### Adding New Endpoint

#### 1. Create Schema (schemas/task.py)
```python
from pydantic import BaseModel

class TaskCreate(BaseModel):
    title: str
    difficulty: int
    category: str | None = None
```

#### 2. Create Model (models/task.py)
```python
from sqlalchemy import Column, Integer, String
from app.database import Base

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True)
    title = Column(String(255))
    difficulty = Column(Integer)
```

#### 3. Create Router (routers/tasks.py)
```python
from fastapi import APIRouter, Depends
from app.schemas.task import TaskCreate

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.post("/")
async def create_task(task: TaskCreate):
    # Implementation
    return {"id": 1, "title": task.title}
```

#### 4. Register Router (main.py)
```python
from app.routers import tasks

app.include_router(tasks.router, prefix="/api/v1")
```

### Database Migrations

#### Using Alembic
```bash
# Install
pip install alembic

# Initialize
alembic init alembic

# Create migration
alembic revision --autogenerate -m "add task categories"

# Apply migration
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Testing

```bash
# Run all tests
pytest tests/ -v

# Run specific test
pytest tests/test_tasks.py::test_create_task -v

# With coverage
pytest tests/ --cov=app --cov-report=html

# Watch mode
pytest-watch
```

### Debugging

```python
# Add breakpoint
import pdb; pdb.set_trace()

# Or use debugpy for VS Code
import debugpy
debugpy.listen(5678)
debugpy.wait_for_client()
```

---

## Mobile Development

### Project Structure

```
mobile/
├── src/
│   ├── components/          # Reusable components
│   ├── screens/             # Screen components
│   ├── navigation/          # Navigation setup
│   ├── services/            # API services
│   ├── store/               # Zustand stores
│   ├── hooks/               # Custom hooks
│   ├── utils/               # Utilities
│   └── theme/               # Theme configuration
├── assets/                  # Images, fonts
├── app.json                 # Expo configuration
└── package.json             # Dependencies
```

### Adding New Screen

#### 1. Create Screen (screens/TaskDetailScreen.tsx)
```typescript
import React from 'react';
import { View, Text } from 'react-native';
import { ScreenWrapper } from '@/components/ScreenWrapper';

export const TaskDetailScreen = () => {
  return (
    <ScreenWrapper>
      <Text>Task Detail</Text>
    </ScreenWrapper>
  );
};
```

#### 2. Add to Navigator (navigation/RootNavigator.tsx)
```typescript
import { TaskDetailScreen } from '@/screens/TaskDetailScreen';

<Stack.Screen 
  name="TaskDetail" 
  component={TaskDetailScreen}
  options={{ title: 'Task Detail' }}
/>
```

#### 3. Navigate to Screen
```typescript
import { useNavigation } from '@react-navigation/native';

const navigation = useNavigation();
navigation.navigate('TaskDetail', { taskId: 1 });
```

### State Management (Zustand)

#### Create Store (store/taskStore.ts)
```typescript
import { create } from 'zustand';

interface TaskStore {
  tasks: Task[];
  addTask: (task: Task) => void;
  removeTask: (id: number) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  addTask: (task) => set((state) => ({ 
    tasks: [...state.tasks, task] 
  })),
  removeTask: (id) => set((state) => ({ 
    tasks: state.tasks.filter(t => t.id !== id) 
  })),
}));
```

#### Use Store
```typescript
import { useTaskStore } from '@/store/taskStore';

const tasks = useTaskStore((state) => state.tasks);
const addTask = useTaskStore((state) => state.addTask);
```

### API Integration (React Query)

#### Create Service (services/taskService.ts)
```typescript
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const taskService = {
  getTasks: async () => {
    const { data } = await axios.get(`${API_URL}/tasks`);
    return data;
  },
  
  createTask: async (task: TaskCreate) => {
    const { data } = await axios.post(`${API_URL}/tasks`, task);
    return data;
  },
};
```

#### Use in Component
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { taskService } from '@/services/taskService';

const { data: tasks, isLoading } = useQuery({
  queryKey: ['tasks'],
  queryFn: taskService.getTasks,
});

const createMutation = useMutation({
  mutationFn: taskService.createTask,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  },
});
```

### Styling

#### Using Theme
```typescript
import { useTheme } from '@/hooks/useTheme';

const { colors, spacing, typography } = useTheme();

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
});
```

#### Responsive Design
```typescript
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;
const isTablet = width >= 768;
```

### Testing

```bash
# Run tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# Update snapshots
npm test -- -u
```

### Debugging

#### React Native Debugger
```bash
# Install
brew install --cask react-native-debugger

# Open
open "rndebugger://set-debugger-loc?host=localhost&port=8081"
```

#### Flipper
```bash
# Install
brew install --cask flipper

# Open and connect to app
```

#### Console Logs
```typescript
console.log('Debug:', data);
console.warn('Warning:', error);
console.error('Error:', error);
```

---

## Design System

### Colors

```typescript
// Light mode
const lightColors = {
  primary: '#ff6b35',
  background: '#ffffff',
  surface: '#f8f9fa',
  text: '#1a1a1a',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
};

// Dark mode
const darkColors = {
  primary: '#ff6b35',
  background: '#0a0a0a',
  surface: '#1a1a1a',
  text: '#ffffff',
  textSecondary: '#9ca3af',
  border: '#374151',
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
};
```

### Typography

```typescript
const typography = {
  xs: { fontSize: 11, lineHeight: 16 },
  sm: { fontSize: 13, lineHeight: 18 },
  md: { fontSize: 15, lineHeight: 22 },
  lg: { fontSize: 17, lineHeight: 24 },
  xl: { fontSize: 20, lineHeight: 28 },
  xxl: { fontSize: 28, lineHeight: 36 },
  xxxl: { fontSize: 34, lineHeight: 42 },
};
```

### Spacing (8pt Grid)

```typescript
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

### Shadows

```typescript
const shadows = {
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  // ... md, lg
};
```

---

## Best Practices

### Backend

#### 1. Use Dependency Injection
```python
from fastapi import Depends
from sqlalchemy.orm import Session

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/tasks")
async def get_tasks(db: Session = Depends(get_db)):
    return db.query(Task).all()
```

#### 2. Use Pydantic for Validation
```python
from pydantic import BaseModel, validator

class TaskCreate(BaseModel):
    title: str
    difficulty: int
    
    @validator('difficulty')
    def validate_difficulty(cls, v):
        if v < 1 or v > 5:
            raise ValueError('Difficulty must be 1-5')
        return v
```

#### 3. Handle Errors Properly
```python
from fastapi import HTTPException

@router.get("/tasks/{task_id}")
async def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task
```

#### 4. Use Async When Possible
```python
@router.get("/tasks")
async def get_tasks(db: Session = Depends(get_db)):
    # Use async database operations
    return await db.execute(select(Task))
```

### Mobile

#### 1. Use TypeScript
```typescript
// Define types
interface Task {
  id: number;
  title: string;
  difficulty: number;
}

// Use types
const task: Task = {
  id: 1,
  title: 'Workout',
  difficulty: 3,
};
```

#### 2. Memoize Expensive Calculations
```typescript
import { useMemo } from 'react';

const sortedTasks = useMemo(() => {
  return tasks.sort((a, b) => b.difficulty - a.difficulty);
}, [tasks]);
```

#### 3. Use useCallback for Functions
```typescript
import { useCallback } from 'react';

const handlePress = useCallback(() => {
  console.log('Pressed');
}, []);
```

#### 4. Optimize FlatList
```typescript
<FlatList
  data={tasks}
  keyExtractor={(item) => item.id.toString()}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  removeClippedSubviews
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

#### 5. Use React.memo for Components
```typescript
export const TaskCard = React.memo(({ task }: Props) => {
  return <View>{task.title}</View>;
});
```

---

## Performance Optimization

### Backend

#### 1. Database Indexing
```python
class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
```

#### 2. Query Optimization
```python
# Bad: N+1 queries
tasks = db.query(Task).all()
for task in tasks:
    user = db.query(User).filter(User.id == task.user_id).first()

# Good: Join
tasks = db.query(Task).join(User).all()
```

#### 3. Caching with Redis
```python
import redis

redis_client = redis.from_url(settings.REDIS_URL)

@router.get("/tasks")
async def get_tasks():
    # Check cache
    cached = redis_client.get("tasks")
    if cached:
        return json.loads(cached)
    
    # Query database
    tasks = db.query(Task).all()
    
    # Cache result
    redis_client.setex("tasks", 300, json.dumps(tasks))
    
    return tasks
```

### Mobile

#### 1. Image Optimization
```typescript
<Image
  source={{ uri: imageUrl }}
  style={styles.image}
  resizeMode="cover"
  defaultSource={require('@/assets/placeholder.png')}
/>
```

#### 2. Lazy Loading
```typescript
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

#### 3. Debounce Input
```typescript
import { debounce } from 'lodash';

const handleSearch = debounce((text: string) => {
  // Search logic
}, 300);
```

---

## Security

### Backend

#### 1. Password Hashing
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

hashed = pwd_context.hash(password)
verified = pwd_context.verify(password, hashed)
```

#### 2. JWT Authentication
```python
from jose import jwt

def create_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
```

#### 3. CORS Configuration
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8082"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Mobile

#### 1. Secure Storage
```typescript
import * as SecureStore from 'expo-secure-store';

await SecureStore.setItemAsync('token', token);
const token = await SecureStore.getItemAsync('token');
```

#### 2. API Security
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## Deployment

### Backend (Production)

```bash
# Using Gunicorn
gunicorn app.main:app \
  -w 4 \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000

# Using Docker
docker build -t consistency-backend .
docker run -p 8000:8000 consistency-backend
```

### Mobile (Production)

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## Resources

### Documentation
- FastAPI: https://fastapi.tiangolo.com
- React Native: https://reactnative.dev
- Expo: https://docs.expo.dev
- React Navigation: https://reactnavigation.org

### Tools
- Postman: API testing
- React Native Debugger: Debugging
- Flipper: Mobile debugging
- VS Code: Code editor

---

**Last Updated**: January 2025
