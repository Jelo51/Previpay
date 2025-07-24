import React, { createContext, useContext, useEffect, useReducer } from 'react';
import bankingAPI from '../services/BankingAPI'; // ← Import du service bancaire
import { debitService } from '../services/database';
import { useAuth } from './AuthContext';

const DebitContext = createContext();

// Actions complètes (local + bancaire)
const ACTIONS = {
  // Actions locales existantes
  SET_DEBITS: 'SET_DEBITS',
  ADD_DEBIT: 'ADD_DEBIT',
  UPDATE_DEBIT: 'UPDATE_DEBIT',
  DELETE_DEBIT: 'DELETE_DEBIT',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_BALANCE: 'SET_BALANCE',
  
  // Actions bancaires
  SET_BANKING_DEBITS: 'SET_BANKING_DEBITS',
  SET_REAL_BALANCE: 'SET_REAL_BALANCE',
  SET_BANK_CONNECTION_STATUS: 'SET_BANK_CONNECTION_STATUS',
  SET_SYNC_STATUS: 'SET_SYNC_STATUS',
  SET_ALL_DEBITS: 'SET_ALL_DEBITS',
};

// Fonction pour combiner prélèvements locaux et bancaires
const combineDebits = (localDebits, bankingDebits) => {
  const combined = [
    ...localDebits.map(debit => ({ ...debit, source: 'local' })),
    ...bankingDebits.map(debit => ({ ...debit, source: 'bank' }))
  ];
  
  // Trier par date (plus proche en premier)
  return combined.sort((a, b) => {
    const dateA = new Date(a.next_payment_date || a.date);
    const dateB = new Date(b.next_payment_date || b.date);
    return dateA - dateB;
  });
};

// Reducer unifié
const debitReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_DEBITS:
      return { 
        ...state, 
        localDebits: action.payload,
        debits: action.payload, // Pour compatibilité avec l'ancien code
        allDebits: combineDebits(action.payload, state.bankingDebits),
        loading: false 
      };
      
    case ACTIONS.ADD_DEBIT:
      const newLocalDebits = [...state.localDebits, action.payload];
      return { 
        ...state, 
        localDebits: newLocalDebits,
        debits: newLocalDebits, // Pour compatibilité
        allDebits: combineDebits(newLocalDebits, state.bankingDebits)
      };
      
    case ACTIONS.UPDATE_DEBIT:
      const updatedLocalDebits = state.localDebits.map(debit =>
        debit.id === action.payload.id ? action.payload : debit
      );
      return {
        ...state,
        localDebits: updatedLocalDebits,
        debits: updatedLocalDebits, // Pour compatibilité
        allDebits: combineDebits(updatedLocalDebits, state.bankingDebits)
      };
      
    case ACTIONS.DELETE_DEBIT:
      const filteredLocalDebits = state.localDebits.filter(debit => debit.id !== action.payload);
      return {
        ...state,
        localDebits: filteredLocalDebits,
        debits: filteredLocalDebits, // Pour compatibilité
        allDebits: combineDebits(filteredLocalDebits, state.bankingDebits)
      };
      
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
      
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
      
    case ACTIONS.SET_BALANCE:
      return { ...state, balance: action.payload };
      
    // Actions bancaires
    case ACTIONS.SET_BANKING_DEBITS:
      return { 
        ...state, 
        bankingDebits: action.payload,
        allDebits: combineDebits(state.localDebits, action.payload),
        lastSyncDate: new Date()
      };
      
    case ACTIONS.SET_REAL_BALANCE:
      return { ...state, realBalance: action.payload };
      
    case ACTIONS.SET_BANK_CONNECTION_STATUS:
      return { 
        ...state, 
        isBankConnected: action.payload.connected,
        bankConnectionError: action.payload.error || null
      };
      
    case ACTIONS.SET_SYNC_STATUS:
      return { ...state, syncStatus: action.payload };
      
    case ACTIONS.SET_ALL_DEBITS:
      return { ...state, allDebits: action.payload };
      
    default:
      return state;
  }
};

