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
      console.log('🔍 CONTEXT - useEffect déclenché, user:', user.id);
      loadDebits();
      loadBalance();
    } else {
      console.log('🔍 CONTEXT - Pas d\'utilisateur connecté');
    }
  }, [user]);

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
      
      // CORRECTION: Suppression de la ligne qui causait l'erreur
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
      // En cas d'erreur, on met un solde par défaut
      dispatch({ type: ACTIONS.SET_BALANCE, payload: 0 });
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
      
      // Marquer comme payé et calculer la prochaine date
      const result = await debitService.markAsPaid(debitId);
      
      if (result.success) {
        console.log('🔍 CONTEXT - Marquage réussi, rechargement...');
        // Recharger les données pour avoir les bonnes dates
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
        // Mettre à jour localement
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

  // Calculer le solde prévisionnel avec support des prélèvements récurrents
  const calculateProjectedBalance = (targetDate) => {
    const today = new Date();
    const target = new Date(targetDate);
    
    let projectedBalance = state.balance;
    
    console.log('🔍 CONTEXT - Calcul projection depuis:', today, 'vers:', target);
    console.log('🔍 CONTEXT - Solde initial:', projectedBalance);
    
    state.debits.forEach(debit => {
      if (debit.status === 'active' && !debit.is_paused) {
        const debitDate = new Date(debit.next_payment_date);
        if (debitDate <= target && debitDate >= today) {
          projectedBalance -= debit.amount;
          console.log('🔍 CONTEXT - Déduction:', debit.company_name, debit.amount);
        }
      }
    });
    
    console.log('🔍 CONTEXT - Solde projeté:', projectedBalance);
    return projectedBalance;
  };

  // Obtenir les prélèvements du mois
  const getMonthDebits = (month, year) => {
    const monthDebits = state.debits.filter(debit => {
      if (debit.is_paused) return false;
      const debitDate = new Date(debit.next_payment_date);
      return debitDate.getMonth() === month && debitDate.getFullYear() === year;
    });
    
    console.log('🔍 CONTEXT - Prélèvements du mois', month + 1, '/', year, ':', monthDebits.length);
    return monthDebits;
  };

  // Obtenir les prélèvements par catégorie
  const getDebitsByCategory = () => {
    const byCategory = state.debits.reduce((acc, debit) => {
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

  // Fonction de debug pour vérifier l'état
  const debugState = () => {
    console.log('🔍 CONTEXT - État actuel:', {
      debitsCount: state.debits.length,
      balance: state.balance,
      loading: state.loading,
      error: state.error,
      user: user?.id || 'Non connecté',
    });
    
    if (state.debits.length > 0) {
      console.log('🔍 CONTEXT - Premier prélèvement:', state.debits[0]);
    }
  };

  // Fonction de rafraîchissement forcé
  const forceRefresh = async () => {
    console.log('🔍 CONTEXT - Rafraîchissement forcé...');
    if (user) {
      await loadDebits();
      await loadBalance();
    }
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
    
    // Fonctions de debug (à retirer en production)
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