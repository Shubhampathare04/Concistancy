# 🚀 Profile Page - Quick Reference

## 📂 File Structure

```
mobile/src/features/profile/
├── components/
│   ├── AnimatedBadge.tsx       # Animated achievement badge
│   └── ProgressRing.tsx        # Circular progress (future use)
└── screens/
    └── ProfileScreen.tsx       # Main profile screen (enhanced)
```

## 🎨 Key Components

### 1. Animated Header
```typescript
// Parallax effect
const headerOpacity = scrollY.interpolate({
  inputRange: [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
  outputRange: [1, 0],
  extrapolate: 'clamp',
});

// Pull-to-zoom
const headerScale = scrollY.interpolate({
  inputRange: [-100, 0],
  outputRange: [1.2, 1],
  extrapolate: 'clamp',
});
```

### 2. Stats Grid (2x2)
```typescript
// Each stat card has:
- Gradient background
- Icon badge (44x44)
- Hero number (48px)
- Label (uppercase, 11px)
- Touch feedback
```

### 3. Quick Actions
```typescript
// 4 action buttons:
- Leaderboard → Social screen
- Events → Events screen
- Community → Social screen
- Premium → Subscription screen
```

### 4. Animated Badges
```typescript
<AnimatedBadge
  icon="flame"
  label="7 Day Streak"
  color="#ff6b35"
  delay={80}
  onPress={() => {}}
/>
```

### 5. Floating Action Button
```typescript
// Pulse animation
Animated.loop(
  Animated.sequence([
    Animated.timing(fabPulse, { toValue: 1.1, duration: 1000 }),
    Animated.timing(fabPulse, { toValue: 1, duration: 1000 }),
  ])
).start();
```

## 🎯 Design Tokens

### Spacing
```typescript
xs:  4px   // Tight gaps
sm:  8px   // Small gaps
md:  16px  // Standard padding
lg:  24px  // Large padding
xl:  32px  // Extra large
```

### Border Radius
```typescript
lg:   16px  // Cards
xl:   24px  // Large cards
full: 999px // Pills/badges
```

### Font Sizes
```typescript
xs:   11px  // Labels
sm:   13px  // Body small
md:   15px  // Body
lg:   17px  // Headline
xl:   20px  // Title
xxl:  28px  // Large title
hero: 48px  // Hero numbers
```

### Shadows
```typescript
shadow.xs  // Subtle depth
shadow.sm  // Card elevation
shadow.lg  // Hero elements
```

## 🎬 Animation Patterns

### Entrance Animation
```typescript
useEffect(() => {
  Animated.parallel([
    Animated.timing(fadeAnim, { 
      toValue: 1, 
      duration: 600, 
      useNativeDriver: true 
    }),
    Animated.spring(scaleAnim, { 
      toValue: 1, 
      tension: 50, 
      friction: 7, 
      useNativeDriver: true 
    }),
  ]).start();
}, []);
```

### Staggered Animation
```typescript
badges.map((badge, idx) => (
  <AnimatedBadge
    key={badge}
    delay={idx * 80}  // 80ms stagger
    {...props}
  />
))
```

### Press Feedback
```typescript
const handlePress = () => {
  Animated.sequence([
    Animated.timing(scale, { toValue: 0.9, duration: 100 }),
    Animated.spring(scale, { toValue: 1, tension: 100 }),
  ]).start();
};
```

## 🎨 Color Usage

### Tier Colors
```typescript
bronze:  '#cd7f32'
silver:  '#c0c0c0'
gold:    '#fbbf24'
diamond: '#60a5fa'
legend:  '#a78bfa'
```

### Semantic Colors
```typescript
primary: '#ff6b35'  // Main brand
green:   '#34d399'  // Success
yellow:  '#fbbf24'  // Warning/XP
blue:    '#60a5fa'  // Info
purple:  '#a78bfa'  // Special
red:     '#f87171'  // Danger
```

### Opacity Patterns
```typescript
'20'  // 12% - Subtle background
'18'  // 9%  - Very subtle
'30'  // 19% - Border
'40'  // 25% - Hover state
```

## 📱 Touch Targets

### Minimum Sizes
```typescript
Button:  44x44px  // iOS guideline
Icon:    36x36px  // Comfortable
FAB:     60x60px  // Prominent
```

