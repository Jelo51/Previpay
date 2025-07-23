import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const CompanyCard = ({ company, onPress }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
    >
      <Image source={{ uri: company.logo }} style={styles.logo} />
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>{company.name}</Text>
        <Text style={[styles.category, { color: colors.textSecondary }]}>
          {company.category}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  category: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
});

export { CompanyCard };