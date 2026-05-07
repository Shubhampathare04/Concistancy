# MOBILE FOLDER STRUCTURE REORGANIZATION PLAN

> Clean, scalable, maintainable structure
> Status: Ready for execution

---

## CURRENT ISSUES

1. **Mixed Concerns**
   - screens/ has both main screens and tabs
   - components/ has mixed UI and feature components
   - Unclear separation between shared and feature-specific

2. **Inconsistent Organization**
   - Some features have hooks, some don't
   - Some have components, some don't
   - No clear pattern

3. **Import Confusion**
   - Long import paths
   - Unclear what's shared vs feature-specific
   - Hard to find files

---

## NEW STRUCTURE (CLEAN & SCALABLE)

```
src/
├── app/                          # App-level configuration
│   ├── navigation/              # Navigation setup
│   │   ├── RootNavigator.tsx
│   │   ├── MainNavigator.tsx
│   │   └── types.ts
│   ├── providers/               # App providers
│   │   ├── AppProviders.tsx
│   │   └── index.ts
│   └── config/                  # App configuration
│       ├── constants.ts
│       └── env.ts
│
├── features/                     # Feature modules (domain-driven)
│   ├── auth/
│   │   ├── screens/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── api/
│   │   │   └── authApi.ts
│   │   └── index.ts
│   │
│   ├── tasks/
│   │   ├── screens/
│   │   │   ├── TodayScreen.tsx
│   │   │   ├── CreateTaskScreen.tsx
│   │   │   ├── FocusModeScreen.tsx
│   │   │   └── SearchScreen.tsx
│   │   ├── components/
│   │   │   ├── TaskCard.tsx
│   │   │   └── TaskList.tsx
│   │   ├── hooks/
│   │   │   ├── useTasks.ts
│   │   │   └── useTaskSensor.ts
│   │   ├── api/
│   │   │   └── tasksApi.ts
│   │   ├── types/
│   │   │   └── task.types.ts
│   │   └── index.ts
│   │
│   ├── social/
│   │   ├── screens/
│   │   │   ├── SocialScreen.tsx
│   │   │   ├── GroupDetailScreen.tsx
│   │   │   ├── CreateGroupScreen.tsx
│   │   │   └── CreateGroupChallengeScreen.tsx
│   │   ├── components/
│   │   │   ├── tabs/
│   │   │   │   ├── ConnectionsTab.tsx
│   │   │   │   ├── GroupsTab.tsx
│   │   │   │   ├── LeaderboardTab.tsx
│   │   │   │   └── FeedTab.tsx
│   │   │   ├── GroupCard.tsx
│   │   │   └── ConnectionCard.tsx
│   │   ├── hooks/
│   │   │   ├── useSocial.ts
│   │   │   └── useGroups.ts
│   │   └── index.ts
│   │
│   ├── profile/
│   │   ├── screens/
│   │   │   └── ProfileScreen.tsx
│   │   ├── components/
│   │   │   ├── StatsGrid.tsx
│   │   │   └── AchievementBadge.tsx
│   │   └── index.ts
│   │
│   ├── progress/
│   │   ├── screens/
│   │   │   └── ProgressScreen.tsx
│   │   ├── components/
│   │   │   ├── insights/
│   │   │   │   ├── OverviewTab.tsx
│   │   │   │   ├── ActivityTab.tsx
│   │   │   │   ├── ProgressTab.tsx
│   │   │   │   └── RecordsTab.tsx
│   │   │   ├── WeeklyHeatmap.tsx
│   │   │   └── StreakWidget.tsx
│   │   └── index.ts
│   │
│   ├── onboarding/
│   │   ├── screens/
│   │   │   └── OnboardingScreen.tsx
│   │   └── index.ts
│   │
│   └── [future features]/
│       ├── events/
│       ├── habits/
│       ├── professionals/
│       └── subscription/
│
├── shared/                       # Shared across features
│   ├── components/              # Reusable UI components
│   │   ├── ui/                 # Basic UI elements
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Surface.tsx
│   │   │   └── Text.tsx
│   │   ├── feedback/           # User feedback
│   │   │   ├── Toast.tsx
│   │   │   ├── SimpleToast.tsx
│   │   │   └── XPBurst.tsx
│   │   ├── layout/             # Layout components
│   │   │   ├── ScreenWrapper.tsx
│   │   │   ├── Header.tsx
│   │   │   └── BottomSheet.tsx
│   │   ├── progress/           # Progress indicators
│   │   │   ├── ProgressRing.tsx
│   │   │   ├── StaticProgressRing.tsx
│   │   │   ├── XPBar.tsx
│   │   │   └── StaticXPBar.tsx
│   │   └── misc/               # Other shared components
│   │       ├── EmptyState.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── SkeletonLoader.tsx
│   │
│   ├── hooks/                  # Shared hooks
│   │   ├── useAISuggest.ts
│   │   ├── useHaptics.ts
│   │   ├── useCountUp.ts
│   │   └── useAnimatedPress.ts
│   │
│   ├── services/               # Shared services
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   └── types.ts
│   │   ├── storage/
│   │   │   ├── localDB.ts
│   │   │   └── secureStorage.ts
│   │   ├── sync/
│   │   │   ├── syncEngine.ts
│   │   │   └── backgroundSync.ts
│   │   └── notifications/
│   │       └── pushNotifications.ts
│   │
│   ├── store/                  # Global state
│   │   ├── auth/
│   │   │   └── useAuthStore.ts
│   │   ├── theme/
│   │   │   └── ThemeContext.tsx
│   │   ├── toast/
│   │   │   └── ToastContext.tsx
│   │   └── session/
│   │       └── useSessionUIStore.ts
│   │
│   ├── utils/                  # Utility functions
│   │   ├── date.ts
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   └── performance.ts
│   │
│   ├── constants/              # App constants
│   │   ├── theme.ts
│   │   ├── colors.ts
│   │   └── config.ts
│   │
│   └── types/                  # Shared types
│       ├── api.types.ts
│       ├── navigation.types.ts
│       └── common.types.ts
│
└── assets/                      # Static assets
    ├── images/
    ├── fonts/
    └── icons/
```

