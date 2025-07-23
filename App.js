import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
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

// Composant wrapper avec SafeArea
function ScreenWrapper({ children, theme }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {children}
    </SafeAreaView>
  );
}

// Stack Navigator pour l'écran principal
function HomeStack() {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Désactiver les headers pour éviter l'erreur
      }}
    >
      <Stack.Screen 
        name="Dashboard" 
        options={{ title: 'PréviPay' }}
      >
        {(props) => (
          <ScreenWrapper theme={theme}>
            <HomeScreen {...props} />
          </ScreenWrapper>
        )}
      </Stack.Screen>
      <Stack.Screen 
        name="DebitDetails"
        options={{ title: 'Détails du prélèvement' }}
      >
        {(props) => (
          <ScreenWrapper theme={theme}>
            <DebitDetailsScreen {...props} />
          </ScreenWrapper>
        )}
      </Stack.Screen>
      <Stack.Screen 
        name="Statistics"
        options={{ title: 'Statistiques' }}
      >
        {(props) => (
          <ScreenWrapper theme={theme}>
            <StatisticsScreen {...props} />
          </ScreenWrapper>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// Stack Navigator pour le calendrier
function CalendarStack() {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="CalendarView"
        options={{ title: 'Calendrier' }}
      >
        {(props) => (
          <ScreenWrapper theme={theme}>
            <CalendarScreen {...props} />
          </ScreenWrapper>
        )}
      </Stack.Screen>
      <Stack.Screen 
        name="DebitDetails"
        options={{ title: 'Détails du prélèvement' }}
      >
        {(props) => (
          <ScreenWrapper theme={theme}>
            <DebitDetailsScreen {...props} />
          </ScreenWrapper>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// Stack Navigator pour l'ajout
function AddStack() {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="AddDebit"
        options={{ title: 'Ajouter un prélèvement' }}
      >
        {(props) => (
          <ScreenWrapper theme={theme}>
            <AddDebitScreen {...props} />
          </ScreenWrapper>
        )}
      </Stack.Screen>
      <Stack.Screen 
        name="Catalog"
        options={{ title: 'Catalogue d\'entreprises' }}
      >
        {(props) => (
          <ScreenWrapper theme={theme}>
            <CatalogScreen {...props} />
          </ScreenWrapper>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// Stack Navigator pour les paramètres
function SettingsStack() {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="SettingsMain"
        options={{ title: 'Paramètres' }}
      >
        {(props) => (
          <ScreenWrapper theme={theme}>
            <SettingsScreen {...props} />
          </ScreenWrapper>
        )}
      </Stack.Screen>
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
          borderTopWidth: 1,
          paddingBottom: 5,
          height: 85,
        },
        tabBarLabelStyle: {
          fontWeight: 'normal',
          fontSize: 12,
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
        component={SettingsStack} 
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
      <StatusBar 
        style={theme.isDark ? 'light' : 'dark'} 
        backgroundColor={theme.colors.background}
      />
      {user ? <MainTabs /> : (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <AuthScreen />
        </SafeAreaView>
      )}
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