import { View, Text, StyleSheet } from 'react-native';
import { Variety, RARITY_COLOR, RARITY_LABEL } from '../lib/drops';
import { colors, radius } from '../lib/theme';

interface Props {
  variety: Variety;
  unlocked: boolean;
}

/**
 * Collection grid tile. Locked = silhouette glyph + name hidden as
 * "???" + rarity hint. Unlocked = full color + name.
 */
export function VarietyCard({ variety, unlocked }: Props) {
  const rarityColor = RARITY_COLOR[variety.rarity];

  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: unlocked ? variety.colorSoft : '#eceae3',
          borderColor: unlocked ? rarityColor : colors.line,
        },
      ]}
      accessibilityLabel={
        unlocked
          ? `${variety.name}, ${RARITY_LABEL[variety.rarity]}, unlocked`
          : `Locked ${RARITY_LABEL[variety.rarity]} variety${
              variety.seasonal ? `, drops only during ${variety.seasonal}` : ''
            }`
      }
    >
      <Text style={[styles.glyph, !unlocked && styles.silhouette]}>
        {unlocked ? variety.glyph : '🍌'}
      </Text>
      <Text
        style={[styles.name, !unlocked && styles.lockedName]}
        numberOfLines={1}
      >
        {unlocked ? variety.name : '???'}
      </Text>
      <Text
        style={[
          styles.rarity,
          { color: unlocked ? rarityColor : colors.inkSoft },
        ]}
      >
        {RARITY_LABEL[variety.rarity]}
        {variety.seasonal ? ` · ${variety.seasonal}` : ''}
      </Text>
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
  },
  lockedName: {
    color: colors.inkSoft,
    letterSpacing: 1,
  },
  rarity: {
    marginTop: 2,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
