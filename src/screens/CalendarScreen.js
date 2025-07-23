import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useDebits } from '../context/DebitContext';
import DebitCard from '../components/DebitCard';

// Configuration française pour le calendrier
LocaleConfig.locales['fr'] = {
  monthNames: [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ],
  monthNamesShort: [
    'Jan.', 'Fév.', 'Mars', 'Avr.', 'Mai', 'Juin',
    'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'
  ],
  dayNames: [
    'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'
  ],
  dayNamesShort: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
  today: 'Aujourd\'hui'
};
LocaleConfig.defaultLocale = 'fr';

const CalendarScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { debits, getMonthDebits } = useDebits();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDebits, setSelectedDebits] = useState([]);

  useEffect(() => {
    updateMarkedDates();
    updateSelectedDebits(selectedDate);
  }, [debits, selectedDate]);

  // Fonction pour calculer les dates récurrentes
  const getRecurringDates = (debit) => {
    const dates = [];
    const startDate = new Date(debit.next_payment_date || debit.nextPaymentDate);
    const today = new Date();
    
    // Calculer les dates pour les 12 prochains mois
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 12);
    
    let currentDate = new Date(startDate);
    
    // Pour les prélèvements ponctuels, on n'affiche que la date unique
    if (debit.frequency === 'once') {
      if (currentDate >= today && currentDate <= endDate) {
        dates.push(formatDateForCalendar(currentDate));
      }
      return dates;
    }
    
    // Générer les dates récurrentes
    while (currentDate <= endDate) {
      if (currentDate >= today) {
        dates.push(formatDateForCalendar(currentDate));
      }
      
      // Calculer la prochaine date selon la fréquence
      const nextDate = new Date(currentDate);
      
      switch (debit.frequency) {
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'biweekly':
          nextDate.setDate(nextDate.getDate() + 14);
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case 'quarterly':
          nextDate.setMonth(nextDate.getMonth() + 3);
          break;
        case 'biannual':
          nextDate.setMonth(nextDate.getMonth() + 6);
          break;
        case 'annual':
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
        default:
          // Si fréquence inconnue, sortir de la boucle
          break;
      }
      
      currentDate = nextDate;
      
      // Sécurité pour éviter les boucles infinies
      if (dates.length > 50) break;
    }
    
    return dates;
  };

  // Fonction helper pour formater les dates
  const formatDateForCalendar = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const updateMarkedDates = () => {
    const marked = {};
    
    debits.forEach(debit => {
      // ✅ CORRECTION: Afficher TOUS les prélèvements actifs (même en pause)
      if (debit.status === 'active') {
        const dates = getRecurringDates(debit);
        
        dates.forEach(date => {
          // Couleur différente pour les prélèvements en pause
          const dotColor = debit.is_paused ? theme.colors.warning : theme.colors.primary;
          
          marked[date] = {
            marked: true,
            dotColor: dotColor,
            selectedColor: theme.colors.primary,
          };
        });
      }
    });
    
    // Marquer la date sélectionnée
    if (marked[selectedDate]) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: theme.colors.primary,
      };
    } else {
      marked[selectedDate] = {
        selected: true,
        selectedColor: theme.colors.primary,
      };
    }
    
    setMarkedDates(marked);
  };

  const updateSelectedDebits = (date) => {
    const debitsForDate = debits.filter(debit => {
      // ✅ CORRECTION: Inclure TOUS les prélèvements actifs (même en pause)
      if (debit.status !== 'active') return false;
      
      // Obtenir toutes les dates récurrentes pour ce prélèvement
      const recurringDates = getRecurringDates(debit);
      
      // Vérifier si la date sélectionnée correspond à une des dates récurrentes
      return recurringDates.includes(date);
    });
    
    setSelectedDebits(debitsForDate);
  };

  // Fonction pour mapper les données
  const mapDebitForDisplay = (debit) => ({
    ...debit,
    companyName: debit.company_name || debit.companyName,
    nextPaymentDate: debit.next_payment_date || debit.nextPaymentDate,
  });

  const onDateSelect = (day) => {
    setSelectedDate(day.dateString);
    updateSelectedDebits(day.dateString);
  };

  const formatSelectedDate = (date) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTotalForDate = (date) => {
    return debits
      .filter(debit => {
        // ✅ CORRECTION: Compter seulement les prélèvements actifs ET non en pause pour le total
        if (debit.status !== 'active' || debit.is_paused) return false;
        
        const recurringDates = getRecurringDates(debit);
        return recurringDates.includes(date);
      })
      .reduce((sum, debit) => sum + debit.amount, 0);
  };

  const mappedSelectedDebits = selectedDebits.map(mapDebitForDisplay);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    calendar: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 12,
      elevation: 2,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    selectedDateContainer: {
      backgroundColor: theme.colors.surface,
      margin: 16,
      padding: 16,
      borderRadius: 12,
      elevation: 1,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    selectedDateHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    selectedDateText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
    },
    totalAmount: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    debitsContainer: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    addButton: {
      position: 'absolute',
      right: 16,
      bottom: 16,
      backgroundColor: theme.colors.primary,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 6,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
    },
    legendContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.colors.surface,
      marginHorizontal: 16,
      marginTop: 8,
      borderRadius: 8,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 12,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    legendText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      {/* Calendrier */}
      <Calendar
        style={styles.calendar}
        onDayPress={onDateSelect}
        markedDates={markedDates}
        theme={{
          backgroundColor: theme.colors.surface,
          calendarBackground: theme.colors.surface,
          textSectionTitleColor: theme.colors.text,
          selectedDayBackgroundColor: theme.colors.primary,
          selectedDayTextColor: '#FFFFFF',
          todayTextColor: theme.colors.primary,
          dayTextColor: theme.colors.text,
          textDisabledColor: theme.colors.textSecondary,
          dotColor: theme.colors.primary,
          selectedDotColor: '#FFFFFF',
          arrowColor: theme.colors.primary,
          disabledArrowColor: theme.colors.textSecondary,
          monthTextColor: theme.colors.text,
          indicatorColor: theme.colors.primary,
          textDayFontWeight: '400',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '600',
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 13,
        }}
      />

      {/* Légende des couleurs */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
          <Text style={styles.legendText}>Actif</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.warning }]} />
          <Text style={styles.legendText}>En pause</Text>
        </View>
      </View>

      {/* Date sélectionnée et prélèvements */}
      <View style={styles.selectedDateContainer}>
        <View style={styles.selectedDateHeader}>
          <Text style={styles.selectedDateText}>
            {formatSelectedDate(selectedDate)}
          </Text>
          {selectedDebits.filter(d => !d.is_paused).length > 0 && (
            <Text style={styles.totalAmount}>
              {getTotalForDate(selectedDate).toFixed(2)}€
            </Text>
          )}
        </View>
      </View>

      {/* Liste des prélèvements pour la date sélectionnée */}
      <ScrollView style={styles.debitsContainer}>
        {mappedSelectedDebits.length > 0 ? (
          mappedSelectedDebits.map((debit) => (
            <DebitCard
              key={debit.id}
              debit={debit}
              onPress={() => navigation.navigate('DebitDetails', { debit })}
              showDate={false}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="calendar-outline"
              size={48}
              color={theme.colors.textSecondary}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>
              Aucun prélèvement ce jour
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bouton d'ajout flottant */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('Add')}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

export default CalendarScreen;