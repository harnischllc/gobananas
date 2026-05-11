import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';

/**
 * Homegrown dancing banana. NOT the PB&J one — that's copyrighted.
 * Same vibe, though.
 *
 * Two variants:
 *   - "wiggle": gentle bounce + sway, infinite loop. For "Analyzing…",
 *     empty states, anywhere we want the app to feel alive without being
 *     annoying after the 50th scan.
 *   - "party": bigger bounce, faster sway, sparkles, one-shot entrance
 *     pop. For peak-banana celebrations on Stage 6 results.
 *
 * Pure built-in Animated API + emoji. No new deps. Works in Expo Go today.
 */

interface Props {
  variant?: 'wiggle' | 'party';
  size?: number;
}

export function DancingBanana({ variant = 'wiggle', size = 56 }: Props) {
  const bounceY = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(variant === 'party' ? 0 : 1)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  // Respect the OS reduced-motion setting. If the user opts out of motion,
  // the banana stays cheerful but still — same emoji, no animation loops.
  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (!cancelled) setReduceMotion(value);
    });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (value) => setReduceMotion(value),
    );
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      // Settle to rest pose immediately and skip the loops.
      bounceY.setValue(0);
      sway.setValue(0);
      pop.setValue(1);
      return;
    }

    const isParty = variant === 'party';

    // Bounce loop. Party is taller and faster.
    const bounceAmplitude = isParty ? 22 : 8;
    const bounceDur = isParty ? 280 : 600;
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceY, {
          toValue: -bounceAmplitude,
          duration: bounceDur,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounceY, {
          toValue: 0,
          duration: bounceDur,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Sway loop (different period from bounce so motion stays interesting).
    const swayDur = isParty ? 200 : 900;
    Animated.loop(
      Animated.sequence([
        Animated.timing(sway, {
          toValue: 1,
          duration: swayDur,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sway, {
          toValue: -1,
          duration: swayDur,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Party-only entrance pop.
    if (isParty) {
      Animated.sequence([
        Animated.timing(pop, {
          toValue: 1.35,
          duration: 220,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
        Animated.timing(pop, {
          toValue: 1,
          duration: 180,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [variant, bounceY, sway, pop, reduceMotion]);

  const rotateInterpolate = sway.interpolate({
    inputRange: [-1, 1],
    outputRange: variant === 'party' ? ['-25deg', '25deg'] : ['-8deg', '8deg'],
  });

  // Container is 1.7x banana size to give room for sparkles + bounce.
  const wrapSize = size * 1.7;

  return (
    <View
      style={[styles.wrap, { width: wrapSize, height: wrapSize }]}
      // Decorative element. Anything important is communicated by the
      // surrounding stage/label text already.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {variant === 'party' && !reduceMotion && <Sparkles size={size} />}
      <Animated.Text
        style={[
          styles.banana,
          {
            fontSize: size,
            transform: [
              { translateY: bounceY },
              { rotate: rotateInterpolate },
              { scale: pop },
            ],
          },
        ]}
      >
        🍌
      </Animated.Text>
    </View>
  );
}

/**
 * Four sparkles around the banana, each with its own staggered twinkle.
 * Cheap, charming, no asset pipeline.
 */
function Sparkles({ size }: { size: number }) {
  const positions = [
    { top: 0, left: 4, delay: 0 },
    { top: 6, right: 0, delay: 220 },
    { bottom: 8, left: 0, delay: 440 },
    { bottom: 0, right: 6, delay: 660 },
  ];
  return (
    <>
      {positions.map((p, i) => (
        <Sparkle key={i} {...p} fontSize={size * 0.32} />
      ))}
    </>
  );
}

function Sparkle({
  delay,
  fontSize,
  ...pos
}: {
  delay: number;
  fontSize: number;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 240,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 240,
            easing: Easing.out(Easing.back(2)),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 360,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.5,
            duration: 360,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(800 - delay),
      ]),
    ).start();
  }, [delay, opacity, scale]);

  return (
    <Animated.Text
      style={[
        styles.sparkle,
        pos,
        { fontSize, opacity, transform: [{ scale }] },
      ]}
    >
      ✨
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  banana: {
    textAlign: 'center',
  },
  sparkle: {
    position: 'absolute',
  },
});
