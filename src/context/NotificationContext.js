import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: false, // Désactivé par défaut dans Expo Go
    reminderDays: 1,
    dailyReminder: false,
    lowBalanceAlert: false,
    balanceThreshold: 100,
  });

  // Fonctions simulées pour Expo Go
  const scheduleDebitNotification = async (debit) => {
    console.log('Notification simulée pour:', debit.companyName);
    return { success: true };
  };

  const cancelDebitNotification = async (debitId) => {
    console.log('Annulation notification simulée pour:', debitId);
    return { success: true };
  };

  const scheduleLowBalanceAlert = async (currentBalance, projectedBalance) => {
    console.log('Alerte solde simulée:', projectedBalance);
  };

  const sendTestNotification = async () => {
    console.log('Test notification - Mode Expo Go');
    alert('Test de notification\n(Notifications désactivées dans Expo Go)');
  };

  const updateNotificationSettings = async (newSettings) => {
    setNotificationSettings(prev => ({ ...prev, ...newSettings }));
    return { success: true };
  };

  const value = {
    notificationSettings,
    updateNotificationSettings,
    scheduleDebitNotification,
    cancelDebitNotification,
    scheduleLowBalanceAlert,
    sendTestNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationProvider;