import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const BalanceCard = ({ currentBalance, projectedBalance, onUpdateBalance }) => {
  const { theme } = useTheme();

  const isProjectedNegative = projectedBalance < 0;
  const projectedDifference = projectedBalance - currentBalance;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      elevation: 3,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    balanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    balanceLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    balanceAmount: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    projectedAmount: {
      fontSize: 18,
      fontWeight: '600',
      color: isProjectedNegative ? theme.colors.error : theme.colors.success,
    },
    differenceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
      padding: 8,
      borderRadius: 8,
      backgroundColor: isProjectedNegative 
        ? `${theme.colors.error}15` 
        : `${theme.colors.success}15`,
    },
    differenceText: {
      fontSize: 14,
      fontWeight: '500',
      color: isProjectedNegative ? theme.colors.error : theme.colors.success,
      marginLeft: 4,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 12,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💰 Mon solde</Text>
      </View>

      <View style={styles.balanceRow}>
        <Text style={styles.balanceLabel}>Solde actuel</Text>
        <Text style={styles.balanceAmount}>
          {currentBalance.toFixed(2)}€
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.balanceRow}>
        <Text style={styles.balanceLabel}>Solde prévisionnel (30j)</Text>
        <Text style={styles.projectedAmount}>
          {projectedBalance.toFixed(2)}€
        </Text>
      </View>

      <View style={styles.differenceContainer}>
        <Ionicons
          name={projectedDifference >= 0 ? "trending-up" : "trending-down"}
          size={16}
          color={isProjectedNegative ? theme.colors.error : theme.colors.success}
        />
        <Text style={styles.differenceText}>
          {projectedDifference >= 0 ? '+' : ''}
          {projectedDifference.toFixed(2)}€ après prélèvements
        </Text>
      </View>
    </View>
  );
};

export default BalanceCard;