## 🔧 Common Patterns

### Card with Gradient
```typescript
<View style={[styles.card, { backgroundColor: colors.card }]}>
  <LinearGradient 
    colors={[color + '18', color + '08']} 
    style={StyleSheet.absoluteFill} 
  />
  {/* Content */}
</View>
```

### Icon Badge
```typescript
<View style={[styles.iconWrap, { backgroundColor: color + '20' }]}>
  <Ionicons name={icon} size={20} color={color} />
</View>
```

### Section Header
```typescript
<View style={styles.sectionHeader}>
  <Ionicons name={icon} size={13} color={colors.textMuted} />
  <Text style={styles.sectionHeaderTxt}>SECTION TITLE</Text>
</View>
```

## 🎯 Best Practices

### 1. Always Use Native Driver
```typescript
✅ useNativeDriver: true   // 60fps
❌ useNativeDriver: false  // Janky
```

### 2. Consistent Spacing
```typescript
✅ padding: spacing.md     // 16px from system
❌ padding: 15             // Random value
```

### 3. Semantic Colors
```typescript
✅ color: colors.primary   // Theme-aware
❌ color: '#ff6b35'        // Hardcoded
```

### 4. Touch Feedback
```typescript
✅ activeOpacity={0.7}     // Visual feedback
❌ No feedback             // Feels broken
```

### 5. Accessibility
```typescript
✅ fontSize: font.md       // Readable (15px)
❌ fontSize: 10            // Too small
```

## 🐛 Common Issues

### Issue: Animation not smooth
```typescript
// Solution: Use native driver
useNativeDriver: true
```

### Issue: Colors not updating with theme
```typescript
// Solution: Use colors from useTheme()
const { colors } = useTheme();
```

### Issue: Touch target too small
```typescript
// Solution: Minimum 44x44
minWidth: 44, minHeight: 44
```

### Issue: Layout shift on scroll
```typescript
// Solution: Use absolute positioning for header
position: 'absolute'
```

## 🎨 Customization Guide

### Change Avatar Size
```typescript
// In ProfileScreen.tsx
avatarRing: { 
  width: 110,   // Change this
  height: 110,  // And this
  borderRadius: 55,  // Half of width/height
}
```

### Change Stat Grid Layout
```typescript
// For 1x4 layout:
statCard: { 
  flex: 1, 
  minWidth: '100%'  // Full width
}

// For 4x1 layout:
statsGrid: { 
  flexDirection: 'row',
  flexWrap: 'nowrap'
}
```

### Change Animation Speed
```typescript
// Faster entrance
duration: 400  // Was 600

// Slower pulse
duration: 1500  // Was 1000
```

### Add New Quick Action
```typescript
{
  icon: 'settings',
  label: 'Settings',
  color: colors.blue,
  screen: 'Settings'
}
```

## 📊 Performance Tips

1. **Memoize expensive calculations**
   ```typescript
   const progress = useMemo(() => 
     Math.min(((coins % 500) / 500) * 100, 100),
     [coins]
   );
   ```

2. **Use scrollEventThrottle**
   ```typescript
   scrollEventThrottle={16}  // ~60fps
   ```

3. **Optimize re-renders**
   ```typescript
   const MemoizedCard = React.memo(StatCard);
   ```

4. **Lazy load heavy components**
   ```typescript
   const ProgressRing = lazy(() => import('./ProgressRing'));
   ```

## 🎓 Learning Resources

- [React Native Animations](https://reactnative.dev/docs/animations)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design Motion](https://material.io/design/motion)
- [Expo Linear Gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/)

## 🔗 Related Files

- Theme: `/mobile/src/constants/theme.ts`
- Theme Context: `/mobile/src/store/ThemeContext.tsx`
- Auth Store: `/mobile/src/store/useAuthStore.ts`
- Task Hooks: `/mobile/src/features/tasks/hooks/useTasks.ts`

## 📝 Quick Commands

```bash
# Start development
cd mobile && npx expo start --clear

# Type check
npx tsc --noEmit

# Format code
npx prettier --write "src/**/*.{ts,tsx}"

# Find IP for device testing
ipconfig getifaddr en0
```

---

**Pro Tip**: Keep this file open while working on the profile page! 🚀
