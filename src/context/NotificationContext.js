import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: true,
    reminderDays: 1,
    dailyReminder: false,
    lowBalanceAlert: false,
    balanceThreshold: 100,
  });

  // Initialiser les notifications
  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'PréviPay',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permission de notification non accordée');
        setNotificationSettings(prev => ({ ...prev, enabled: false }));
      }

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    } catch (error) {
      console.error('Erreur initialisation notifications:', error);
    }
  };

  // VRAIES fonctions de notification
  const scheduleDebitNotification = async (debit) => {
    try {
      if (!notificationSettings.enabled) return { success: false };

      const paymentDate = new Date(debit.next_payment_date || debit.nextPaymentDate);
      let notificationDate = new Date(paymentDate); // ← CORRECTION: let au lieu de const
      notificationDate.setDate(paymentDate.getDate() - notificationSettings.reminderDays);

      if (notificationDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Prélèvement à venir',
            body: `${debit.company_name || debit.companyName} : ${debit.amount}€ dans ${notificationSettings.reminderDays} jour(s)`,
            data: { debitId: debit.id },
          },
          trigger: {
            date: notificationDate,
          },
        });

        console.log('Notification programmée pour:', debit.company_name, 'le', notificationDate);
        return { success: true };
      }
      
      return { success: false, reason: 'Date passée' };
    } catch (error) { // ← CORRECTION: catch ajouté
      console.error('Erreur programmation notification:', error);
      return { success: false, error: error.message };
    }
  };

  const cancelDebitNotification = async (debitId) => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Notifications annulées');
      return { success: true };
    } catch (error) {
      console.error('Erreur annulation notification:', error);
      return { success: false, error: error.message };
    }
  };

  const scheduleLowBalanceAlert = async (currentBalance, projectedBalance) => {
    try {
      if (!notificationSettings.enabled || !notificationSettings.lowBalanceAlert) return;

      if (projectedBalance < notificationSettings.balanceThreshold) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Alerte solde faible',
            body: `Attention : votre solde prévisionnel (${projectedBalance.toFixed(2)}€) est en dessous du seuil critique`,
            data: { type: 'balance_alert' },
          },
          trigger: {
            seconds: 2,
          },
        });
      }
    } catch (error) {
      console.error('Erreur alerte solde:', error);
    }
  };

  const sendTestNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test PréviPay',
          body: 'Les notifications fonctionnent correctement !',
          data: { type: 'test' },
        },
        trigger: {
          seconds: 1,
        },
      });
      console.log('Notification de test envoyée');
    } catch (error) {
      console.error('Erreur test notification:', error);
      alert('Erreur lors du test de notification');
    }
  };

  // Fonctions de test pour développement
  const testAllNotifications = async () => {
    try {
      // Prélèvement (dans 3 secondes)
      setTimeout(async () => {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Test - Prélèvement à venir',
            body: 'Netflix : 15.99€ dans 1 jour(s)',
            data: { type: 'debit_test' },
          },
          trigger: { seconds: 1 },
        });
      }, 3000);

      // Solde faible (dans 6 secondes)
      setTimeout(async () => {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Test - Alerte solde faible',
            body: 'Attention : solde prévisionnel (-50.00€) critique',
            data: { type: 'balance_test' },
          },
          trigger: { seconds: 1 },
        });
      }, 6000);

      // Rappel quotidien (dans 9 secondes)
      setTimeout(async () => {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Test - Rappel quotidien',
            body: 'Vérifiez vos prochains prélèvements !',
            data: { type: 'daily_test' },
          },
          trigger: { seconds: 1 },
        });
      }, 9000);

      console.log('Tests programmés : 3 notifications dans 3-6-9 secondes');
    } catch (error) {
      console.error('Erreur tests notifications:', error);
    }
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
    testAllNotifications, // ← Fonction de test ajoutée
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