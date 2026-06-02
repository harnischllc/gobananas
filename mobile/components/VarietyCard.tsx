import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Variety, RARITY_COLOR, RARITY_LABEL } from '../lib/drops';
import { colors, radius } from '../lib/theme';

interface Props {
  variety: Variety;
  unlocked: boolean;
  /** When set and the variety is unlocked, the tile is tappable to show details. */
  onPress?: () => void;
}

/**
 * Collection grid tile. Locked = silhouette glyph + name hidden as
 * "???" + rarity hint. Unlocked = full color + name, tappable for details.
 *
 * Caption text stays at ink (high contrast) regardless of the tile tint;
 * rarity is signalled by the border color, not the text color, so the
 * label reads on every tile (the old rarity-colored caption was ~1.8:1
 * gold-on-yellow).
 */
export function VarietyCard({ variety, unlocked, onPress }: Props) {
  const rarityColor = RARITY_COLOR[variety.rarity];

  const tileStyle = {
    backgroundColor: unlocked ? variety.colorSoft : '#eceae3',
    borderColor: unlocked ? rarityColor : colors.line,
  };

  const label = unlocked
    ? `${variety.name}, ${RARITY_LABEL[variety.rarity]}, unlocked`
    : `Locked ${RARITY_LABEL[variety.rarity]} variety${
        variety.seasonal ? `, drops only during ${variety.seasonal}` : ''
      }`;

  const inner = (
    <>
      <Text style={[styles.glyph, !unlocked && styles.silhouette]}>
        {unlocked ? variety.glyph : '🍌'}
      </Text>
      <Text
        style={[styles.name, !unlocked && styles.lockedName]}
        numberOfLines={1}
      >
        {unlocked ? variety.name : '???'}
      </Text>
      <Text style={styles.rarity}>
        {RARITY_LABEL[variety.rarity]}
        {variety.seasonal ? ` · ${variety.seasonal}` : ''}
      </Text>
    </>
  );

  if (unlocked && onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Shows this variety's details"
        style={({ pressed }) => [
          styles.tile,
          tileStyle,
          pressed && { opacity: 0.85 },
        ]}
      >
        {inner}
      </Pressable>
    );
  }

  return (
    <View style={[styles.tile, tileStyle]} accessibilityLabel={label}>
      {inner}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexBasis: '31%',
    flexGrow: 1,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1.5,
    minHeight: 110,
    justifyContent: 'center',
  },
  glyph: {
    fontSize: 30,
  },
  silhouette: {
    opacity: 0.18,
  },
  name: {
    marginTop: 6,
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
  },
  lockedName: {
    letterSpacing: 1,
  },
  rarity: {
    marginTop: 2,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.ink,
    textAlign: 'center',
  },
});
