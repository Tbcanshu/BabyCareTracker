import { Dimensions, PixelRatio } from 'react-native';

// iPhone 11/13-ish width used as the design baseline for the existing screens.
const BASE_WIDTH = 375;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const isTablet = SCREEN_WIDTH >= 768;

// Caps how wide/tall a single element (charts, alarm circles, cards) is
// allowed to grow on tablets so it doesn't balloon to fill the screen.
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Scales a size relative to screen width, same as before, but capped so
// large tablets don't blow it out of proportion.
export const scaleWidth = (size, max = size * 2) =>
  clamp((SCREEN_WIDTH / BASE_WIDTH) * size, size, max);

// Scales a value only partially toward the screen-width ratio, which keeps
// font sizes and spacing readable on both small phones and tablets instead
// of growing linearly with screen width.
export const moderateScale = (size, factor = 0.25) =>
  PixelRatio.roundToNearestPixel(
    size + (scaleWidth(size, size * 1.4) - size) * factor
  );

export const getScreenSize = () => Dimensions.get('window');
