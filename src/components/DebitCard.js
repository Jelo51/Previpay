import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { catalogService } from '../services/catalogService';

const DebitCard = ({ 
  debit, 
  onPress, 
  compact = false, 
  showDate = true 
}) => {
  const { theme } = useTheme();

  // ✅ DEBUG: Afficher les données reçues
  console.log('🔍 DEBUG DebitCard - Données reçues:', {
    debit: debit,
    companyName: debit?.companyName || debit?.company_name,
    amount: debit?.amount,
    category: debit?.category,
    is_paused: debit?.is_paused,
    nextPaymentDate: debit?.nextPaymentDate || debit?.next_payment_date
  });

  // ✅ CORRECTION: Vérification stricte des données
  if (!debit) {
    console.warn('⚠️ DebitCard: Pas de données de prélèvement');
    return null;
  }

  // ✅ CORRECTION: Sécurisation complète des valeurs
  const safeDebit = {
    id: debit.id || 'unknown',
    companyName: debit.companyName || debit.company_name || 'Entreprise inconnue',
    amount: typeof debit.amount === 'number' ? debit.amount : 0,
    category: debit.category || 'Autre',
    nextPaymentDate: debit.nextPaymentDate || debit.next_payment_date || new Date().toISOString(),
    is_paused: Boolean(debit.is_paused),
    description: debit.description || '',
    frequency: debit.frequency || 'monthly',
    status: debit.status || 'active'
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date non définie";
    
    try {
      const date = new Date(dateString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (date.toDateString() === today.toDateString()) {
        return "Aujourd'hui";
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return "Demain";
      } else {
        return date.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short'
        });
      }
    } catch (error) {
      console.error('Erreur formatage date:', error);
      return "Date invalide";
    }
  };

  const getDaysUntilPayment = () => {
    if (!safeDebit.nextPaymentDate) return 0;
    
    try {
      const today = new Date();
      const paymentDate = new Date(safeDebit.nextPaymentDate);
      const diffTime = paymentDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      console.error('Erreur calcul jours:', error);
      return 0;
    }
  };

  const daysUntil = getDaysUntilPayment();
  const isOverdue = daysUntil < 0;
  const isToday = daysUntil === 0;
  const isSoon = daysUntil <= 3 && daysUntil > 0;

  const getStatusColor = () => {
    if (safeDebit.is_paused) return theme?.colors?.warning || '#FF9500';
    if (isOverdue) return theme?.colors?.error || '#FF3B30';
    if (isToday) return theme?.colors?.warning || '#FF9500';
    if (isSoon) return theme?.colors?.warning || '#FF9500';
    return theme?.colors?.primary || '#007AFF';
  };

  const getCategoryIcon = () => {
    try {
      return catalogService?.getCategoryIcon?.(safeDebit.category) || 'business-outline';
    } catch (error) {
      console.error('Erreur getCategoryIcon:', error);
      return 'business-outline';
    }
  };

  const getCategoryColor = () => {
    try {
      return catalogService?.getCategoryColor?.(safeDebit.category) || theme?.colors?.primary || '#007AFF';
    } catch (error) {
      console.error('Erreur getCategoryColor:', error);
      return theme?.colors?.primary || '#007AFF';
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme?.colors?.surface || '#FFFFFF',
      borderRadius: compact ? 12 : 16,
      padding: compact ? 12 : 16,
      marginBottom: compact ? 8 : 12,
      elevation: 2,
      shadowColor: theme?.colors?.shadow || '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      borderLeftWidth: 4,
      borderLeftColor: getStatusColor(),
      opacity: safeDebit.is_paused ? 0.7 : 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: compact ? 6 : 8,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    categoryIcon: {
      width: compact ? 32 : 40,
      height: compact ? 32 : 40,
      borderRadius: compact ? 16 : 20,
      backgroundColor: `${getCategoryColor()}20`,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      opacity: safeDebit.is_paused ? 0.6 : 1,
    },
    companyInfo: {
      flex: 1,
    },
    companyName: {
      fontSize: compact ? 14 : 16,
      fontWeight: '600',
      color: safeDebit.is_paused ? (theme?.colors?.textSecondary || '#8E8E93') : (theme?.colors?.text || '#000000'),
      marginBottom: 2,
    },
    category: {
      fontSize: compact ? 12 : 13,
      color: theme?.colors?.textSecondary || '#8E8E93',
    },
    amount: {
      fontSize: compact ? 16 : 18,
      fontWeight: 'bold',
      color: safeDebit.is_paused ? (theme?.colors?.textSecondary || '#8E8E93') : (theme?.colors?.text || '#000000'),
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dateText: {
      fontSize: compact ? 12 : 13,
      color: getStatusColor(),
      fontWeight: '500',
      marginLeft: 4,
    },
    statusBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: `${getStatusColor()}20`,
    },
    statusText: {
      fontSize: 10,
      color: getStatusColor(),
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    description: {
      fontSize: 12,
      color: theme?.colors?.textSecondary || '#8E8E93',
      marginTop: 4,
      fontStyle: 'italic',
    },
    pauseIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      backgroundColor: `${theme?.colors?.warning || '#FF9500'}20`,
      borderRadius: 4,
      alignSelf: 'flex-start',
    },
    pauseText: {
      fontSize: 10,
      color: theme?.colors?.warning || '#FF9500',
      fontWeight: '600',
      marginLeft: 4,
    },
  });

  // ✅ CORRECTION: Gestion sécurisée de l'onPress
  const handlePress = () => {
    if (typeof onPress === 'function') {
      onPress();
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <View style={styles.categoryIcon}>
            <Ionicons
              name={getCategoryIcon()}
              size={compact ? 16 : 20}
              color={getCategoryColor()}
            />
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName} numberOfLines={1}>
              {safeDebit.companyName}
            </Text>
            <Text style={styles.category}>
              {safeDebit.category}
            </Text>
            {safeDebit.is_paused && (
              <View style={styles.pauseIndicator}>
                <Ionicons 
                  name="pause-circle" 
                  size={12} 
                  color={theme?.colors?.warning || '#FF9500'} 
                />
                <Text style={styles.pauseText}>EN PAUSE</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.amount}>
          {safeDebit.amount.toFixed(2)}€
        </Text>
      </View>

      {showDate && (
        <View style={styles.footer}>
          <View style={styles.dateContainer}>
            <Ionicons
              name="calendar-outline"
              size={compact ? 12 : 14}
              color={getStatusColor()}
            />
            <Text style={styles.dateText}>
              {safeDebit.is_paused ? 'En pause' : formatDate(safeDebit.nextPaymentDate)}
            </Text>
          </View>
          
          {safeDebit.is_paused ? (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>PAUSE</Text>
            </View>
          ) : (
            (isOverdue || isToday || isSoon) && (
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {isOverdue ? 'En retard' : isToday ? 'Aujourd\'hui' : 'Bientôt'}
                </Text>
              </View>
            )
          )}
        </View>
      )}

      {safeDebit.description && !compact && safeDebit.description.length > 0 && (
        <Text style={styles.description} numberOfLines={2}>
          {safeDebit.description}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default DebitCard;