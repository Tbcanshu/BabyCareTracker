import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// BabyBloom brand colors
const C = {
  bg: '#FFFAF8',
  green: '#6BAE8A',
  greenLight: '#E8F5EE',
  pink: '#E87A84',
  pinkLight: '#FDEEF0',
  cream: '#FFF0EB',
  text: '#2D2020',
  textSec: '#8A7070',
  white: '#FFFFFF',
};

const SplashScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  // Animations
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(30)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnTranslate = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo fades + scales in
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Text slides up
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(textTranslate, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Button fades in
      Animated.parallel([
        Animated.timing(btnOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(btnTranslate, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Decorative blobs */}
      <View style={styles.blobTopLeft} />
      <View style={styles.blobBottomRight} />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoWrapper,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        <Image
          source={require('../../assets/babybloom_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Tagline */}
      <Animated.View
        style={{
          opacity: textOpacity,
          transform: [{ translateY: textTranslate }],
          alignItems: 'center',
          marginTop: 8,
        }}
      >
        <View style={styles.pillTag}>
          <Text style={styles.pillDot}>🌿</Text>
          <Text style={styles.pillText}>Gentle  •  Pure  •  Premium</Text>
          <Text style={styles.pillDot}>🌸</Text>
        </View>
        <Text style={styles.subTagline}>
          Your complete baby care companion
        </Text>
      </Animated.View>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* CTA Button */}
      <Animated.View
        style={{
          opacity: btnOpacity,
          transform: [{ translateY: btnTranslate }],
          width: '100%',
          paddingHorizontal: 32,
          paddingBottom: 40,
        }}
      >
        <TouchableOpacity
          style={styles.ctaBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('RoleSelection')}
        >
          <Text style={styles.ctaBtnText}>Get Started 🌸</Text>
        </TouchableOpacity>

        <Text style={styles.loginHint}>
          Already have an account?{' '}
          <Text
            style={styles.loginLink}
            onPress={() => navigation.navigate('Auth')}
          >
            Sign in
          </Text>
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  blobTopLeft: {
    position: 'absolute',
    top: -60,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: C.greenLight,
    opacity: 0.7,
  },
  blobBottomRight: {
    position: 'absolute',
    bottom: -80,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: C.pinkLight,
    opacity: 0.7,
  },
  logoWrapper: {
    marginTop: height * 0.08,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.82,
    height: width * 0.82,
  },
  pillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#F0E0E8',
    shadowColor: '#E87A84',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSec,
    letterSpacing: 0.5,
  },
  pillDot: {
    fontSize: 14,
  },
  subTagline: {
    marginTop: 14,
    fontSize: 15,
    color: C.textSec,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  ctaBtn: {
    backgroundColor: C.green,
    paddingVertical: 18,
    borderRadius: 999,
    alignItems: 'center',
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaBtnText: {
    color: C.white,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  loginHint: {
    textAlign: 'center',
    marginTop: 18,
    fontSize: 14,
    color: C.textSec,
  },
  loginLink: {
    color: C.pink,
    fontWeight: '700',
  },
});

export default SplashScreen;
