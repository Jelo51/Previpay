import React, { createContext, useContext, useState, useEffect } from 'react';
import { DatabaseService } from '../services/database';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [payments, setPayments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [paymentsData, companiesData, balanceData] = await Promise.all([
        DatabaseService.getPayments(),
        DatabaseService.getCompanies(),
        DatabaseService.getBalance(),
      ]);
      
      setPayments(paymentsData);
      setCompanies(companiesData);
      setBalance(balanceData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPayment = async (paymentData) => {
    try {
      const newPayment = await DatabaseService.addPayment(paymentData);
      setPayments(prev => [...prev, newPayment]);
      return newPayment;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du prélèvement:', error);
      throw error;
    }
  };

  const updatePayment = async (id, paymentData) => {
    try {
      const updatedPayment = await DatabaseService.updatePayment(id, paymentData);
      setPayments(prev => prev.map(p => p.id === id ? updatedPayment : p));
      return updatedPayment;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du prélèvement:', error);
      throw error;
    }
  };

  const deletePayment = async (id) => {
    try {
      await DatabaseService.deletePayment(id);
      setPayments(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression du prélèvement:', error);
      throw error;
    }
  };

  const updateBalance = async (newBalance) => {
    try {
      await DatabaseService.updateBalance(newBalance);
      setBalance(newBalance);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du solde:', error);
      throw error;
    }
  };

  const value = {
    payments,
    companies,
    balance,
    loading,
    addPayment,
    updatePayment,
    deletePayment,
    updateBalance,
    refreshData: loadData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};