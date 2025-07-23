import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { debitService } from '../services/database';
import { useAuth } from './AuthContext';

const DebitContext = createContext();

// Actions
const ACTIONS = {
  SET_DEBITS: 'SET_DEBITS',
  ADD_DEBIT: 'ADD_DEBIT',
  UPDATE_DEBIT: 'UPDATE_DEBIT',
  DELETE_DEBIT: 'DELETE_DEBIT',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_BALANCE: 'SET_BALANCE',
};

// Reducer
const debitReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_DEBITS:
      return { ...state, debits: action.payload, loading: false };
    case ACTIONS.ADD_DEBIT:
      return { ...state, debits: [...state.debits, action.payload] };
    case ACTIONS.UPDATE_DEBIT:
      return {
        ...state,
        debits: state.debits.map(debit =>
          debit.id === action.payload.id ? action.payload : debit
        ),
      };
    case ACTIONS.DELETE_DEBIT:
      return {
        ...state,
        debits: state.debits.filter(debit => debit.id !== action.payload),
      };
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case ACTIONS.SET_BALANCE:
      return { ...state, balance: action.payload };
    default:
      return state;
  }
};

// État initial
const initialState = {
  debits: [],
  balance: 0,
  loading: false,
  error: null,
};

export const DebitProvider = ({ children }) => {
  const [state, dispatch] = useReducer(debitReducer, initialState);
  const { user } = useAuth();

  // Charger les prélèvements au démarrage
  useEffect(() => {
    if (user) {
      loadDebits();
      loadBalance();
    }
  }, [user]);

  const loadDebits = async () => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
          console.log('🔍 CONTEXT - Début chargement, user.id:', user.id); // ← NOUVEAU DEBUG

      const debits = await debitService.getAllDebits(user.id);
          console.log('🔍 CONTEXT - Tout en base:', allInDB); // ← NOUVEAU DEBUG

      dispatch({ type: ACTIONS.SET_DEBITS, payload: debits });
    } catch (error) {
          console.log('🔍 CONTEXT - Erreur chargement:', error); // ← NOUVEAU DEBUG

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
      
      // Marquer comme payé et calculer la prochaine date
      const result = await debitService.markAsPaid(debitId);
      
      if (result.success) {
        // Recharger les données pour avoir les bonnes dates
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
        // Mettre à jour localement
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

  // Calculer le solde prévisionnel
  const calculateProjectedBalance = (targetDate) => {
    const today = new Date();
    const target = new Date(targetDate);
    
    let projectedBalance = state.balance;
    
    state.debits.forEach(debit => {
      if (debit.status === 'active' && !debit.is_paused) {
        const debitDate = new Date(debit.next_payment_date);
        if (debitDate <= target && debitDate >= today) {
          projectedBalance -= debit.amount;
        }
      }
    });
    
    return projectedBalance;
  };

  // Obtenir les prélèvements du mois
  const getMonthDebits = (month, year) => {
    return state.debits.filter(debit => {
      if (debit.is_paused) return false;
      const debitDate = new Date(debit.next_payment_date);
      return debitDate.getMonth() === month && debitDate.getFullYear() === year;
    });
  };

  // Obtenir les prélèvements par catégorie
  const getDebitsByCategory = () => {
    return state.debits.reduce((acc, debit) => {
      if (debit.is_paused) return acc;
      const category = debit.category || 'Autre';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(debit);
      return acc;
    }, {});
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

    return {
      totalAmount,
      count: monthDebits.length,
      categories: categorizedDebits,
      debits: monthDebits,
    };
  };

  const value = {
    ...state,
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
    refreshDebits: loadDebits,
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