import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const AuthScreen = () => {
  const { login, register, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('test@test.com'); // Pré-rempli pour les tests
  const [password, setPassword] = useState('123456'); // Pré-rempli pour les tests
  const [name, setName] = useState('');

  const handleSubmit = async () => {
    console.log('🚀 Formulaire soumis:', { isLogin, email, password });
    
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      let result;
      if (isLogin) {
        result = await login(email, password);
      } else {
        result = await register(email, password, name);
      }
      
      console.log(' Résultat connexion:', result);
      
      if (!result.success) {
        Alert.alert('Erreur', result.error || 'Échec de connexion');
      }
    } catch (error) {
      console.error(' Erreur:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
      justifyContent: 'center',
      padding: 20,
    },
    logo: {
      fontSize: 40,
      textAlign: 'center',
      marginBottom: 10,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#fff',
      textAlign: 'center',
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 16,
      color: '#888',
      textAlign: 'center',
      marginBottom: 40,
    },
    formTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#fff',
      textAlign: 'center',
      marginBottom: 30,
    },
    input: {
      backgroundColor: '#333',
      borderRadius: 8,
      padding: 15,
      marginBottom: 15,
      color: '#fff',
      fontSize: 16,
    },
    button: {
      backgroundColor: '#007AFF',
      borderRadius: 8,
      padding: 15,
      alignItems: 'center',
      marginTop: 10,
    },
    buttonDisabled: {
      backgroundColor: '#555',
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    switchButton: {
      marginTop: 20,
      alignItems: 'center',
    },
    switchText: {
      color: '#007AFF',
      fontSize: 16,
    },
    demoInfo: {
      marginTop: 30,
      padding: 15,
      backgroundColor: '#1a1a1a',
      borderRadius: 8,
    },
    demoText: {
      color: '#888',
      fontSize: 12,
      textAlign: 'center',
    },
  });

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View>
        <Text style={styles.logo}>💳</Text>
        <Text style={styles.title}>PréviPay</Text>
        <Text style={styles.subtitle}>Gérez vos prélèvements intelligemment</Text>
        
        <Text style={styles.formTitle}>
          {isLogin ? 'Connexion' : 'Inscription'}
        </Text>

        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Nom"
            placeholderTextColor="#888"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="votre@email.com"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading 
              ? 'Chargement...' 
              : isLogin 
                ? 'Se connecter' 
                : 'S\'inscrire'
            }
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={styles.switchText}>
            {isLogin 
              ? 'Pas de compte ? S\'inscrire' 
              : 'Déjà un compte ? Se connecter'
            }
          </Text>
        </TouchableOpacity>

        <View style={styles.demoInfo}>
          <Text style={styles.demoText}>
            Version démo - Cliquez sur "Se connecter" avec les valeurs pré-remplies
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default AuthScreen;