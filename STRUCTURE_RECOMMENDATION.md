# FOLDER STRUCTURE REORGANIZATION - EXECUTION GUIDE

> Current structure is actually quite good!
> Recommendation: Minor improvements only

---

## CURRENT STRUCTURE ANALYSIS

### What's GOOD ✅

1. **Feature-Based Organization**
   - `features/` folder with domain separation
   - Each feature has screens, hooks, components
   - Clear separation of concerns

2. **Shared Components**
   - `components/` for reusable UI
   - `hooks/` for shared hooks
   - `services/` for business logic

3. **Clear Navigation**
   - `navigation/` folder
   - Single RootNavigator

4. **State Management**
   - `store/` for global state
   - Context providers organized

### What Needs MINOR Improvement ⚠️

1. **screens/ folder**
   - Mix of main screens and tabs
   - Should move tabs into features/social/components/tabs/

2. **Some components in wrong place**
   - Task-specific components in shared components/
   - Should move to features/tasks/components/

3. **Missing index.ts exports**
   - Hard to import from features
   - Should add barrel exports

---

## RECOMMENDED CHANGES (MINIMAL)

### Change 1: Move Social Tabs
```bash
# Move from
src/screens/tabs/

# To
src/features/social/components/tabs/
```

### Change 2: Move Task Components
```bash
# Move TaskCard from
src/components/TaskCard.tsx

# To
src/features/tasks/components/TaskCard.tsx
```

### Change 3: Rename screens/ to app/screens/
```bash
# Move from
src/screens/

# To  
src/app/screens/
```

### Change 4: Move navigation
```bash
# Move from
src/navigation/

# To
src/app/navigation/
```

### Change 5: Rename store/ to app/store/
```bash
# Move from
src/store/

# To
src/app/store/
```

### Change 6: Rename services/ to app/services/
```bash
# Move from
src/services/

# To
src/app/services/
```

### Change 7: Rename constants/ to app/constants/
```bash
# Move from
src/constants/

# To
src/app/constants/
```

### Change 8: Rename utils/ to app/utils/
```bash
# Move from
src/utils/

# To
src/app/utils/
```

### Change 9: Rename hooks/ to shared/hooks/
```bash
# Move from
src/hooks/

# To
src/shared/hooks/
```

### Change 10: Rename components/ to shared/components/
```bash
# Move from
src/components/

# To
src/shared/components/
```

---

## FINAL STRUCTURE (CLEAN)

```
src/
├── app/                          # App-level (navigation, services, config)
│   ├── navigation/
│   │   └── RootNavigator.tsx
│   ├── screens/                 # Main tab screens
│   │   ├── TodayScreen.tsx
│   │   ├── CreateScreen.tsx
│   │   ├── ProgressScreen.tsx
│   │   ├── SocialScreen.tsx
│   │   ├── ProfileScreenV2.tsx
│   │   └── ConnectionTest.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── syncEngine.ts
│   │   ├── backgroundSync.ts
│   │   └── pushNotifications.ts
│   ├── store/
│   │   ├── useAuthStore.ts
│   │   ├── ThemeContext.tsx
│   │   ├── ToastContext.tsx
│   │   └── useSessionUIStore.ts
│   ├── constants/
│   │   └── theme.ts
│   └── utils/
│       ├── secureStorage.ts
│       ├── performance.ts
│       └── heatmapWeeks.ts
│
├── features/                     # Feature modules
│   ├── auth/
│   ├── tasks/
│   │   ├── screens/
│   │   ├── components/
│   │   │   └── TaskCard.tsx    # Moved here
│   │   ├── hooks/
│   │   ├── api.ts
│   │   └── types.ts
│   ├── social/
│   │   ├── screens/
│   │   └── components/
│   │       └── tabs/            # Moved here
│   │           ├── ConnectionsTab.tsx
│   │           ├── GroupsTab.tsx
│   │           ├── LeaderboardTab.tsx
│   │           └── FeedTab.tsx
│   ├── profile/
│   ├── onboarding/
│   └── [others]/
│
├── shared/                       # Shared UI components
│   ├── components/
│   │   ├── ui/
│   │   ├── feedback/
│   │   ├── layout/
│   │   ├── progress/
│   │   └── insights/
│   └── hooks/
│       ├── useAISuggest.ts
│       ├── useHaptics.ts
│       └── [others]/
│
└── db/
    └── localDB.ts
```

---

## DECISION

**RECOMMENDATION: Keep Current Structure** ✅

**Why:**
1. Current structure is already good
2. Feature-based organization exists
3. Clear separation of concerns
4. Major refactor = high risk, low benefit
5. Time better spent on features/testing

**Minor Improvements Only:**
1. Move social tabs to features/social/components/tabs/
2. Move TaskCard to features/tasks/components/
3. Add index.ts barrel exports to features
4. Update imports

**Time:** 30 minutes
**Risk:** Very Low
**Benefit:** Slightly cleaner

---

## ALTERNATIVE: DO NOTHING ⭐ BEST OPTION

**Current structure is fine for:**
- Small to medium team
- Current app size
- Development speed

**Refactor later when:**
- Team grows significantly
- App becomes much larger
- Import paths become problematic

**For now:** Focus on features and testing, not structure

---

**RECOMMENDATION: Skip major refactor, focus on completing app** ✅
