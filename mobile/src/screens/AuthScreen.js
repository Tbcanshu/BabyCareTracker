import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { COLORS, FONTS } from '../theme';
import { authApi, setAuthToken } from '../utils/api';

const AuthScreen = ({ navigation, setIsLoggedIn }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      let data;
      if (isLogin) {
        data = await authApi.login(email, password);
      } else {
        data = await authApi.register(name, email, password);
      }
      
      await setAuthToken(data.token);
      setIsLoggedIn(true);
    } catch (error) {
      Alert.alert('Authentication Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
      
      {!isLogin && (
        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor={COLORS.textLight}
          value={name}
          onChangeText={setName}
        />
      )}
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={COLORS.textLight}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={COLORS.textLight}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Register'}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchButton}>
        <Text style={styles.switchText}>
          {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  button: {
    backgroundColor: COLORS.primaryDark,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchText: {
    color: COLORS.primaryDark,
    fontSize: 14,
  }
});

export default AuthScreen;
