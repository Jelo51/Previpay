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
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useDebits } from '../context/DebitContext';
import { useAuth } from '../context/AuthContext';
import BalanceCard from '../components/BalanceCard';
import DebitCard from '../components/DebitCard';
import QuickStats from '../components/QuickStats';

const HomeScreen = ({ navigation }) => {
  const { t } = useTranslation();
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

  const getUpcomingDebits = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return debits
      .filter(debit => {
        const debitDate = new Date(debit.nextPaymentDate);
        return debitDate >= today && debitDate <= nextWeek && debit.status === 'active';
      })
      .sort((a, b) => new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate))
      .slice(0, 5);
  };

  const projectedBalance = calculateProjectedBalance(
    new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000) // 30 jours
  );

  const upcomingDebits = getUpcomingDebits();

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
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.colors.text }}>{t('common.loading')}</Text>
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Bonjour {user?.name || 'Utilisateur'} 👋
        </Text>
        <Text style={styles.subtitle}>
          Voici un aperçu de vos prélèvements
        </Text>
      </View>

      {/* Balance Card */}
      <BalanceCard
        currentBalance={balance}
        projectedBalance={projectedBalance}
        onUpdateBalance={() => {
          Alert.prompt(
            'Mettre à jour le solde',
            'Entrez votre nouveau solde',
            [
              { text: 'Annuler', style: 'cancel' },
              {
                text: 'Sauvegarder',
                onPress: (value) => {
                  const newBalance = parseFloat(value);
                  if (!isNaN(newBalance)) {
                    // updateBalance(newBalance);
                  }
                }
              }
            ],
            'plain-text',
            balance.toString()
          );
        }}
      />

      {/* Quick Stats */}
      {monthlyStats && (
        <QuickStats
          stats={monthlyStats}
          onViewDetails={() => navigation.navigate('Statistics')}
        />
      )}

      {/* Upcoming Debits */}
      <View style={styles.upcomingContainer}>
        <Text style={styles.sectionTitle}>
          {t('dashboard.nextDebits')}
        </Text>

        {upcomingDebits.length > 0 ? (
          <>
            {upcomingDebits.map((debit) => (
              <DebitCard
                key={debit.id}
                debit={debit}
                onPress={() => navigation.navigate('DebitDetails', { debit })}
                compact
              />
            ))}
            
            {debits.length > upcomingDebits.length && (
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => navigation.navigate('Calendar')}
              >
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
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="calendar-outline"
              size={48}
              color={theme.colors.textSecondary}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>
              {debits.length === 0 ? t('dashboard.addFirstDebit') : 'Aucun prélèvement à venir'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {debits.length === 0 
                ? 'Commencez par ajouter vos abonnements et prélèvements récurrents'
                : 'Tous vos prélèvements sont à jour pour la semaine'
              }
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('Add')}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>
                {t('debits.addDebit')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default HomeScreen;