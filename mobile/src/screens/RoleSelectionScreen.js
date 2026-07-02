import React, { useRef, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';

const { width } = Dimensions.get('window');

// BabyBloom brand colors
const C = {
  bg: '#FFFAF8',
  green: '#6BAE8A',
  greenLight: '#DCF0E6',
  pink: '#E87A84',
  pinkLight: '#FDEEF0',
  peach: '#F5A97A',
  peachLight: '#FEF0E5',
  purple: '#9B8ED6',
  purpleLight: '#EDE9F8',
  text: '#2D2020',
  textSec: '#8A7070',
  white: '#FFFFFF',
  border: '#F0E4E8',
};

const ROLES = [
  {
    key: 'parent',
    emoji: '👨‍👩‍👧',
    title: 'Primary Caregiver',
    subtitle: 'Set up your baby\'s profile and manage everything from one place.',
    bg: C.greenLight,
    accent: C.green,
    arrowBg: C.green,
  },
  {
    key: 'family',
    emoji: '👪',
    title: 'Family Member',
    subtitle: 'Join an existing family with an invitation code and track together.',
    bg: C.peachLight,
    accent: C.peach,
    arrowBg: C.peach,
  },
  {
    key: 'guest',
    emoji: '🌸',
    title: 'Continue as Guest',
    subtitle: 'Explore BabyBloom without an account. Your data stays on device.',
    bg: C.purpleLight,
    accent: C.purple,
    arrowBg: C.purple,
  },
];

const RoleCard = ({ role, index, onPress }) => {
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 130),
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, tension: 200, friction: 10, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }).start();
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        marginBottom: 14,
      }}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress(role.key)}
      >
        <View style={[styles.card, { backgroundColor: role.bg }]}>
          {/* Left: emoji + text */}
          <View style={styles.cardLeft}>
            <Text style={styles.cardEmoji}>{role.emoji}</Text>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: role.accent }]}>{role.title}</Text>
              <Text style={styles.cardSubtitle}>{role.subtitle}</Text>
            </View>
          </View>

          {/* Arrow */}
          <View style={[styles.arrowCircle, { backgroundColor: role.arrowBg }]}>
            <Text style={styles.arrowIcon}>›</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const RoleSelectionScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const authContext = useContext(AuthContext);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslate = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(headerTranslate, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleRoleSelect = async (roleKey) => {
    if (roleKey === 'guest') {
      // Set guest mode flag and go into app
      if (authContext?.setGuestMode) {
        await authContext.setGuestMode();
      }
    } else {
      // Navigate to auth screen with role context
      navigation.navigate('Auth', { role: roleKey });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Decorative blobs */}
      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          { opacity: headerOpacity, transform: [{ translateY: headerTranslate }] },
        ]}
      >
        {/* Mini logo mark */}
        <Image
          source={require('../../assets/babybloom_logo.png')}
          style={styles.miniLogo}
          resizeMode="contain"
        />

        <Text style={styles.heading}>Choose Your Role</Text>
        <Text style={styles.subHeading}>
          How would you like to use BabyBloom?
        </Text>
      </Animated.View>

      {/* Role Cards */}
      <View style={styles.cardsContainer}>
        {ROLES.map((role, index) => (
          <RoleCard
            key={role.key}
            role={role}
            index={index}
            onPress={handleRoleSelect}
          />
        ))}
      </View>

      {/* Back link */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backBtn}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    paddingHorizontal: 24,
  },
  blobTop: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: C.greenLight,
    opacity: 0.6,
  },
  blobBottom: {
    position: 'absolute',
    bottom: -100,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: C.pinkLight,
    opacity: 0.6,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 32,
  },
  miniLogo: {
    width: 100,
    height: 100,
    marginBottom: 8,
  },
  heading: {
    fontSize: 28,
    fontWeight: '900',
    color: C.text,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subHeading: {
    fontSize: 15,
    color: C.textSec,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 22,
  },
  cardsContainer: {
    flex: 1,
  },
  card: {
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  cardEmoji: {
    fontSize: 32,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: C.textSec,
    lineHeight: 18,
    fontWeight: '500',
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  arrowIcon: {
    color: C.white,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    marginTop: -2,
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 32,
  },
  backText: {
    color: C.textSec,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default RoleSelectionScreen;
