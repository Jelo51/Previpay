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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { debits, getMonthDebits } = useDebits();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDebits, setSelectedDebits] = useState([]);

  useEffect(() => {
    updateMarkedDates();
    updateSelectedDebits(selectedDate);
  }, [debits, selectedDate]);

  const updateMarkedDates = () => {
    const marked = {};
    
    debits.forEach(debit => {
      if (debit.status === 'active') {
        const date = debit.nextPaymentDate;
        marked[date] = {
          marked: true,
          dotColor: theme.colors.primary,
          selectedColor: theme.colors.primary,
        };
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
    const debitsForDate = debits.filter(debit => 
      debit.nextPaymentDate === date && debit.status === 'active'
    );
    setSelectedDebits(debitsForDate);
  };

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
      .filter(debit => debit.nextPaymentDate === date && debit.status === 'active')
      .reduce((sum, debit) => sum + debit.amount, 0);
  };

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

      {/* Date sélectionnée et prélèvements */}
      <View style={styles.selectedDateContainer}>
        <View style={styles.selectedDateHeader}>
          <Text style={styles.selectedDateText}>
            {formatSelectedDate(selectedDate)}
          </Text>
          {selectedDebits.length > 0 && (
            <Text style={styles.totalAmount}>
              {getTotalForDate(selectedDate).toFixed(2)}€
            </Text>
          )}
        </View>
      </View>

      {/* Liste des prélèvements pour la date sélectionnée */}
      <ScrollView style={styles.debitsContainer}>
        {selectedDebits.length > 0 ? (
          selectedDebits.map((debit) => (
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
              {t('calendar.noDebitsToday')}
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