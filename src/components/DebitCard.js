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

  const formatDate = (dateString) => {
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
  };

  const getDaysUntilPayment = () => {
    const today = new Date();
    const paymentDate = new Date(debit.nextPaymentDate);
    const diffTime = paymentDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntil = getDaysUntilPayment();
  const isOverdue = daysUntil < 0;
  const isToday = daysUntil === 0;
  const isSoon = daysUntil <= 3 && daysUntil > 0;

  const getStatusColor = () => {
    if (isOverdue) return theme.colors.error;
    if (isToday) return theme.colors.warning;
    if (isSoon) return theme.colors.warning;
    return theme.colors.primary;
  };

  const getCategoryIcon = () => {
    return catalogService.getCategoryIcon(debit.category);
  };

  const getCategoryColor = () => {
    return catalogService.getCategoryColor(debit.category);
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: compact ? 12 : 16,
      padding: compact ? 12 : 16,
      marginBottom: compact ? 8 : 12,
      elevation: 2,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      borderLeftWidth: 4,
      borderLeftColor: getStatusColor(),
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
    },
    companyInfo: {
      flex: 1,
    },
    companyName: {
      fontSize: compact ? 14 : 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    category: {
      fontSize: compact ? 12 : 13,
      color: theme.colors.textSecondary,
    },
    amount: {
      fontSize: compact ? 16 : 18,
      fontWeight: 'bold',
      color: theme.colors.text,
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
      color: theme.colors.textSecondary,
      marginTop: 4,
      fontStyle: 'italic',
    },
  });

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
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
              {debit.companyName}
            </Text>
            <Text style={styles.category}>
              {debit.category}
            </Text>
          </View>
        </View>
        <Text style={styles.amount}>
          {debit.amount.toFixed(2)}€
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
              {formatDate(debit.nextPaymentDate)}
            </Text>
          </View>
          
          {(isOverdue || isToday || isSoon) && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {isOverdue ? 'En retard' : isToday ? 'Aujourd\'hui' : 'Bientôt'}
              </Text>
            </View>
          )}
        </View>
      )}

      {debit.description && !compact && (
        <Text style={styles.description} numberOfLines={2}>
          {debit.description}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default DebitCard;