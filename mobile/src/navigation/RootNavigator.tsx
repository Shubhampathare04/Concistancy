import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from '@/store/ThemeContext';

// Auth
import LoginScreen        from '@/features/auth/screens/LoginScreen';
import RegisterScreen     from '@/features/auth/screens/RegisterScreen';

// Onboarding
import OnboardingScreen   from '@/features/onboarding/screens/OnboardingScreen';

// Core tabs
import HomeScreen         from '@/features/tasks/screens/HomeScreen';
import CreateTaskScreen   from '@/features/tasks/screens/CreateTaskScreen';
import InsightsScreen     from '@/features/streaks/screens/InsightsScreen';
import CommunityScreen    from '@/features/social/screens/CommunityScreen';
import ProfileScreen      from '@/features/profile/screens/ProfileScreen';

// Feature screens
import FocusModeScreen    from '@/features/tasks/screens/FocusModeScreen';
import SearchScreen       from '@/features/tasks/screens/SearchScreen';
import HabitsScreen       from '@/features/habits/screens/HabitsScreen';
import EventsScreen       from '@/features/events/screens/EventsScreen';
import SocialScreen       from '@/features/social/screens/SocialScreen';
import ProfessionalsScreen from '@/features/professionals/screens/ProfessionalsScreen';
import SubscriptionScreen from '@/features/subscription/screens/SubscriptionScreen';
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
          backgroundColor: isDark ? 'rgba(18,18,18,0.98)' : 'rgba(255,255,255,0.98)',
          borderTopColor: colors.border,
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
        tabBarInactiveTintColor: colors.textDim,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
      }}
      screenListeners={{
        tabPress: handleTabPress,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen}
        options={{ tabBarLabel: 'Home', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={23} color={color} /> }}
      />
      <Tab.Screen name="Insights" component={InsightsScreen}
        options={{ tabBarLabel: 'Insights', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} size={23} color={color} /> }}
      />
      <Tab.Screen name="CreateTask" component={CreateTaskScreen}
        options={({ navigation }) => ({
          tabBarLabel: '',
          tabBarIcon: () => null,
          tabBarButton: () => <AddTabButton onPress={() => navigation.navigate('CreateTask')} />,
        })}
      />
      <Tab.Screen name="Community" component={CommunityScreen}
        options={{ tabBarLabel: 'Community', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'people' : 'people-outline'} size={23} color={color} /> }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen}
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
      <Stack.Screen name="Habits"        component={HabitsScreen} />
      <Stack.Screen name="Events"        component={EventsScreen} />
      <Stack.Screen name="Social"        component={SocialScreen} />
      <Stack.Screen name="Professionals" component={ProfessionalsScreen} />
      <Stack.Screen name="Subscription"  component={SubscriptionScreen} />
      <Stack.Screen name="GroupDetail"   component={GroupDetailScreen} />
      <Stack.Screen name="CreateGroup"   component={CreateGroupScreen} options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      <Stack.Screen name="CreateGroupChallenge" component={CreateGroupChallengeScreen} options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const token      = useAuthStore((s) => s.token);
  const user       = useAuthStore((s) => s.user) as any;
  const { colors, isDark } = useTheme();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      background: colors.bg,
      card:       colors.surface,
      border:     colors.border,
      text:       colors.text,
      primary:    colors.primary,
    },
  };

  const showOnboarding = token && user && user.is_onboarded === false;

  return (
    <NavigationContainer theme={navTheme}>
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
}

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
