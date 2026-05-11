import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import {
  Bunch,
  bunchAlive,
  bunchEatenAtPeak,
  formatLifespan,
} from '../lib/pet';
import { colors, radius, space, shadow } from '../lib/theme';

/**
 * Bunch overview header. Shows the family name, alive count, time since
 * planted, and a "peak eats" tally so the player has a score.
 *
 * One gently-bouncing banana glyph fixes the eye to the top of the card.
 */
interface Props {
  bunch: Bunch;
}

export function PetBananaCard({ bunch }: Props) {
  const aliveCount = bunchAlive(bunch);
  const eatenAtPeak = bunchEatenAtPeak(bunch);
  const total = bunch.bananas.length;
  const lifespan = formatLifespan(bunch.planted_iso);
  const allGone = aliveCount === 0;

  const sway = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (allGone) {
      sway.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sway, {
          toValue: -1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [allGone, sway]);

  const rotate = sway.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-5deg', '5deg'],
  });

  return (
    <View style={[styles.wrap, shadow.card]}>
      <View style={styles.bananaSlot}>
        <Animated.Text
          style={[
            styles.banana,
            allGone && styles.dead,
            !allGone && { transform: [{ rotate }] },
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          🍌
        </Animated.Text>
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {bunch.name}
      </Text>
      <Text style={styles.sub}>
        Living {lifespan} · {aliveCount} of {total} still around
      </Text>

      <View style={styles.statsRow}>
        <Stat label="ALIVE" value={`${aliveCount}`} />
        <Stat label="EATEN AT PEAK" value={`${eatenAtPeak}`} accent />
        <Stat label="LOST" value={`${total - aliveCount - eatenAtPeak}`} />
      </View>
    </View>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, accent && { color: colors.accentDeep }]}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: space.md,
    backgroundColor: colors.yellowSoft,
    borderRadius: radius.xl,
    paddingTop: space.lg,
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    alignItems: 'center',
  },
  bananaSlot: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banana: {
    fontSize: 70,
    textAlign: 'center',
  },
  dead: {
    opacity: 0.35,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.4,
    marginTop: 4,
  },
  sub: {
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 4,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: 14,
    width: '100%',
  },
  stat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.inkSoft,
    letterSpacing: 0.8,
    marginTop: 2,
  },
});
