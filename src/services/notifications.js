import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const initializeNotifications = async () => {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Permission de notification non accordée');
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des notifications:', error);
  }
};

export const NotificationService = {
  async schedulePaymentReminder(payment, daysBeforeMin = 1) {
    try {
      const paymentDate = new Date(payment.date);
      const notificationDate = new Date(paymentDate);
      notificationDate.setDate(paymentDate.getDate() - daysBeforeMin);

      if (notificationDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Prélèvement à venir',
            body: `${payment.companyName} : ${payment.amount}€ dans ${daysBeforeMin} jour(s)`,
            data: { paymentId: payment.id },
          },
          trigger: {
            date: notificationDate,
          },
        });
      }
    } catch (error) {
      console.error('Erreur lors de la programmation de la notification:', error);
    }
  },

  async scheduleBalanceAlert(balance, upcomingPayments) {
    try {
      const totalUpcoming = upcomingPayments.reduce((sum, payment) => sum + payment.amount, 0);
      
      if (balance < totalUpcoming) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Alerte solde insuffisant',
            body: `Attention : solde insuffisant pour les prélèvements à venir (${totalUpcoming}€)`,
            data: { type: 'balance_alert' },
          },
          trigger: {
            seconds: 1,
          },
        });
      }
    } catch (error) {
      console.error('Erreur lors de la programmation de l\'alerte solde:', error);
    }
  },

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Erreur lors de l\'annulation des notifications:', error);
    }
  },
};