import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, shadow } from '../lib/theme';

// expo-linear-gradient ships in Expo SDK so this works in Expo Go.
// If we ever drop it, the card just becomes a flat yellow background — no big deal.

interface Props {
  onScan: () => void;
  busy?: boolean;
}

export function ScanCard({ onScan, busy }: Props) {
  return (
    <View style={[styles.wrap, shadow.hero]}>
      <LinearGradient
        colors={['#fff5b1', '#f5c518']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Text style={styles.eyebrow}>CHECK A BANANA</Text>
        <Text style={styles.title}>How ripe is yours,{'\n'}right now?</Text>

        <Pressable
          onPress={onScan}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={
            busy ? 'Analyzing your banana' : 'Scan a banana with your camera'
          }
          accessibilityState={{ disabled: !!busy, busy: !!busy }}
          accessibilityHint="Opens the camera so you can take a photo of a banana"
          style={({ pressed }) => [
            styles.cta,
            pressed && !busy && { transform: [{ scale: 0.97 }] },
            (pressed || busy) && { opacity: 0.85 },
          ]}
        >
          <View style={styles.ctaIcon}>
            <Ionicons name="camera" size={13} color={colors.ink} />
          </View>
          <Text style={styles.ctaText}>
            {busy ? 'Analyzing…' : 'Scan with camera'}
          </Text>
        </Pressable>

        <Text
          style={styles.bananaGlyph}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          🍌
        </Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: space.sm,
    marginHorizontal: space.md,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  card: {
    paddingVertical: 28,
    paddingHorizontal: 22,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: 'rgba(31,29,24,0.6)',
    fontWeight: '700',
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
    lineHeight: 27,
    marginBottom: 18,
    letterSpacing: -0.3,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ink,
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    gap: 10,
  },
  ctaIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  bananaGlyph: {
    position: 'absolute',
    right: -10,
    bottom: -30,
    fontSize: 130,
    opacity: 0.18,
    transform: [{ rotate: '-18deg' }],
  },
});
