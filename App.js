import React, { useEffect } from 'react';
import { ActivityIndicator, I18nManager, View } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider, useStore } from './src/store';
import { getPalette } from './src/theme';
import DashboardScreen from './src/screens/DashboardScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import ReportsScreen from './src/screens/ReportsScreen';

const Tab = createBottomTabNavigator();

const ICONS = {
  'داشبورد': ['home', 'home-outline'],
  'تراکنش‌ها': ['swap-horizontal', 'swap-horizontal-outline'],
  'اهداف': ['flag', 'flag-outline'],
  'گزارش‌ها': ['bar-chart', 'bar-chart-outline'],
};

function Root() {
  const { ready, isDark } = useStore();
  const p = getPalette(isDark);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: p.bg }}>
        <ActivityIndicator color={p.primary} />
      </View>
    );
  }

  const base = isDark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, background: p.bg, card: p.surface, text: p.text, border: p.border, primary: p.primary },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Tab.Navigator
        detachInactiveScreens
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: p.primary,
          tabBarInactiveTintColor: p.muted,
          tabBarStyle: { backgroundColor: p.surface, borderTopColor: p.border, height: 64, paddingBottom: 8, paddingTop: 6 },
          tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
          tabBarIcon: ({ color, size, focused }) => {
            const [on, off] = ICONS[route.name];
            return <Ionicons name={focused ? on : off} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="داشبورد" component={DashboardScreen} />
        <Tab.Screen name="تراکنش‌ها" component={TransactionsScreen} />
        <Tab.Screen name="اهداف" component={GoalsScreen} />
        <Tab.Screen name="گزارش‌ها" component={ReportsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ DigiLalezar: require('./assets/fonts/DigiLalezarPlus.ttf') });

  useEffect(() => {
    // Android applies RTL after a restart on first launch.
    if (!I18nManager.isRTL) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(true);
    }
  }, []);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator /></View>;
  }

  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
