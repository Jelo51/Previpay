import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/services/i18n';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { DebitProvider } from './src/context/DebitContext';
import { initializeDatabase } from './src/services/database';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import AddDebitScreen from './src/screens/AddDebitScreen';
import CatalogScreen from './src/screens/CatalogScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AuthScreen from './src/screens/AuthScreen';
import DebitDetailsScreen from './src/screens/DebitDetailsScreen';
import StatisticsScreen from './src/screens/StatisticsScreen';

// Créer les navigateurs
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigator pour l'écran principal
function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="Dashboard" 
        component={HomeScreen} 
      />
      <Stack.Screen 
        name="DebitDetails" 
        component={DebitDetailsScreen}
      />
      <Stack.Screen 
        name="Statistics" 
        component={StatisticsScreen}
      />
    </Stack.Navigator>
  );
}

// Stack Navigator pour le calendrier
function CalendarStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="CalendarView" 
        component={CalendarScreen} 
      />
      <Stack.Screen 
        name="DebitDetails" 
        component={DebitDetailsScreen}
      />
    </Stack.Navigator>
  );
}

// Stack Navigator pour l'ajout
function AddStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="AddDebit" 
        component={AddDebitScreen} 
      />
      <Stack.Screen 
        name="Catalog" 
        component={CatalogScreen}
      />
    </Stack.Navigator>
  );
}

// Navigation principale avec tabs
function MainTabs() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Calendar':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Add':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'circle';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
        },
        tabBarLabelStyle: {
          fontWeight: 'normal', // Valeur statique au lieu de theme.fonts.medium
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack} 
        options={{ title: 'Accueil' }}
      />
      <Tab.Screen 
        name="Calendar" 
        component={CalendarStack} 
        options={{ title: 'Calendrier' }}
      />
      <Tab.Screen 
        name="Add" 
        component={AddStack} 
        options={{ title: 'Ajouter' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Paramètres' }}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    initializeDatabase();
  }, []);

  if (loading) {
    return null; 
  }

  return (
    <NavigationContainer>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      {user ? <MainTabs /> : <AuthScreen />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nextProvider i18n={i18n}>
        <AuthProvider>
          <NotificationProvider>
            <DebitProvider>
              <AppContent />
            </DebitProvider>
          </NotificationProvider>
        </AuthProvider>
      </I18nextProvider>
    </ThemeProvider>
  );
}