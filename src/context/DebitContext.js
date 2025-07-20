import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { debitService } from '../services/debitService';
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
      const debits = await debitService.getAllDebits(user.id);
      dispatch({ type: ACTIONS.SET_DEBITS, payload: debits });
    } catch (error) {
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

  // Calculer le solde prévisionnel
  const calculateProjectedBalance = (targetDate) => {
    const today = new Date();
    const target = new Date(targetDate);
    
    let projectedBalance = state.balance;
    
    state.debits.forEach(debit => {
      if (debit.status === 'active') {
        const debitDate = new Date(debit.nextPaymentDate);
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
      const debitDate = new Date(debit.nextPaymentDate);
      return debitDate.getMonth() === month && debitDate.getFullYear() === year;
    });
  };

  // Obtenir les prélèvements par catégorie
  const getDebitsByCategory = () => {
    return state.debits.reduce((acc, debit) => {
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