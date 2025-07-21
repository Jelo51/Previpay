import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Platform } from 'react-native';

// Import conditionnel de SecureStore pour mobile uniquement
let SecureStore = null;
if (Platform.OS !== 'web') {
  try {
    SecureStore = require('expo-secure-store');
  } catch (e) {
    console.log('SecureStore non disponible');
  }
}

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'LOGOUT':
      return { ...state, user: null, loading: false };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    loading: true,
    error: null,
  });

  // Vérifier si un utilisateur est connecté au démarrage
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      console.log('Vérification auth sur:', Platform.OS);
      dispatch({ type: 'SET_LOADING', payload: true });

      let userData = null;

      if (Platform.OS === 'web') {
        // Web uniquement - localStorage
        if (typeof localStorage !== 'undefined') {
          userData = localStorage.getItem('user');
          if (userData) {
            userData = JSON.parse(userData);
          }
        }
      } else {
        // Mobile uniquement - SecureStore
        if (SecureStore) {
          try {
            const userString = await SecureStore.getItemAsync('user');
            if (userString) {
              userData = JSON.parse(userString);
            }
          } catch (error) {
            console.log('Pas de données utilisateur sauvegardées');
          }
        }
      }

      if (userData) {
        console.log('Utilisateur trouvé:', userData.email);
        dispatch({ type: 'SET_USER', payload: userData });
      } else {
        console.log('Aucun utilisateur connecté');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Erreur checkAuthState:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Connexion:', email, 'sur', Platform.OS);
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Simulation d'API (1 seconde de délai)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Validation simple
      if (!email || !password) {
        throw new Error('Email et mot de passe requis');
      }

      if (password.length < 4) {
        throw new Error('Mot de passe trop court (min 4 caractères)');
      }

      // Créer l'utilisateur
      const userData = {
        id: 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        email: email.toLowerCase().trim(),
        name: email.split('@')[0],
        createdAt: new Date().toISOString(),
      };

      // Sauvegarder selon la plateforme
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } else {
        // Mobile - SecureStore
        if (SecureStore) {
          await SecureStore.setItemAsync('user', JSON.stringify(userData));
        }
      }

      console.log('Connexion réussie:', userData.email);
      dispatch({ type: 'SET_USER', payload: userData });
      return { success: true, user: userData };

    } catch (error) {
      console.error('Erreur login:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const register = async (email, password, name) => {
    try {
      console.log('Inscription:', email, 'sur', Platform.OS);
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Simulation d'API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Validation
      if (!email || !password) {
        throw new Error('Email et mot de passe requis');
      }

      if (password.length < 4) {
        throw new Error('Mot de passe trop court (min 4 caractères)');
      }

      // Créer l'utilisateur
      const userData = {
        id: 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        email: email.toLowerCase().trim(),
        name: name || email.split('@')[0],
        createdAt: new Date().toISOString(),
      };

      // Sauvegarder selon la plateforme
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } else {
        // Mobile - SecureStore
        if (SecureStore) {
          await SecureStore.setItemAsync('user', JSON.stringify(userData));
        }
      }

      console.log('Inscription réussie:', userData.email);
      dispatch({ type: 'SET_USER', payload: userData });
      return { success: true, user: userData };

    } catch (error) {
      console.error('Erreur register:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      console.log('Déconnexion sur', Platform.OS);
      
      // Supprimer selon la plateforme
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('user');
        }
      } else {
        // Mobile - SecureStore
        if (SecureStore) {
          await SecureStore.deleteItemAsync('user');
        }
      }

      dispatch({ type: 'LOGOUT' });
      console.log('Déconnexion réussie');
    } catch (error) {
      console.error('Erreur logout:', error);
    }
  };

  const value = {
    user: state.user,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
