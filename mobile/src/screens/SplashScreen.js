import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clamp } from '../utils/responsive';

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
  const { width } = useWindowDimensions();
  const logoSize = clamp(width * 0.82, 140, 320);

  // Animations
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
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
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          source={require('../../assets/babybloom_logo.png')}
          style={{ width: logoSize, height: logoSize }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* CTA Button */}
      <Animated.View
        style={{
          opacity: btnOpacity,
          transform: [{ translateY: btnTranslate }],
          width: '100%',
          maxWidth: 480,
          alignSelf: 'center',
          marginTop: 16,
          paddingHorizontal: 32,
          paddingBottom: 40,
        }}
      >
        <TouchableOpacity
          style={styles.ctaBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('RoleSelection')}
        >
          <Text style={styles.ctaBtnText}>Get Started</Text>
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
    justifyContent: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
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