---

## MIGRATION PLAN

### Phase 1: Create New Structure
1. Create new folders
2. Keep old structure intact
3. No breaking changes yet

### Phase 2: Move Files (Feature by Feature)
1. Move auth feature
2. Move tasks feature
3. Move social feature
4. Move profile feature
5. Move progress feature
6. Move shared components
7. Move services
8. Move store

### Phase 3: Update Imports
1. Update all imports to new paths
2. Test each feature after migration
3. Fix any broken imports

### Phase 4: Cleanup
1. Remove old empty folders
2. Update tsconfig paths
3. Update documentation

---

## BENEFITS

### 1. Clear Organization
- Feature-based structure (domain-driven)
- Easy to find files
- Clear separation of concerns

### 2. Scalability
- Easy to add new features
- Each feature is self-contained
- Shared code is clearly identified

### 3. Better Imports
```typescript
// Before
import { TaskCard } from '@/components/TaskCard';
import { useTasks } from '@/features/tasks/hooks/useTasks';

// After
import { TaskCard } from '@/features/tasks';
import { Button } from '@/shared/components/ui';
```

### 4. Team Collaboration
- Clear ownership per feature
- Easy to work in parallel
- Reduced merge conflicts

### 5. Maintainability
- Easy to refactor features
- Clear dependencies
- Better code organization

---

## FOLDER NAMING CONVENTIONS

### Features (Domain-Driven)
- `auth/` - Authentication & authorization
- `tasks/` - Task management
- `social/` - Social features
- `profile/` - User profile
- `progress/` - Stats & analytics
- `onboarding/` - First-time user experience

