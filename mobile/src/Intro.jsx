import { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  useWindowDimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Brand from './Brand';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// In-app introduction. The operating system's launch screen is a separate static asset.
export default function Intro({ language, onDone }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const logoWidth = Math.min(360, width - 64);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const line = useRef(new Animated.Value(0)).current;
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    let mounted = true;
    let sequence;
    let timer;
    function finish() {
      if (mounted) done.current();
    }
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (!mounted) return;
        if (reduced) {
          finish();
          return;
        }
        sequence = Animated.sequence([
          Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
            Animated.timing(scale, {
              toValue: 1,
              duration: 900,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(line, { toValue: 1, duration: 1100, useNativeDriver: true }),
          ]),
          Animated.delay(500),
          Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]);
        sequence.start(({ finished }) => {
          if (finished) finish();
        });
      })
      .catch(finish);
    // Never trap the user if an animation or accessibility query fails.
    timer = setTimeout(finish, 3500);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      if (enabled) finish();
    });
    return () => {
      mounted = false;
      sequence?.stop();
      clearTimeout(timer);
      sub.remove();
    };
  }, [opacity, scale, line]);
  return (
    <Modal
      visible
      presentationStyle="fullScreen"
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onDone}
    >
      <View style={styles.screen} accessibilityViewIsModal importantForAccessibility="yes">
        <Animated.View style={[styles.logo, { opacity, transform: [{ scale }] }]}>
          <Brand width={logoWidth} height={(logoWidth * 460) / 800} />
          <Animated.View style={[styles.line, { transform: [{ scaleX: line }] }]} />
          <Text style={styles.tagline}>
            {language === 'es' ? 'Tu estilo cuenta una historia.' : 'Your style tells a story.'}
          </Text>
        </Animated.View>
        <Pressable
          accessibilityRole="button"
          onPress={onDone}
          style={[styles.skip, { bottom: Math.max(insets.bottom, 20) + 16 }]}
        >
          <Text style={styles.skipText}>
            {language === 'es' ? 'Entrar en Maison' : 'Enter Maison'}
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f6f4ee',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: { alignItems: 'center', gap: 24 },
  line: { width: 150, height: 2, backgroundColor: '#b3152b' },
  tagline: { color: '#6c665e', fontSize: 16 },
  skip: {
    position: 'absolute',
    bottom: 36,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  skipText: { color: '#b3152b', fontSize: 15, fontWeight: '600' },
});
