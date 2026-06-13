import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import {
  FACT_RARITY_COLOR,
  FACT_RARITY_LABEL,
  type BananaFact,
} from '../lib/bananaFacts';
import { colors, radius, space } from '../lib/theme';

/**
 * Banana Fact card for the home screen. Shows one fact at a time, picked
 * randomly per app open with a recently-seen cooldown (see lib/factPick).
 * Presentation only: the parent loads the fact and passes it in. There is no
 * "see all" on purpose, so facts stay a reason to come back rather than a
 * list to binge through in one sitting.
 */
interface Props {
  fact: BananaFact | null;
}

export function FactCard({ fact }: Props) {
  if (!fact) return null;
  const tint = FACT_RARITY_COLOR[fact.rarity];

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.eyebrow}>🍌 BANANA FACT</Text>
        <View style={[styles.rarityPill, { backgroundColor: tint + '22' }]}>
          <Text style={[styles.rarityText, { color: tint }]}>
            {FACT_RARITY_LABEL[fact.rarity]}
          </Text>
        </View>
      </View>

      <Text style={styles.fact}>{fact.fact}</Text>
      <Text style={styles.quip}>{fact.quip}</Text>

      <View style={styles.bottomRow}>
        <Text style={styles.category}>{fact.category}</Text>
        <Pressable
          onPress={() => Linking.openURL(fact.sourceUrl)}
          accessibilityRole="link"
          accessibilityLabel={`Source: ${fact.sourceName}`}
          hitSlop={8}
          style={({ pressed }) => [
            styles.sourceBtn,
            pressed && { opacity: 0.6 },
          ]}
        >
          <Text style={styles.source} numberOfLines={1}>
            {fact.sourceName} ›
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: space.md,
    marginTop: space.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.inkSoft,
  },
  rarityPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  fact: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
    lineHeight: 21,
    marginTop: 10,
  },
  quip: {
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.inkSoft,
    lineHeight: 18,
    marginTop: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
    marginTop: 12,
  },
  category: {
    flexShrink: 0,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.inkSoft,
    textTransform: 'uppercase',
  },
  sourceBtn: {
    flexShrink: 1,
  },
  source: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.brown,
    textAlign: 'right',
  },
});