### Shared (Cross-Cutting)
- `components/` - Reusable UI components
- `hooks/` - Reusable hooks
- `services/` - Business logic & API
- `store/` - Global state management
- `utils/` - Helper functions
- `constants/` - App-wide constants
- `types/` - TypeScript types

---

## FILE NAMING CONVENTIONS

### Components
- PascalCase: `TaskCard.tsx`, `Button.tsx`
- Suffix with type: `useAuth.ts`, `authApi.ts`

### Hooks
- camelCase with 'use' prefix: `useAuth.ts`, `useTasks.ts`

### Services
- camelCase with suffix: `authApi.ts`, `syncEngine.ts`

### Types
- PascalCase with suffix: `task.types.ts`, `api.types.ts`

---

## IMPORT ALIASES

Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/app/*": ["./src/app/*"],
      "@/features/*": ["./src/features/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/assets/*": ["./src/assets/*"]
    }
  }
}
```

---

## EXAMPLE: TASKS FEATURE

```
features/tasks/
├── screens/
│   ├── TodayScreen.tsx          # Main task list
│   ├── CreateTaskScreen.tsx     # Create new task
│   ├── FocusModeScreen.tsx      # Focus timer
│   └── SearchScreen.tsx         # Search tasks
├── components/
│   ├── TaskCard.tsx             # Task item
│   ├── TaskList.tsx             # Task list
│   └── DifficultyPicker.tsx     # Difficulty selector
├── hooks/
│   ├── useTasks.ts              # Task CRUD operations
│   ├── useCompleteTask.ts       # Complete task logic
│   └── useTaskSensor.ts         # Motion tracking
├── api/
│   └── tasksApi.ts              # API calls
├── types/
│   └── task.types.ts            # Task types
└── index.ts                      # Public exports
```

**index.ts:**
```typescript
// Screens
export { TodayScreen } from './screens/TodayScreen';
export { CreateTaskScreen } from './screens/CreateTaskScreen';

// Components
export { TaskCard } from './components/TaskCard';

// Hooks
export { useTasks, useCompleteTask } from './hooks/useTasks';

// Types
export type { Task, TaskCreate } from './types/task.types';
```

---

## MIGRATION CHECKLIST

### Preparation
- [ ] Create new folder structure
- [ ] Update tsconfig.json paths
- [ ] Document migration plan

### Feature Migration
- [ ] Migrate auth feature
- [ ] Migrate tasks feature
- [ ] Migrate social feature
- [ ] Migrate profile feature
- [ ] Migrate progress feature
- [ ] Migrate onboarding feature

### Shared Migration
- [ ] Migrate shared components
- [ ] Migrate shared hooks
- [ ] Migrate services
- [ ] Migrate store
- [ ] Migrate utils
- [ ] Migrate constants

### Cleanup
- [ ] Remove old folders
- [ ] Update all imports
- [ ] Test all features
- [ ] Update documentation

---

## EXECUTION STRATEGY

### Option A: Big Bang (Fast but Risky)
- Move everything at once
- Update all imports
- Test everything
- **Time:** 2-3 hours
- **Risk:** High

### Option B: Incremental (Slow but Safe) ⭐ RECOMMENDED
- Move one feature at a time
- Update imports for that feature
- Test that feature
- Repeat
- **Time:** 4-6 hours
- **Risk:** Low

### Option C: Parallel Structure (Safest)
- Create new structure alongside old
- Gradually move files
- Keep both working
- Remove old when done
- **Time:** 6-8 hours
- **Risk:** Very Low

---

## RECOMMENDATION

**Use Option B: Incremental Migration**

**Order:**
1. Create new folder structure
2. Move shared components first (most used)
3. Move features one by one (auth → tasks → social → profile → progress)
4. Update imports as you go
5. Test after each feature
6. Clean up old folders

**Why:**
- Lower risk
- Easy to rollback
- Test as you go
- Clear progress

---

**Status:** PLAN READY
**Next:** Execute incremental migration
**Time:** 4-6 hours
**Risk:** LOW
