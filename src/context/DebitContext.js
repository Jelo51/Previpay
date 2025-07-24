import React, { createContext, useContext, useEffect, useReducer } from 'react';
import bankingAPI from '../services/BankingAPI'; // ← NOUVEAU: Import du service bancaire
import { debitService } from '../services/database';
import { useAuth } from './AuthContext';

const DebitContext = createContext();

// Actions (ajout des nouvelles actions bancaires)
const ACTIONS = {
  SET_DEBITS: 'SET_DEBITS',
  ADD_DEBIT: 'ADD_DEBIT',
  UPDATE_DEBIT: 'UPDATE_DEBIT',
  DELETE_DEBIT: 'DELETE_DEBIT',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_BALANCE: 'SET_BALANCE',
  
  // ← NOUVELLES ACTIONS BANCAIRES
  SET_BANKING_DEBITS: 'SET_BANKING_DEBITS',
  SET_REAL_BALANCE: 'SET_REAL_BALANCE',
  SET_BANK_CONNECTION_STATUS: 'SET_BANK_CONNECTION_STATUS',
  SET_SYNC_STATUS: 'SET_SYNC_STATUS',
  SET_ALL_DEBITS: 'SET_ALL_DEBITS',
};

// Reducer (mis à jour avec les nouvelles actions)
const debitReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_DEBITS:
      return { 
        ...state, 
        localDebits: action.payload,
        allDebits: combineDebits(action.payload, state.bankingDebits),
        loading: false 
      };
    case ACTIONS.ADD_DEBIT:
      const newLocalDebits = [...state.localDebits, action.payload];
      return { 
        ...state, 
        localDebits: newLocalDebits,
        allDebits: combineDebits(newLocalDebits, state.bankingDebits)
      };
    case ACTIONS.UPDATE_DEBIT:
      const updatedLocalDebits = state.localDebits.map(debit =>
        debit.id === action.payload.id ? action.payload : debit
      );
      return {
        ...state,
        localDebits: updatedLocalDebits,
        allDebits: combineDebits(updatedLocalDebits, state.bankingDebits)
      };
    case ACTIONS.DELETE_DEBIT:
      const filteredLocalDebits = state.localDebits.filter(debit => debit.id !== action.payload);
      return {
        ...state,
        localDebits: filteredLocalDebits,
        allDebits: combineDebits(filteredLocalDebits, state.bankingDebits)
      };
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case ACTIONS.SET_BALANCE:
      return { ...state, balance: action.payload };
      
    // ← NOUVEAUX CASES BANCAIRES
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

// ← NOUVELLE FONCTION: Combiner prélèvements locaux et bancaires
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

