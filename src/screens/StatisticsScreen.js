import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useDebits } from '../context/DebitContext';
import { catalogService } from '../services/catalogService';

const { width: screenWidth } = Dimensions.get('window');

const StatisticsScreen = () => {
  const { theme } = useTheme();
  const { debits, getMonthlyStats } = useDebits();
  
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [stats, setStats] = useState(null);

  const periods = [
    { value: 'month', label: 'Ce mois' },
    { value: 'year', label: 'Cette année' },
  ];

  useEffect(() => {
    loadStats();
  }, [selectedPeriod, debits]);

  const loadStats = () => {
    const now = new Date();
    let statsData;

    if (selectedPeriod === 'month') {
      statsData = getMonthlyStats(now.getMonth(), now.getFullYear());
    } else {
      // Pour l'année, on calcule sur tous les mois
      const yearStats = {
        totalAmount: 0,
        count: 0,
        categories: {},
        debits: []
      };

      for (let month = 0; month < 12; month++) {
        const monthData = getMonthlyStats(month, now.getFullYear());
        yearStats.totalAmount += monthData.totalAmount;
        yearStats.count += monthData.count;
        yearStats.debits.push(...monthData.debits);
        
        Object.entries(monthData.categories).forEach(([category, amount]) => {
          yearStats.categories[category] = (yearStats.categories[category] || 0) + amount;
        });
      }

      statsData = yearStats;
    }

    setStats(statsData);
  };

  // Fonction pour obtenir les couleurs par catégorie
  const getCategoryColor = (category) => {
    const colors = {
      'Mobile': '#007AFF',
      'Internet': '#5856D6',
      'Streaming': '#FF3B30',
      'Transport': '#FF9500',
      'Assurance': '#34C759',
      'Banque': '#FF2D92',
      'Énergie': '#FFCC00',
      'Autre': '#8E8E93',
      'Utilities': '#32D74B',
      'Entertainment': '#FF453A',
      'Food': '#FF9F0A',
      'Shopping': '#BF5AF2',
      'Health': '#30D158',
      'Education': '#64D2FF',
    };
    
    return colors[category] || '#8E8E93';
  };

  // Fonction corrigée pour le graphique en camembert avec SEULEMENT les pourcentages
  const getPieChartData = () => {
    if (!stats?.categories || Object.keys(stats.categories).length === 0) {
      return [];
    }

    const total = stats.totalAmount;
    
    return Object.entries(stats.categories)
      .filter(([_, amount]) => amount > 0)
      .map(([category, amount]) => {
        const percentage = ((amount / total) * 100).toFixed(1);
        
        return {
          name: category, // Nom de catégorie pour la légende
          population: parseFloat(percentage), // IMPORTANT: Utiliser "population" avec le pourcentage
          amount: amount, // Garder le montant pour la légende
          percentage: parseFloat(percentage),
          categoryName: category,
          color: getCategoryColor(category),
          legendFontColor: theme.colors.text,
          legendFontSize: 12,
        };
      })
      .sort((a, b) => b.amount - a.amount); // Trier par montant décroissant
  };

  const getBarChartData = () => {
    if (!stats?.categories || Object.keys(stats.categories).length === 0) {
      return {
        labels: ['Aucune donnée'],
        datasets: [{ data: [0] }]
      };
    }

    const sortedCategories = Object.entries(stats.categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6); // Top 6 catégories

    return {
      labels: sortedCategories.map(([category]) => 
        category.length > 8 ? category.substring(0, 8) + '...' : category
      ),
      datasets: [{
        data: sortedCategories.map(([, amount]) => amount)
      }]
    };
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 1, // Afficher 1 décimale pour les pourcentages
    color: (opacity = 1) => `rgba(${theme.isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${theme.isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.colors.primary
    }
  };

  const pieChartData = getPieChartData();
  const barChartData = getBarChartData();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.surface,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    periodSelector: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 4,
    },
    periodButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 6,
      alignItems: 'center',
    },
    periodButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    periodButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    periodButtonTextActive: {
      color: '#FFFFFF',
    },
    content: {
      flex: 1,
    },
    section: {
      backgroundColor: theme.colors.surface,
      margin: 16,
      borderRadius: 12,
      overflow: 'hidden',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    summaryContainer: {
      padding: 16,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    summaryLabel: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    summaryValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    totalValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    chartContainer: {
      alignItems: 'center',
      padding: 16,
    },
    noDataContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    noDataIcon: {
      marginBottom: 16,
    },
    noDataText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    categoryList: {
      padding: 16,
    },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    lastCategoryItem: {
      borderBottomWidth: 0,
    },
    categoryInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    categoryColor: {
      width: 16,
      height: 16,
      borderRadius: 8,
      marginRight: 12,
    },
    categoryName: {
      fontSize: 16,
      color: theme.colors.text,
      flex: 1,
    },
    categoryAmount: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    categoryPercentage: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginLeft: 8,
    },
    // Styles pour l'info bulle sur le graphique
    chartLegend: {
      alignItems: 'center',
      marginTop: 16,
    },
    chartLegendText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
    },
  });

  return (
    <View style={styles.container}>
      {/* Header avec sélecteur de période */}
      <View style={styles.header}>
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.value}
              style={[
                styles.periodButton,
                selectedPeriod === period.value && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period.value)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period.value && styles.periodButtonTextActive,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Résumé */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}> Résumé</Text>
          
          {stats ? (
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total des prélèvements</Text>
                <Text style={[styles.summaryValue, styles.totalValue]}>
                  {stats.totalAmount.toFixed(2)}€
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Nombre de prélèvements</Text>
                <Text style={styles.summaryValue}>{stats.count}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Montant moyen</Text>
                <Text style={styles.summaryValue}>
                  {stats.count > 0 ? (stats.totalAmount / stats.count).toFixed(2) : '0.00'}€
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Catégories</Text>
                <Text style={styles.summaryValue}>
                  {Object.keys(stats.categories).length}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Ionicons
                name="bar-chart-outline"
                size={48}
                color={theme.colors.textSecondary}
                style={styles.noDataIcon}
              />
              <Text style={styles.noDataText}>Aucune donnée disponible</Text>
            </View>
          )}
        </View>

        {/* Graphique en camembert avec SEULEMENT les pourcentages */}
        {pieChartData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}> Répartition par catégorie</Text>
            <View style={styles.chartContainer}>
              <PieChart
                data={pieChartData}
                width={screenWidth - 64}
                height={220}
                chartConfig={chartConfig}
                accessor="population" // IMPORTANT: Utiliser "population" pour afficher SEULEMENT les pourcentages
                backgroundColor="transparent"
                paddingLeft="15"
                center={[10, 50]}
                absolute // Affiche maintenant SEULEMENT "100.0%" au lieu de "682 100.0%"
              />
              
              {/* Info bulle explicative */}
              <View style={styles.chartLegend}>
                <Text style={styles.chartLegendText}>
                  Les pourcentages indiquent la part de chaque catégorie
                </Text>
              </View>
            </View>
            
            {/* Liste des catégories avec pourcentages et montants */}
            <View style={styles.categoryList}>
              {pieChartData.map((item, index) => {
                const isLast = index === pieChartData.length - 1;
                
                return (
                  <View 
                    key={item.categoryName} 
                    style={[styles.categoryItem, isLast && styles.lastCategoryItem]}
                  >
                    <View style={styles.categoryInfo}>
                      <View 
                        style={[
                          styles.categoryColor, 
                          { backgroundColor: item.color }
                        ]} 
                      />
                      <Text style={styles.categoryName}>{item.categoryName}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.categoryAmount}>
                        {item.amount.toFixed(2)}€
                      </Text>
                      <Text style={styles.categoryPercentage}>
                        ({item.percentage}%)
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Graphique en barres */}
        {barChartData.labels.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Top catégories</Text>
            <View style={styles.chartContainer}>
              <BarChart
                data={barChartData}
                width={screenWidth - 64}
                height={220}
                chartConfig={chartConfig}
                verticalLabelRotation={30}
                fromZero
                showBarTops={false}
                yAxisSuffix="€"
              />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default StatisticsScreen;