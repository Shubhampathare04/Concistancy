import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { forwardRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from '@/store/ThemeContext';

// Auth
import LoginScreen        from '@/features/auth/screens/LoginScreen';
import RegisterScreen     from '@/features/auth/screens/RegisterScreen';
import ConnectionTest     from '@/screens/ConnectionTest';

// Onboarding
import OnboardingScreen   from '@/features/onboarding/screens/OnboardingScreen';

// Core tabs
import { TodayScreen } from '@/screens/TodayScreen';
import { CreateScreen } from '@/screens/CreateScreen';
import { ProgressScreen } from '@/screens/ProgressScreen';
import { SocialScreen } from '@/screens/SocialScreen';
import { ProfileScreenV2 } from '@/screens/ProfileScreenV2';

// Feature screens
import FocusModeScreen    from '@/features/tasks/screens/FocusModeScreen';
import SearchScreen       from '@/features/tasks/screens/SearchScreen';
import GroupDetailScreen  from '@/features/social/screens/GroupDetailScreen';
import CreateGroupScreen  from '@/features/social/screens/CreateGroupScreen';
import CreateGroupChallengeScreen from '@/features/social/screens/CreateGroupChallengeScreen';

import { radius } from '@/constants/theme';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

function AddTabButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onPress();
  };
  
  return (
    <TouchableOpacity style={s.addWrap} onPress={handlePress} activeOpacity={0.85}>
      <LinearGradient colors={[colors.primary, '#ff3d00']} style={s.addBtn}>
        <Ionicons name="add" size={26} color="#fff" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

function MainTabs() {
  const { colors, isDark } = useTheme();
  
  const handleTabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? 'rgba(14,15,20,0.98)' : 'rgba(255,255,255,0.98)',
          borderTopColor: colors.strokeSubtle,
          borderTopWidth: 0.5,
          height: Platform.OS === 'ios' ? 88 : 72,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          paddingTop: 10,
          elevation: 0,
          position: 'absolute',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 12,
        },
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
      }}
      screenListeners={{
        tabPress: handleTabPress,
      }}
    >
      <Tab.Screen name="Today" component={TodayScreen}
        options={{ tabBarLabel: 'Today', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={23} color={color} /> }}
      />
      <Tab.Screen name="Progress" component={ProgressScreen}
        options={{ tabBarLabel: 'Progress', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} size={23} color={color} /> }}
      />
      <Tab.Screen name="Create" component={CreateScreen}
        options={({ navigation }) => ({
          tabBarLabel: '',
          tabBarIcon: () => null,
          tabBarButton: () => <AddTabButton onPress={() => navigation.navigate('Create')} />,
        })}
      />
      <Tab.Screen name="Social" component={SocialScreen}
        options={{ tabBarLabel: 'Social', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'people' : 'people-outline'} size={23} color={color} /> }}
      />
      <Tab.Screen name="Profile" component={ProfileScreenV2}
        options={{ tabBarLabel: 'Profile', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'person' : 'person-outline'} size={23} color={color} /> }}
      />
    </Tab.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false, 
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen name="Tabs"          component={MainTabs} />
      <Stack.Screen name="FocusMode"     component={FocusModeScreen} options={{ animation: 'fade', presentation: 'fullScreenModal' }} />
      <Stack.Screen name="Search"        component={SearchScreen} options={{ animation: 'fade_from_bottom', presentation: 'modal' }} />
      <Stack.Screen name="GroupDetail"   component={GroupDetailScreen} />
      <Stack.Screen name="CreateGroup"   component={CreateGroupScreen} options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      <Stack.Screen name="CreateGroupChallenge" component={CreateGroupChallengeScreen} options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
      <Stack.Screen name="ConnectionTest" component={ConnectionTest} />
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

const RootNavigator = forwardRef((props, ref) => {
  const token      = useAuthStore((s) => s.token);
  const user       = useAuthStore((s) => s.user) as any;
  const { colors, isDark } = useTheme();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      background: colors.bg0,
      card:       colors.bg1,
      border:     colors.strokeSubtle,
      text:       colors.text,
      primary:    colors.primary,
    },
  };

  const showOnboarding = token && user && user.is_onboarded === false;

  return (
    <NavigationContainer theme={navTheme} ref={ref}>
      {!token
        ? <AuthStack />
        : showOnboarding
          ? (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            </Stack.Navigator>
          )
          : <MainStack />
      }
    </NavigationContainer>
  );
});

export default RootNavigator;

const s = StyleSheet.create({
  addWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  addBtn: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 12 : 4,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
});