// État initial (mis à jour avec les nouvelles propriétés)
const initialState = {
  // Données existantes
  localDebits: [], // ← Renommé de 'debits' en 'localDebits'
  balance: 0,
  loading: false,
  error: null,
  
  // ← NOUVELLES PROPRIÉTÉS BANCAIRES
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

  // Charger les données au démarrage (modifié)
  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  // ← NOUVELLE FONCTION: Charger toutes les données
  const loadAllData = async () => {
    await loadDebits();
    await loadBalance();
    await checkBankConnection();
  };

  // ← NOUVELLE FONCTION: Vérifier la connexion bancaire au démarrage
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
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      console.log('🔍 CONTEXT - Début chargement, user.id:', user.id);

      const debits = await debitService.getAllDebits(user.id);
      console.log('🔍 CONTEXT - Prélèvements locaux chargés:', debits.length);

      dispatch({ type: ACTIONS.SET_DEBITS, payload: debits });
    } catch (error) {
      console.log('🔍 CONTEXT - Erreur chargement:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
    }
  };

  const loadBalance = async () => {
    try {
      const balance = await debitService.getBalance(user.id);
      dispatch({ type: ACTIONS.SET_BALANCE, payload: balance });
    } catch (error) {
      console.error('Erreur lors du chargement du solde:', error);
    }
  };

  // ← NOUVELLE FONCTION CLÉ: Synchronisation avec l'API bancaire
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

  // ← NOUVELLE FONCTION: Connecter à la banque
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

  // ← NOUVELLE FONCTION: Déconnecter de la banque
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
      const debit = await debitService.createDebit({ ...debitData, userId: user.id });
      dispatch({ type: ACTIONS.ADD_DEBIT, payload: debit });
      return { success: true, debit };
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const updateDebit = async (id, updates) => {
    try {
      const debit = await debitService.updateDebit(id, updates);
      dispatch({ type: ACTIONS.UPDATE_DEBIT, payload: debit });
      return { success: true, debit };
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const deleteDebit = async (id) => {
    try {
      await debitService.deleteDebit(id);
      dispatch({ type: ACTIONS.DELETE_DEBIT, payload: id });
      return { success: true };
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const updateBalance = async (newBalance) => {
    try {
      await debitService.updateBalance(user.id, newBalance);
      dispatch({ type: ACTIONS.SET_BALANCE, payload: newBalance });
      return { success: true };
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  // Marquer comme payé
  const markAsPaid = async (debitId) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      
      const result = await debitService.markAsPaid(debitId);
      
      if (result.success) {
        await loadDebits();
        return { success: true };
      } else {
        dispatch({ type: ACTIONS.SET_ERROR, payload: result.error });
        return result;
      }
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Mettre en pause/reprendre
  const togglePause = async (debitId) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      
      const result = await debitService.togglePause(debitId);
      
      if (result.success) {
        const updatedDebit = await debitService.getDebitById(debitId);
        dispatch({ type: ACTIONS.UPDATE_DEBIT, payload: updatedDebit });
        return { success: true, isPaused: result.isPaused };
      } else {
        dispatch({ type: ACTIONS.SET_ERROR, payload: result.error });
        return result;
      }
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };

  // ← FONCTION MODIFIÉE: Calculer le solde prévisionnel avec solde réel
  const calculateProjectedBalance = (targetDate) => {
    const today = new Date();
    const target = new Date(targetDate);
    
    // Utiliser le solde réel si disponible, sinon le solde local
    let projectedBalance = state.realBalance ? state.realBalance.balance : state.balance;
    
    // Utiliser tous les prélèvements (locaux + bancaires)
    state.allDebits.forEach(debit => {
      if (debit.status === 'active' && !debit.is_paused) {
        const debitDate = new Date(debit.next_payment_date || debit.date);
        if (debitDate <= target && debitDate >= today) {
          projectedBalance -= debit.amount;
        }
      }
    });
    
    return projectedBalance;
  };

  // ← NOUVELLE FONCTION: Obtenir les prélèvements urgents (3 prochains jours)
  const getUrgentDebits = () => {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    return state.allDebits.filter(debit => {
      const debitDate = new Date(debit.next_payment_date || debit.date);
      const now = new Date();
      return debitDate <= threeDaysFromNow && debitDate >= now;
    });
  };

  // ← NOUVELLE FONCTION: Calculer le solde après prélèvements
  const calculateBalanceAfterDebits = () => {
    if (!state.realBalance) return null;
    
    const upcomingDebits = state.allDebits.filter(debit => {
      const debitDate = new Date(debit.next_payment_date || debit.date);
      return debitDate >= new Date();
    });
    
    const totalDebits = upcomingDebits.reduce((sum, debit) => sum + debit.amount, 0);
    const balanceAfter = state.realBalance.balance - totalDebits;
    
    return {
      currentBalance: state.realBalance.balance,
      totalDebits,
      balanceAfter,
      isNegative: balanceAfter < 0,
      upcomingDebitsCount: upcomingDebits.length
    };
  };

  // Obtenir les prélèvements du mois (modifié pour allDebits)
  const getMonthDebits = (month, year) => {
    return state.allDebits.filter(debit => {
      if (debit.is_paused) return false;
      const debitDate = new Date(debit.next_payment_date || debit.date);
      return debitDate.getMonth() === month && debitDate.getFullYear() === year;
    });
  };

  // Obtenir les prélèvements par catégorie (modifié pour allDebits)
  const getDebitsByCategory = () => {
    return state.allDebits.reduce((acc, debit) => {
      if (debit.is_paused) return acc;
      const category = debit.category || 'Autre';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(debit);
      return acc;
    }, {});
  };

  // Obtenir les statistiques mensuelles (modifié pour allDebits)
  const getMonthlyStats = (month, year) => {
    const monthDebits = getMonthDebits(month, year);
    const totalAmount = monthDebits.reduce((sum, debit) => sum + debit.amount, 0);
    const categorizedDebits = monthDebits.reduce((acc, debit) => {
      const category = debit.category || 'Autre';
      acc[category] = (acc[category] || 0) + debit.amount;
      return acc;
    }, {});

    return {
      totalAmount,
      count: monthDebits.length,
      categories: categorizedDebits,
      debits: monthDebits,
    };
  };

  // ← FONCTION MODIFIÉE: Refresh avec synchronisation bancaire
  const refreshDebits = async () => {
    await loadDebits();
    if (state.isBankConnected) {
      await syncWithBankingAPI();
    }
  };

  const value = {
    // États existants (modifiés)
    debits: state.allDebits, // ← Retourner allDebits pour compatibilité
    localDebits: state.localDebits,
    bankingDebits: state.bankingDebits,
    allDebits: state.allDebits,
    balance: state.balance,
    loading: state.loading,
    error: state.error,
    
    // ← NOUVEAUX ÉTATS BANCAIRES
    realBalance: state.realBalance,
    isBankConnected: state.isBankConnected,
    bankConnectionError: state.bankConnectionError,
    syncStatus: state.syncStatus,
    lastSyncDate: state.lastSyncDate,
    
    // Fonctions existantes
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
    
    // ← NOUVELLES FONCTIONS BANCAIRES
    connectToBank,
    disconnectBank,
    syncWithBankingAPI,
    getUrgentDebits,
    calculateBalanceAfterDebits,
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