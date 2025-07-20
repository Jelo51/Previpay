import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const NotificationProvider = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: true,
    reminderDays: 1, // Rappel X jours avant
    dailyReminder: true,
    lowBalanceAlert: true,
    balanceThreshold: 100,
  });
  const { user } = useAuth();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    // Écouter les notifications reçues
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // Écouter les réponses aux notifications
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    // Charger les paramètres de notification
    if (user) {
      loadNotificationSettings();
    }

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, [user]);

  const registerForPushNotificationsAsync = async () => {
    let token;
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Échec de l\'obtention du token de push notification!');
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
    } else {
      alert('Doit utiliser un appareil physique pour les notifications push');
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  };

  const loadNotificationSettings = async () => {
    try {
      const settings = await notificationService.getNotificationSettings(user.id);
      if (settings) {
        setNotificationSettings(settings);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    }
  };

  const updateNotificationSettings = async (newSettings) => {
    try {
      const updatedSettings = { ...notificationSettings, ...newSettings };
      await notificationService.saveNotificationSettings(user.id, updatedSettings);
      setNotificationSettings(updatedSettings);
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
      return { success: false, error: error.message };
    }
  };

  const scheduleDebitNotification = async (debit) => {
    if (!notificationSettings.enabled) return;

    try {
      const debitDate = new Date(debit.nextPaymentDate);
      const reminderDate = new Date(debitDate);
      reminderDate.setDate(reminderDate.getDate() - notificationSettings.reminderDays);

      // Vérifier si la date de rappel est dans le futur
      if (reminderDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '💳 Prélèvement à venir',
            body: `${debit.companyName} - ${debit.amount}€ sera prélevé le ${debitDate.toLocaleDateString()}`,
            data: { debitId: debit.id },
          },
          trigger: reminderDate,
          identifier: `debit-${debit.id}`,
        });
      }

      // Notification le jour J
      if (debitDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🚨 Prélèvement aujourd\'hui',
            body: `${debit.companyName} - ${debit.amount}€`,
            data: { debitId: debit.id },
          },
          trigger: debitDate,
          identifier: `debit-today-${debit.id}`,
        });
      }
    } catch (error) {
      console.error('Erreur lors de la programmation de notification:', error);
    }
  };

  const cancelDebitNotification = async (debitId) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(`debit-${debitId}`);
      await Notifications.cancelScheduledNotificationAsync(`debit-today-${debitId}`);
    } catch (error) {
      console.error('Erreur lors de l\'annulation de notification:', error);
    }
  };

  const scheduleLowBalanceAlert = async (currentBalance, projectedBalance) => {
    if (!notificationSettings.enabled || !notificationSettings.lowBalanceAlert) return;

    if (projectedBalance < notificationSettings.balanceThreshold) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '⚠️ Solde insuffisant',
            body: `Votre solde prévisionnel (${projectedBalance.toFixed(2)}€) est inférieur au seuil configuré`,
            data: { type: 'low-balance' },
          },
          trigger: null, // Immédiat
        });
      } catch (error) {
        console.error('Erreur lors de l\'alerte de solde:', error);
      }
    }
  };

  const sendTestNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📱 Test PréviPay',
          body: 'Les notifications fonctionnent correctement !',
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Erreur lors du test de notification:', error);
    }
  };

  const scheduleDailyReminder = async () => {
    if (!notificationSettings.enabled || !notificationSettings.dailyReminder) return;

    try {
      await Notifications.cancelScheduledNotificationAsync('daily-reminder');
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📊 PréviPay - Rappel quotidien',
          body: 'Consultez vos prélèvements du jour',
          data: { type: 'daily-reminder' },
        },
        trigger: {
          hour: 9,
          minute: 0,
          repeats: true,
        },
        identifier: 'daily-reminder',
      });
    } catch (error) {
      console.error('Erreur lors du rappel quotidien:', error);
    }
  };

  const cancelAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Erreur lors de l\'annulation des notifications:', error);
    }
  };

  const value = {
    expoPushToken,
    notification,
    notificationSettings,
    updateNotificationSettings,
    scheduleDebitNotification,
    cancelDebitNotification,
    scheduleLowBalanceAlert,
    sendTestNotification,
    scheduleDailyReminder,
    cancelAllNotifications,
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