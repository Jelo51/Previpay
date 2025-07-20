import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/services/i18n';
import { useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { DebitProvider } from './src/context/DebitContext.js';
import { initializeDatabase } from './src/services/database';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import CalendarScreen from './src/screens/CalendarScreen.js';
import AddDebitScreen from './src/screens/AddDebitScreen';
import CatalogScreen from './src/screens/CatalogScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AuthScreen from './src/screens/AuthScreen';
import DebitDetailsScreen from './src/screens/DebitDetailsScreen';
import StatisticsScreen from './src/screens/StatisticsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigator pour l'écran principal
function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Dashboard" 
        component={HomeScreen} 
        options={{ title: 'PréviPay' }}
      />
      <Stack.Screen 
        name="DebitDetails" 
        component={DebitDetailsScreen}
        options={{ title: 'Détails du prélèvement' }}
      />
      <Stack.Screen 
        name="Statistics" 
        component={StatisticsScreen}
        options={{ title: 'Statistiques' }}
      />
    </Stack.Navigator>
  );
}

// Stack Navigator pour le calendrier
function CalendarStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="CalendarView" 
        component={CalendarScreen} 
        options={{ title: 'Calendrier' }}
      />
      <Stack.Screen 
        name="DebitDetails" 
        component={DebitDetailsScreen}
        options={{ title: 'Détails du prélèvement' }}
      />
    </Stack.Navigator>
  );
}

// Stack Navigator pour l'ajout
function AddStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="AddDebit" 
        component={AddDebitScreen} 
        options={{ title: 'Ajouter un prélèvement' }}
      />
      <Stack.Screen 
        name="Catalog" 
        component={CatalogScreen}
        options={{ title: 'Catalogue' }}
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

// Composant principal de l'app
function AppContent() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    initializeDatabase();
  }, []);

  if (loading) {
    return null; // ou un écran de chargement
  }

  return (
    <NavigationContainer
      theme={{
        dark: theme.isDark,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.border,
          notification: theme.colors.primary,
        },
      }}
    >
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      {user ? <MainTabs /> : <AuthScreen />}
    </NavigationContainer>
  );
}

// App principal avec tous les providers
export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <NotificationProvider>
          <DebitProvider>
            <AppContent />
          </DebitProvider>
        </NotificationProvider>
      </AuthProvider>
    </I18nextProvider>
  );
}