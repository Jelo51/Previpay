import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { formatDate, formatCurrency } from '../utils/dateUtils';

const PaymentCard = ({ payment, onPress, onEdit, onDelete }) => {
  const { colors } = useTheme();

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'paused':
        return colors.textSecondary;
      default:
        return colors.primary;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(payment.status) }]} />
          <View style={styles.info}>
            <Text style={[styles.companyName, { color: colors.text }]}>{payment.companyName}</Text>
            <Text style={[styles.date, { color: colors.textSecondary }]}>{formatDate(payment.date)}</Text>
            <Text style={[styles.frequency, { color: colors.textSecondary }]}>{payment.frequency}</Text>
          </View>
        </View>
        
        <View style={styles.rightSection}>
          <Text style={[styles.amount, { color: colors.text }]}>{formatCurrency(payment.amount)}</Text>
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
                <Ionicons name="pencil" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
                <Ionicons name="trash" size={16} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  date: {
    fontSize: 14,
    marginBottom: 2,
  },
  frequency: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 8,
    padding: 4,
  },
});

export default PaymentCard;