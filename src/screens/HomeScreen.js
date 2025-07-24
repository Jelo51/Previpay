import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useDebits } from '../context/DebitContext';
import { useAuth } from '../context/AuthContext';
import BalanceCard from '../components/BalanceCard';
import DebitCard from '../components/DebitCard';
import QuickStats from '../components/QuickStats';

const HomeScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const {
    debits,
    balance,
    loading,
    refreshDebits,
    getMonthlyStats,
    calculateProjectedBalance
  } = useDebits();

  const [refreshing, setRefreshing] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState(null);

  useEffect(() => {
    loadMonthlyData();
  }, [debits]);

  const loadMonthlyData = () => {
    const now = new Date();
    const stats = getMonthlyStats(now.getMonth(), now.getFullYear());
    setMonthlyStats(stats);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshDebits();
    setRefreshing(false);
  };

  const getRecurringDatesForDebit = (debit) => {
    const dates = [];
    const startDate = new Date(debit.next_payment_date || debit.nextPaymentDate);
    const today = new Date();
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 3);
    let currentDate = new Date(startDate);

    if (debit.frequency === 'once') {
      if (currentDate >= today && currentDate <= endDate) {
        dates.push(formatDateString(currentDate));
      }
      return dates;
    }

    while (currentDate <= endDate) {
      if (currentDate >= today) {
        dates.push(formatDateString(currentDate));
      }

      const nextDate = new Date(currentDate);
      switch (debit.frequency) {
        case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
        case 'biweekly': nextDate.setDate(nextDate.getDate() + 14); break;
        case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
        case 'quarterly': nextDate.setMonth(nextDate.getMonth() + 3); break;
        case 'biannual': nextDate.setMonth(nextDate.getMonth() + 6); break;
        case 'annual': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
        default: break;
      }

      currentDate = nextDate;
      if (dates.length > 20) break;
    }

    return dates;
  };

  const formatDateString = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getUpcomingDebits = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingDebitsWithDates = [];

    debits.forEach(debit => {
      if (debit.status === 'active') {
        const recurringDates = getRecurringDatesForDebit(debit);
        recurringDates.forEach(dateStr => {
          const date = new Date(dateStr);
          if (date >= today && date <= nextWeek) {
            upcomingDebitsWithDates.push({
              ...debit,
              actualPaymentDate: dateStr,
            });
          }
        });
      }
    });

    return upcomingDebitsWithDates
      .sort((a, b) => {
        if (a.is_paused && !b.is_paused) return 1;
        if (!a.is_paused && b.is_paused) return -1;
        return new Date(a.actualPaymentDate) - new Date(b.actualPaymentDate);
      })
      .slice(0, 5);
  };

  const mapDebitForDisplay = (debit) => ({
    ...debit,
    companyName: debit.company_name || debit.companyName || 'Entreprise inconnue',
    nextPaymentDate: debit.actualPaymentDate || debit.next_payment_date || debit.nextPaymentDate || new Date().toISOString(),
    amount: debit.amount || 0,
    category: debit.category || 'Autre',
    is_paused: debit.is_paused || false,
  });

  const projectedBalance = calculateProjectedBalance(
    new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)
  );

  const upcomingDebits = getUpcomingDebits();
  const mappedUpcomingDebits = upcomingDebits.map(mapDebitForDisplay);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: 16,
    },
    header: {
      marginBottom: 20,
    },
    greeting: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: 24,
      marginBottom: 12,
    },
    upcomingContainer: {
      marginTop: 20,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginTop: 20,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    addButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    addButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      marginLeft: 8,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      marginTop: 12,
    },
    viewAllText: {
      color: theme.colors.primary,
      fontWeight: '600',
      marginRight: 4,
    },
    pausedNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      marginTop: 8,
      backgroundColor: `${theme.colors.warning}20`,
      borderRadius: 8,
    },
    pausedNoticeText: {
      fontSize: 14,
      color: theme.colors.warning,
      fontWeight: '500',
      marginLeft: 6,
    },
    loadingText: {
      color: theme.colors.text,
      fontSize: 16,
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* ✅ CORRECTION: Utiliser <Text> au lieu de <View> */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Bonjour {user?.name || 'Utilisateur'}
        </Text>
        <Text style={styles.subtitle}>
          Voici un aperçu de vos prélèvements
        </Text>
      </View>

      <BalanceCard
        currentBalance={balance}
        projectedBalance={projectedBalance}
      />

      {monthlyStats && (
        <QuickStats
          stats={monthlyStats}
          onViewDetails={() => navigation.navigate('Statistics')}
        />
      )}

      <View style={styles.upcomingContainer}>
        {/*  CORRECTION: Utiliser <Text> au lieu de <View> */}
        <Text style={styles.sectionTitle}>
          Prochains prélèvements
        </Text>

        {mappedUpcomingDebits.length > 0 ? (
          <>
            {mappedUpcomingDebits.map((debit) => (
              <DebitCard
                key={`${debit.id}-${debit.actualPaymentDate}`}
                debit={debit}
                onPress={() => navigation.navigate('DebitDetails', { debit })}
                compact
              />
            ))}

            {debits.length > mappedUpcomingDebits.length && (
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => navigation.navigate('Calendar')}
              >
                {/*  CORRECTION: Utiliser <Text> au lieu de <View> */}
                <Text style={styles.viewAllText}>
                  Voir tous les prélèvements
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            )}

            {debits.filter(d => d.is_paused).length > 0 && (
              <View style={styles.pausedNotice}>
                <Ionicons name="pause-circle" size={16} color={theme.colors.warning} />
                {/*  CORRECTION: Utiliser <Text> au lieu de <View> */}
                <Text style={styles.pausedNoticeText}>
                  {debits.filter(d => d.is_paused).length} prélèvement(s) en pause
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="calendar-outline"
              size={48}
              color={theme.colors.textSecondary}
              style={styles.emptyIcon}
            />
            {/* ✅ CORRECTION: Utiliser <Text> au lieu de <View> */}
            <Text style={styles.emptyTitle}>
              {debits.length === 0 ? 'Ajouter votre premier prélèvement' : 'Aucun prélèvement à venir'}
            </Text>
            {/* ✅ CORRECTION: Utiliser <Text> au lieu de <View> */}
            <Text style={styles.emptySubtitle}>
              {debits.length === 0
                ? 'Commencez par ajouter vos abonnements et prélèvements récurrents'
                : debits.filter(d => d.is_paused).length > 0
                  ? `${debits.filter(d => d.is_paused).length} prélèvement(s) en pause. Consultez le calendrier pour les gérer.`
                  : 'Tous vos prélèvements sont à jour pour la semaine'
              }
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('Add')}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              {/* ✅ CORRECTION: Utiliser <Text> au lieu de <View> */}
              <Text style={styles.addButtonText}>
                Ajouter un prélèvement
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default HomeScreen;