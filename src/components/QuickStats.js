import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const QuickStats = ({ stats, onViewDetails }) => {
  const { theme } = useTheme();

  const getTopCategory = () => {
    if (!stats?.categories || Object.keys(stats.categories).length === 0) {
      return null;
    }
    
    const sortedCategories = Object.entries(stats.categories)
      .sort(([,a], [,b]) => b - a);
    
    return sortedCategories[0];
  };

  const topCategory = getTopCategory();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
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
    viewButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    viewButtonText: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '500',
      marginRight: 4,
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: 8,
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    divider: {
      width: 1,
      backgroundColor: theme.colors.border,
      marginHorizontal: 8,
    },
    topCategoryContainer: {
      marginTop: 12,
      padding: 12,
      backgroundColor: `${theme.colors.primary}10`,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    topCategoryLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    topCategoryText: {
      fontSize: 14,
      color: theme.colors.text,
      marginLeft: 8,
      flex: 1,
    },
    topCategoryAmount: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Ce mois-ci</Text>
        <TouchableOpacity style={styles.viewButton} onPress={onViewDetails}>
          <Text style={styles.viewButtonText}>Détails</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {stats?.totalAmount?.toFixed(0) || '0'}€
          </Text>
          <Text style={styles.statLabel}>Total des{'\n'}prélèvements</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {stats?.count || 0}
          </Text>
          <Text style={styles.statLabel}>Nombre de{'\n'}prélèvements</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {stats?.categories ? Object.keys(stats.categories).length : 0}
          </Text>
          <Text style={styles.statLabel}>Catégories{'\n'}différentes</Text>
        </View>
      </View>

      {topCategory && (
        <View style={styles.topCategoryContainer}>
          <View style={styles.topCategoryLeft}>
            <Ionicons
              name="trending-up"
              size={16}
              color={theme.colors.primary}
            />
            <Text style={styles.topCategoryText}>
              Catégorie principale: {topCategory[0]}
            </Text>
          </View>
          <Text style={styles.topCategoryAmount}>
            {topCategory[1].toFixed(0)}€
          </Text>
        </View>
      )}
    </View>
  );
};

export default QuickStats;