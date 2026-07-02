import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../theme';
import { authApi, setAuthToken } from '../utils/api';

const C = {
  bg: '#FFFAF8',
  green: '#6BAE8A',
  greenLight: '#DCF0E6',
  pink: '#E87A84',
  pinkLight: '#FDEEF0',
  text: '#2D2020',
  textSec: '#8A7070',
  white: '#FFFFFF',
  border: '#F0E4E8',
  surface: '#FFFFFF',
};

const AuthScreen = ({ navigation, setIsLoggedIn, route }) => {
  const role = route?.params?.role || 'parent';
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert('Missing Fields', 'Please fill in all fields to continue.');
      return;
    }

    setLoading(true);
    try {
      // ── TEMPORARY: No backend yet ──────────────────────────────────────────
      // Accept any credentials and create a local session.
      // TODO: Replace this block with real API call once backend is ready:
      //
      //   let data;
      //   if (isLogin) {
      //     data = await authApi.login(email, password);
      //   } else {
      //     data = await authApi.register(name, email, password);
      //   }
      //   await setAuthToken(data.token);
      //
      // ──────────────────────────────────────────────────────────────────────
      await setAuthToken('local_dev_token_' + Date.now());
      setIsLoggedIn(true);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const roleLabel =
    role === 'family' ? 'Family Member' : 'Primary Caregiver';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Decorative blobs */}
        <View style={styles.blobTop} />

        {/* Mini Logo */}
        <Image
          source={require('../../assets/babybloom_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Role badge */}
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>
            {role === 'family' ? '👪' : '👨‍👩‍👧'} {roleLabel}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {isLogin ? 'Welcome back! 👋' : 'Create your account'}
        </Text>
        <Text style={styles.subtitle}>
          {isLogin
            ? 'Sign in to continue to BabyBloom'
            : 'Start tracking your little one\u2019s journey'}
        </Text>

        {/* Form */}
        <View style={styles.form}>
          {!isLogin && (
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Sarah Johnson"
                placeholderTextColor={C.textSec}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor={C.textSec}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={C.textSec}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={C.white} />
            ) : (
              <Text style={styles.submitBtnText}>
                {isLogin ? 'Sign In 🌸' : 'Create Account 🌸'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsLogin(!isLogin)}
            style={styles.switchRow}
          >
            <Text style={styles.switchText}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <Text style={styles.switchLink}>
                {isLogin ? 'Register' : 'Sign In'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Back */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>← Back to roles</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  blobTop: {
    position: 'absolute',
    top: -60,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: C.greenLight,
    opacity: 0.5,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 6,
  },
  roleBadge: {
    backgroundColor: C.pinkLight,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F5C0C6',
  },
  roleBadgeText: {
    color: C.pink,
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: C.text,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: C.textSec,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 28,
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: C.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    fontSize: 15,
    color: C.text,
  },
  submitBtn: {
    backgroundColor: C.green,
    paddingVertical: 17,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  submitBtnText: {
    color: C.white,
    fontSize: 17,
    fontWeight: '800',
  },
  switchRow: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: C.textSec,
    fontSize: 14,
  },
  switchLink: {
    color: C.pink,
    fontWeight: '700',
  },
  backBtn: {
    marginTop: 28,
    paddingVertical: 8,
  },
  backText: {
    color: C.textSec,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AuthScreen;