// État initial unifié
const initialState = {
  // États locaux existants
  debits: [], // Pour compatibilité avec l'ancien code
  localDebits: [], // Nouveaux prélèvements locaux
  balance: 0,
  loading: false,
  error: null,
  
  // États bancaires
  bankingDebits: [], // Prélèvements depuis l'API bancaire
  realBalance: null, // Solde réel depuis l'API
  isBankConnected: false, // État de connexion
  bankConnectionError: null, // Erreur de connexion
  syncStatus: 'idle', // 'idle', 'syncing', 'success', 'error'
  lastSyncDate: null, // Dernière synchronisation
  allDebits: [], // Tous les prélèvements combinés
};

export const DebitProvider = ({ children }) => {
  const [state, dispatch] = useReducer(debitReducer, initialState);
  const { user } = useAuth();

  // Charger les données au démarrage
  useEffect(() => {
    if (user) {
      console.log('🔍 CONTEXT - useEffect déclenché, user:', user.id);
      loadAllData();
    } else {
      console.log('🔍 CONTEXT - Pas d\'utilisateur connecté');
    }
  }, [user]);

  // Charger toutes les données (local + bancaire)
  const loadAllData = async () => {
    await loadDebits();
    await loadBalance();
    await checkBankConnection();
  };

  // Vérifier la connexion bancaire au démarrage
  const checkBankConnection = async () => {
    try {
      const hasToken = await bankingAPI.loadSavedToken();
      if (hasToken) {
        dispatch({ 
          type: ACTIONS.SET_BANK_CONNECTION_STATUS, 
          payload: { connected: true } 
        });
        console.log('🏦 Token bancaire trouvé, synchronisation...');
        await syncWithBankingAPI();
      }
    } catch (error) {
      console.error('❌ Erreur vérification connexion bancaire:', error);
    }
  };

  const loadDebits = async () => {
    try {
      console.log('🔍 CONTEXT - Début chargement des prélèvements...');
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      
      if (!user || !user.id) {
        console.log('🔍 CONTEXT - Pas d\'utilisateur, arrêt du chargement');
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
        return;
      }
      
      console.log('🔍 CONTEXT - Appel getAllDebits pour user.id:', user.id);
      
      const debits = await debitService.getAllDebits(user.id);
      
      console.log('🔍 CONTEXT - Prélèvements récupérés:', debits?.length || 0);
      console.log('🔍 CONTEXT - Détail des prélèvements:', debits);
      
      // Vérification de la structure des données
      if (Array.isArray(debits)) {
        dispatch({ type: ACTIONS.SET_DEBITS, payload: debits });
        console.log('🔍 CONTEXT - Prélèvements chargés avec succès:', debits.length);
      } else {
        console.warn('🔍 CONTEXT - Les données récupérées ne sont pas un tableau:', debits);
        dispatch({ type: ACTIONS.SET_DEBITS, payload: [] });
      }
    } catch (error) {
      console.error('🔍 CONTEXT - Erreur chargement:', error);
      console.error('🔍 CONTEXT - Stack trace:', error.stack);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
    }
  };

  const loadBalance = async () => {
    try {
      console.log('🔍 CONTEXT - Chargement du solde...');
      
      if (!user || !user.id) {
        console.log('🔍 CONTEXT - Pas d\'utilisateur pour le solde');
        return;
      }
      
      const balance = await debitService.getBalance(user.id);
      console.log('🔍 CONTEXT - Solde récupéré:', balance);
      
      dispatch({ type: ACTIONS.SET_BALANCE, payload: balance || 0 });
    } catch (error) {
      console.error('🔍 CONTEXT - Erreur lors du chargement du solde:', error);
      dispatch({ type: ACTIONS.SET_BALANCE, payload: 0 });
    }
  };

  // NOUVELLE FONCTION: Synchronisation avec l'API bancaire
  const syncWithBankingAPI = async () => {
    if (!bankingAPI.isConnected()) {
      console.log('❌ Non connecté à la banque, sync ignorée');
      return { success: false, error: 'Non connecté à la banque' };
    }

    dispatch({ type: ACTIONS.SET_SYNC_STATUS, payload: 'syncing' });
    
    try {
      console.log('🔄 Synchronisation avec MKB Bank...');
      
      // 1. Récupérer le solde réel
      const balanceData = await bankingAPI.getMainAccountBalance();
      dispatch({ type: ACTIONS.SET_REAL_BALANCE, payload: balanceData });
      console.log('💰 Solde réel récupéré:', balanceData.balance);
      
      // 2. Récupérer les prélèvements bancaires
      const bankingDebits = await bankingAPI.getUpcomingDebits(60); // 60 jours
      dispatch({ type: ACTIONS.SET_BANKING_DEBITS, payload: bankingDebits });
      console.log('📅 Prélèvements bancaires récupérés:', bankingDebits.length);
      
      dispatch({ type: ACTIONS.SET_SYNC_STATUS, payload: 'success' });
      console.log('✅ Synchronisation réussie');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Erreur synchronisation:', error);
      dispatch({ type: ACTIONS.SET_SYNC_STATUS, payload: 'error' });
      dispatch({ 
        type: ACTIONS.SET_BANK_CONNECTION_STATUS, 
        payload: { connected: false, error: error.message } 
      });
      return { success: false, error: error.message };
    }
  };

  // NOUVELLE FONCTION: Connecter à la banque
  const connectToBank = async (credentials) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    
    try {
      console.log('🏦 Tentative de connexion bancaire...');
      
      const result = await bankingAPI.connectToBank(
        credentials.email, 
        credentials.password
      );
      
      if (result.success) {
        dispatch({ 
          type: ACTIONS.SET_BANK_CONNECTION_STATUS, 
          payload: { connected: true } 
        });
        
        // Synchroniser immédiatement après connexion
        await syncWithBankingAPI();
        
        return { success: true };
      } else {
        dispatch({ 
          type: ACTIONS.SET_BANK_CONNECTION_STATUS, 
          payload: { connected: false, error: result.error } 
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Erreur connexion bancaire:', error);
      dispatch({ 
        type: ACTIONS.SET_BANK_CONNECTION_STATUS, 
        payload: { connected: false, error: error.message } 
      });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };

  // NOUVELLE FONCTION: Déconnecter de la banque
  const disconnectBank = async () => {
    try {
      await bankingAPI.disconnectBank();
      dispatch({ 
        type: ACTIONS.SET_BANK_CONNECTION_STATUS, 
        payload: { connected: false } 
      });
      dispatch({ type: ACTIONS.SET_BANKING_DEBITS, payload: [] });
      dispatch({ type: ACTIONS.SET_REAL_BALANCE, payload: null });
      console.log('🏦 Déconnexion bancaire réussie');
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur déconnexion bancaire:', error);
      return { success: false, error: error.message };
    }
  };

  const addDebit = async (debitData) => {
    try {
      console.log('🔍 CONTEXT - Ajout prélèvement:', debitData);
      
      if (!user || !user.id) {
        throw new Error('Utilisateur non connecté');
      }
      
      const debit = await debitService.createDebit({ 
        ...debitData, 
        userId: user.id 
      });
      
      console.log('🔍 CONTEXT - Prélèvement créé:', debit);
      
      dispatch({ type: ACTIONS.ADD_DEBIT, payload: debit });
      return { success: true, debit };
    } catch (error) {
      console.error('🔍 CONTEXT - Erreur ajout prélèvement:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const updateDebit = async (id, updates) => {
    try {
      console.log('🔍 CONTEXT - Mise à jour prélèvement:', id, updates);
      
      const debit = await debitService.updateDebit(id, updates);
      console.log('🔍 CONTEXT - Prélèvement mis à jour:', debit);
      
      dispatch({ type: ACTIONS.UPDATE_DEBIT, payload: debit });
      return { success: true, debit };
    } catch (error) {
      console.error('🔍 CONTEXT - Erreur mise à jour:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const deleteDebit = async (id) => {
    try {
      console.log('🔍 CONTEXT - Suppression prélèvement:', id);
      
      await debitService.deleteDebit(id);
      console.log('🔍 CONTEXT - Prélèvement supprimé:', id);
      
      dispatch({ type: ACTIONS.DELETE_DEBIT, payload: id });
      return { success: true };
    } catch (error) {
      console.error('🔍 CONTEXT - Erreur suppression:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const updateBalance = async (newBalance) => {
    try {
      console.log('🔍 CONTEXT - Mise à jour solde:', newBalance);
      
      if (!user || !user.id) {
        throw new Error('Utilisateur non connecté');
      }
      
      await debitService.updateBalance(user.id, newBalance);
      dispatch({ type: ACTIONS.SET_BALANCE, payload: newBalance });
      return { success: true };
    } catch (error) {
      console.error('🔍 CONTEXT - Erreur mise à jour solde:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  // Marquer comme payé
  const markAsPaid = async (debitId) => {
    try {
      console.log('🔍 CONTEXT - Marquage comme payé:', debitId);
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      
      const result = await debitService.markAsPaid(debitId);
      
      if (result.success) {
        console.log('🔍 CONTEXT - Marquage réussi, rechargement...');
        await loadDebits();
        return { success: true };
      } else {
        console.error('🔍 CONTEXT - Erreur marquage:', result.error);
        dispatch({ type: ACTIONS.SET_ERROR, payload: result.error });
        return result;
      }
    } catch (error) {
      console.error('🔍 CONTEXT - Erreur markAsPaid:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Mettre en pause/reprendre
  const togglePause = async (debitId) => {
    try {
      console.log('🔍 CONTEXT - Toggle pause:', debitId);
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      
      const result = await debitService.togglePause(debitId);
      
      if (result.success) {
        console.log('🔍 CONTEXT - Toggle réussi:', result.isPaused);
        const updatedDebit = await debitService.getDebitById(debitId);
        dispatch({ type: ACTIONS.UPDATE_DEBIT, payload: updatedDebit });
        return { success: true, isPaused: result.isPaused };
      } else {
        console.error('🔍 CONTEXT - Erreur toggle:', result.error);
        dispatch({ type: ACTIONS.SET_ERROR, payload: result.error });
        return result;
      }
    } catch (error) {
      console.error('🔍 CONTEXT - Erreur togglePause:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Calculer le solde prévisionnel (amélioré avec solde réel)
  const calculateProjectedBalance = (targetDate) => {
    const today = new Date();
    const target = new Date(targetDate);
    
    // Utiliser le solde réel si disponible, sinon le solde local
    let projectedBalance = state.realBalance ? state.realBalance.balance : state.balance;
    
    console.log('🔍 CONTEXT - Calcul projection depuis:', today, 'vers:', target);
    console.log('🔍 CONTEXT - Solde initial:', projectedBalance);
    
    // Utiliser tous les prélèvements (locaux + bancaires)
    const debitsToUse = state.allDebits.length > 0 ? state.allDebits : state.debits;
    
    debitsToUse.forEach(debit => {
      if (debit.status === 'active' && !debit.is_paused) {
        const debitDate = new Date(debit.next_payment_date || debit.date);
        if (debitDate <= target && debitDate >= today) {
          projectedBalance -= debit.amount;
          console.log('🔍 CONTEXT - Déduction:', debit.company_name || debit.title, debit.amount);
        }
      }
    });
    
    console.log('🔍 CONTEXT - Solde projeté:', projectedBalance);
    return projectedBalance;
  };

  // NOUVELLE FONCTION: Obtenir les prélèvements urgents
  const getUrgentDebits = () => {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const debitsToUse = state.allDebits.length > 0 ? state.allDebits : state.debits;
    
    return debitsToUse.filter(debit => {
      const debitDate = new Date(debit.next_payment_date || debit.date);
      const now = new Date();
      return debitDate <= threeDaysFromNow && debitDate >= now && !debit.is_paused;
    });
  };

  // NOUVELLE FONCTION: Calculer le solde après prélèvements
  const calculateBalanceAfterDebits = () => {
    const currentBalance = state.realBalance ? state.realBalance.balance : state.balance;
    if (!currentBalance && currentBalance !== 0) return null;
    
    const debitsToUse = state.allDebits.length > 0 ? state.allDebits : state.debits;
    
    const upcomingDebits = debitsToUse.filter(debit => {
      if (debit.is_paused) return false;
      const debitDate = new Date(debit.next_payment_date || debit.date);
      return debitDate >= new Date();
    });
    
    const totalDebits = upcomingDebits.reduce((sum, debit) => sum + debit.amount, 0);
    const balanceAfter = currentBalance - totalDebits;
    
    return {
      currentBalance,
      totalDebits,
      balanceAfter,
      isNegative: balanceAfter < 0,
      upcomingDebitsCount: upcomingDebits.length
    };
  };

  // Obtenir les prélèvements du mois
  const getMonthDebits = (month, year) => {
    const debitsToUse = state.allDebits.length > 0 ? state.allDebits : state.debits;
    
    const monthDebits = debitsToUse.filter(debit => {
      if (debit.is_paused) return false;
      const debitDate = new Date(debit.next_payment_date || debit.date);
      return debitDate.getMonth() === month && debitDate.getFullYear() === year;
    });
    
    console.log('🔍 CONTEXT - Prélèvements du mois', month + 1, '/', year, ':', monthDebits.length);
    return monthDebits;
  };

  // Obtenir les prélèvements par catégorie
  const getDebitsByCategory = () => {
    const debitsToUse = state.allDebits.length > 0 ? state.allDebits : state.debits;
    
    const byCategory = debitsToUse.reduce((acc, debit) => {
      if (debit.is_paused) return acc;
      const category = debit.category || 'Autre';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(debit);
      return acc;
    }, {});
    
    console.log('🔍 CONTEXT - Prélèvements par catégorie:', Object.keys(byCategory));
    return byCategory;
  };

  // Obtenir les statistiques mensuelles
  const getMonthlyStats = (month, year) => {
    const monthDebits = getMonthDebits(month, year);
    const totalAmount = monthDebits.reduce((sum, debit) => sum + debit.amount, 0);
    const categorizedDebits = monthDebits.reduce((acc, debit) => {
      const category = debit.category || 'Autre';
      acc[category] = (acc[category] || 0) + debit.amount;
      return acc;
    }, {});

    const stats = {
      totalAmount,
      count: monthDebits.length,
      categories: categorizedDebits,
      debits: monthDebits,
    };
    
    console.log('🔍 CONTEXT - Stats mensuelles:', stats);
    return stats;
  };

  // Fonction de debug
  const debugState = () => {
    console.log('🔍 CONTEXT - État actuel:', {
      localDebitsCount: state.localDebits.length,
      bankingDebitsCount: state.bankingDebits.length,
      allDebitsCount: state.allDebits.length,
      balance: state.balance,
      realBalance: state.realBalance?.balance,
      isBankConnected: state.isBankConnected,
      loading: state.loading,
      error: state.error,
      user: user?.id || 'Non connecté',
    });
  };

  // Rafraîchissement avec sync bancaire
  const refreshDebits = async () => {
    await loadDebits();
    if (state.isBankConnected) {
      await syncWithBankingAPI();
    }
  };

  // Rafraîchissement forcé
  const forceRefresh = async () => {
    console.log('🔍 CONTEXT - Rafraîchissement forcé...');
    if (user) {
      await loadAllData();
    }
  };

  const value = {
    // États (compatibilité assurée)
    debits: state.allDebits.length > 0 ? state.allDebits : state.debits, // Priorité aux données combinées
    localDebits: state.localDebits,
    bankingDebits: state.bankingDebits,
    allDebits: state.allDebits,
    balance: state.balance,
    loading: state.loading,
    error: state.error,
    
    // États bancaires
    realBalance: state.realBalance,
    isBankConnected: state.isBankConnected,
    bankConnectionError: state.bankConnectionError,
    syncStatus: state.syncStatus,
    lastSyncDate: state.lastSyncDate,
    
    // Fonctions locales
    addDebit,
    updateDebit,
    deleteDebit,
    updateBalance,
    markAsPaid,
    togglePause,
    calculateProjectedBalance,
    getMonthDebits,
    getDebitsByCategory,
    getMonthlyStats,
    refreshDebits,
    
    // Fonctions bancaires
    connectToBank,
    disconnectBank,
    syncWithBankingAPI,
    getUrgentDebits,
    calculateBalanceAfterDebits,
    
    // Fonctions de debug
    debugState,
    forceRefresh,
  };

  return (
    <DebitContext.Provider value={value}>
      {children}
    </DebitContext.Provider>
  );
};

export const useDebits = () => {
  const context = useContext(DebitContext);
  if (!context) {
    throw new Error('useDebits must be used within a DebitProvider');
  }
  return context;
};

export default DebitProvider;