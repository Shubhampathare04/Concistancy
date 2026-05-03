import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/store/ThemeContext';
import { font, spacing, radius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Tab {
  key: string;
  label: string;
  icon?: string;
}

interface Props {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  children: React.ReactNode;
}

export default function SwipeableTabs({ tabs, activeTab, onTabChange, children }: Props) {
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(tabs.findIndex(t => t.key === activeTab));
  const translateX = useRef(new Animated.Value(-currentIndex * SCREEN_WIDTH)).current;
  const tabScrollRef = useRef<ScrollView>(null);
  const isSwipingRef = useRef(false);

  // Update index when activeTab prop changes
  useEffect(() => {
    const newIndex = tabs.findIndex(t => t.key === activeTab);
    if (newIndex !== -1 && newIndex !== currentIndex) {
      goToTab(newIndex, false);
    }
  }, [activeTab]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture horizontal swipes that are clearly intentional
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2;
        const isSignificant = Math.abs(gestureState.dx) > 20;
        return isHorizontal && isSignificant && !isSwipingRef.current;
      },
      onPanResponderGrant: () => {
        isSwipingRef.current = true;
        translateX.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        // Prevent over-scrolling at edges
        let newValue = -currentIndex * SCREEN_WIDTH + gestureState.dx;
        
        // Add resistance at edges
        if (currentIndex === 0 && gestureState.dx > 0) {
          newValue = gestureState.dx * 0.3;
        } else if (currentIndex === tabs.length - 1 && gestureState.dx < 0) {
          newValue = -currentIndex * SCREEN_WIDTH + gestureState.dx * 0.3;
        }
        
        translateX.setValue(newValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        isSwipingRef.current = false;
        const threshold = SCREEN_WIDTH * 0.25;
        const velocity = gestureState.vx;
        let newIndex = currentIndex;

        // Quick swipe detection
        if (Math.abs(velocity) > 0.8) {
          if (velocity > 0 && currentIndex > 0) {
            newIndex = currentIndex - 1;
          } else if (velocity < 0 && currentIndex < tabs.length - 1) {
            newIndex = currentIndex + 1;
          }
        } else {
          // Slow swipe detection
          if (gestureState.dx > threshold && currentIndex > 0) {
            newIndex = currentIndex - 1;
          } else if (gestureState.dx < -threshold && currentIndex < tabs.length - 1) {
            newIndex = currentIndex + 1;
          }
        }

        goToTab(newIndex, true);
      },
      onPanResponderTerminate: () => {
        isSwipingRef.current = false;
        goToTab(currentIndex, true);
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  const goToTab = (index: number, withHaptic = true) => {
    if (index === currentIndex) {
      // Snap back to current position
      Animated.spring(translateX, {
        toValue: -currentIndex * SCREEN_WIDTH,
        tension: 80,
        friction: 14,
        useNativeDriver: true,
      }).start();
      return;
    }
    
    if (withHaptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    
    setCurrentIndex(index);
    onTabChange(tabs[index].key);
    
    Animated.spring(translateX, {
      toValue: -index * SCREEN_WIDTH,
      tension: 80,
      friction: 14,
      useNativeDriver: true,
    }).start();

    // Scroll tab bar to center active tab
    if (tabScrollRef.current) {
      tabScrollRef.current.scrollTo({
        x: index * 100 - SCREEN_WIDTH / 2 + 50,
        animated: true,
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView
          ref={tabScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {tabs.map((tab, index) => {
            const isActive = index === currentIndex;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  goToTab(index, false);
                }}
                style={[
                  styles.tab,
                  isActive && styles.tabActive,
                ]}
                activeOpacity={0.7}
              >
                {isActive && (
                  <LinearGradient
                    colors={[colors.primary, colors.primary + 'dd']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <Text
                  style={[
                    styles.tabText,
                    { color: isActive ? '#fff' : colors.textMuted },
                    isActive && styles.tabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        
        {/* Progress Indicator */}
        <View style={[styles.indicator, { backgroundColor: colors.border }]}>
          <Animated.View
            style={[
              styles.indicatorActive,
              {
                backgroundColor: colors.primary,
                width: `${100 / tabs.length}%`,
                transform: [
                  {
                    translateX: translateX.interpolate({
                      inputRange: tabs.map((_, i) => i * -SCREEN_WIDTH).reverse(),
                      outputRange: tabs.map((_, i) => i * (SCREEN_WIDTH / tabs.length)).reverse(),
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content} {...panResponder.panHandlers}>
        <Animated.View
          style={[
            styles.contentScroll,
            {
              width: SCREEN_WIDTH * tabs.length,
              transform: [{ translateX }],
            },
          ]}
        >
          {React.Children.map(children, (child, index) => (
            <View key={index} style={[styles.page, { width: SCREEN_WIDTH }]}>
              {child}
            </View>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    borderBottomWidth: 1,
    paddingTop: spacing.sm,
  },
  tabScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.full,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tabActive: {
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    fontSize: font.sm,
    fontWeight: '600',
  },
  tabTextActive: {
    fontWeight: '800',
  },
  indicator: {
    height: 3,
    width: '100%',
    overflow: 'hidden',
  },
  indicatorActive: {
    height: '100%',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
  contentScroll: {
    flexDirection: 'row',
    height: '100%',
  },
  page: {
    flex: 1,
  },
});
