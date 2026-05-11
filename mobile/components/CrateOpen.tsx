import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import {
  DropResult,
  RARITY_COLOR,
  RARITY_LABEL,
  Variety,
} from '../lib/drops';
import { colors, radius, space, shadow } from '../lib/theme';

/**
 * Crate-opening flow with three states:
 *   1. "closed"  — banana crate emoji bouncing, "Tap to open" prompt
 *   2. "opening" — quick shake animation, then explosion
 *   3. "revealed" — drop card with rarity-colored glow + flavor text +
 *      "Add to collection" / "Continue" button
 *
 * Confetti for fictional+mythic. Sad-trombone visual for peels (no
 * confetti, sepia card, joke flavor copy).
 */
interface Props {
  onComplete: () => void;
  /** Provide a function that opens the crate when invoked. */
  onOpen: () => Promise<DropResult>;
}

type Phase = 'closed' | 'opening' | 'revealed';

export function CrateOpen({ onComplete, onOpen }: Props) {
  const [phase, setPhase] = useState<Phase>('closed');
  const [drop, setDrop] = useState<DropResult | null>(null);

  const bounce = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(0)).current;

  // Idle-bounce loop while closed.
  useEffect(() => {
    if (phase !== 'closed') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: -10,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [phase, bounce]);

  const handleTap = async () => {
    if (phase !== 'closed') return;
    setPhase('opening');
    bounce.stopAnimation();

    // Shake.
    Animated.sequence([
      Animated.timing(shake, {
        toValue: 1,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: -1,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: 1,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: -1,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: 0,
        duration: 90,
        useNativeDriver: true,
      }),
    ]).start();

    // Roll the drop while shake plays.
    const result = await onOpen();
    setDrop(result);

    // After shake finishes, reveal.
    setTimeout(() => {
      setPhase('revealed');
      Animated.timing(reveal, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }).start();
    }, 460);
  };

  const shakeRotate = shake.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-12deg', '12deg'],
  });

  const revealTranslate = reveal.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0],
  });

  return (
    <View style={styles.wrap}>
      {phase !== 'revealed' ? (
        <Pressable
          onPress={handleTap}
          accessibilityRole="button"
          accessibilityLabel="Open the crate"
          style={styles.crateTouch}
          disabled={phase === 'opening'}
        >
          <Animated.View
            style={[
              styles.crateGlyphWrap,
              {
                transform: [
                  { translateY: bounce },
                  { rotate: shakeRotate },
                ],
              },
            ]}
          >
            <Text style={styles.crate}>📦</Text>
          </Animated.View>
          <Text style={styles.tapHint}>
            {phase === 'closed' ? 'Tap to open' : 'Opening…'}
          </Text>
          <Text style={styles.subtle}>A crate washed up from the boat.</Text>
        </Pressable>
      ) : drop ? (
        <Animated.View
          style={{
            opacity: reveal,
            transform: [{ translateY: revealTranslate }],
            width: '100%',
            alignItems: 'center',
          }}
        >
          <DropCard drop={drop} />

          <Pressable
            onPress={onComplete}
            accessibilityRole="button"
            accessibilityLabel="Continue"
            style={({ pressed }) => [
              styles.continueBtn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.continueText}>Continue</Text>
          </Pressable>
        </Animated.View>
      ) : null}

      {phase === 'revealed' && drop && drop.variety.rarity !== 'peels' && (
        <Confetti rarity={drop.variety.rarity} />
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* The drop reveal card                                                */
/* ------------------------------------------------------------------ */

function DropCard({ drop }: { drop: DropResult }) {
  const { variety, firstTime } = drop;
  const rarityColor = RARITY_COLOR[variety.rarity];
  const isPeels = variety.rarity === 'peels';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: variety.colorSoft,
          borderColor: rarityColor,
        },
        shadow.card,
      ]}
    >
      <View
        style={[
          styles.rarityChip,
          { backgroundColor: rarityColor },
        ]}
      >
        <Text style={styles.rarityChipText}>
          {RARITY_LABEL[variety.rarity].toUpperCase()}
        </Text>
      </View>

      <Text
        style={[styles.cardGlyph, isPeels && styles.peelsGlyph]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {variety.glyph}
      </Text>

      <Text style={styles.cardName}>{variety.name}</Text>

      <Text style={styles.cardFlavor}>{variety.flavor}</Text>

      {variety.perk && !isPeels && (
        <View style={styles.perkRow}>
          <Text style={styles.perkLabel}>PERK</Text>
          <Text style={styles.perkText}>{variety.perk}</Text>
        </View>
      )}

      {firstTime && !isPeels && (
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>NEW · added to your collection</Text>
        </View>
      )}

      {isPeels && (
        <Text style={styles.peelsNote}>(no rewards earned. just vibes.)</Text>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Confetti — small Animated.Views that translate outward and fade.    */
/* ------------------------------------------------------------------ */

interface ConfettiProps {
  rarity: 'real' | 'fictional' | 'mythic' | 'peels';
}

function Confetti({ rarity }: ConfettiProps) {
  const count = rarity === 'mythic' ? 18 : rarity === 'fictional' ? 12 : 6;
  const glyphs = rarity === 'mythic'
    ? ['✨', '🍌', '⭐']
    : rarity === 'fictional'
      ? ['✨', '🍌']
      : ['🍌'];

  return (
    <View pointerEvents="none" style={styles.confettiWrap}>
      {Array.from({ length: count }).map((_, i) => (
        <ConfettiPiece
          key={i}
          glyph={glyphs[i % glyphs.length]}
          delay={i * 25}
          angle={(i / count) * Math.PI * 2}
        />
      ))}
    </View>
  );
}

function ConfettiPiece({
  glyph,
  delay,
  angle,
}: {
  glyph: string;
  delay: number;
  angle: number;
}) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(t, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, t]);

  const distance = 130;
  const tx = t.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.cos(angle) * distance],
  });
  const ty = t.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.sin(angle) * distance],
  });
  const opacity = t.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [1, 1, 0],
  });
  const rotate = t.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.Text
      style={[
        styles.confettiPiece,
        {
          opacity,
          transform: [{ translateX: tx }, { translateY: ty }, { rotate }],
        },
      ]}
    >
      {glyph}
    </Animated.Text>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  wrap: {
    minHeight: 360,
    paddingVertical: space.lg,
    paddingHorizontal: space.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crateTouch: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  crateGlyphWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  crate: {
    fontSize: 90,
  },
  tapHint: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.3,
  },
  subtle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.inkSoft,
    fontStyle: 'italic',
  },

  card: {
    borderRadius: radius.xl,
    paddingVertical: space.lg,
    paddingHorizontal: space.lg,
    borderWidth: 2,
    width: '100%',
    alignItems: 'center',
    overflow: 'hidden',
  },
  rarityChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: 12,
  },
  rarityChipText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  cardGlyph: {
    fontSize: 76,
    marginVertical: 6,
  },
  peelsGlyph: {
    opacity: 0.55,
  },
  cardName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.4,
  },
  cardFlavor: {
    fontSize: 13,
    color: colors.ink,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 12,
    lineHeight: 18,
  },
  perkRow: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: '100%',
  },
  perkLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.inkSoft,
  },
  perkText: {
    fontSize: 13,
    color: colors.ink,
    marginTop: 2,
  },
  newBadge: {
    marginTop: 10,
    backgroundColor: colors.ink,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  peelsNote: {
    marginTop: 8,
    fontSize: 11,
    color: colors.inkSoft,
    fontStyle: 'italic',
  },

  continueBtn: {
    marginTop: 18,
    backgroundColor: colors.ink,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  continueText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  confettiWrap: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    width: 0,
    height: 0,
  },
  confettiPiece: {
    position: 'absolute',
    fontSize: 18,
  },
});
