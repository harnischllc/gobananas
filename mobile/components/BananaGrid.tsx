import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  Banana,
  ENVIRONMENTS,
  ripenessToStage,
} from '../lib/pet';
import { STAGES } from '../lib/stages';
import { colors, radius, space } from '../lib/theme';

/**
 * 3-column grid of bananas in the bunch. Each tile shows:
 *   - A small banana glyph (emoji) tinted/faded by stage
 *   - The banana's first name
 *   - A tiny env glyph + ripeness percent
 * Selected tile has a yellow border. Dead bananas fade out.
 */
interface Props {
  bananas: Banana[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function BananaGrid({ bananas, selectedId, onSelect }: Props) {
  return (
    <View style={styles.grid}>
      {bananas.map((b) => (
        <Tile
          key={b.id}
          banana={b}
          selected={b.id === selectedId}
          onPress={() => onSelect(b.id)}
        />
      ))}
    </View>
  );
}

function Tile({
  banana,
  selected,
  onPress,
}: {
  banana: Banana;
  selected: boolean;
  onPress: () => void;
}) {
  const stage = ripenessToStage(banana.ripeness);
  const def = STAGES[stage];
  const env = ENVIRONMENTS[banana.environment];
  const ripenessPct = Math.round(banana.ripeness);
  const dead = !banana.alive;
  const tucked = !!banana.protected && banana.alive;

  const accessibilityLabel = dead
    ? `${banana.name}, gone (${banana.end_reason ?? 'ended'})`
    : `${banana.name}, stage ${stage} ${def.label}, ${ripenessPct} percent ripe, ${env.label}`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: dead ? colors.line : def.colorSoft },
        selected && styles.selected,
        pressed && { opacity: 0.7 },
        dead && styles.deadTile,
      ]}
    >
      {tucked && <Text style={styles.hammockBadge}>🪢</Text>}
      <Text style={[styles.glyph, dead && styles.deadGlyph]}>🍌</Text>
      <Text
        style={[styles.name, dead && styles.deadText]}
        numberOfLines={1}
      >
        {banana.name}
      </Text>
      {dead ? (
        <Text style={styles.deadReason}>{banana.end_reason ?? '—'}</Text>
      ) : (
        <View style={styles.metaRow}>
          <Text style={styles.metaGlyph}>{env.glyph}</Text>
          <Text style={[styles.metaText, { color: def.color }]}>
            {ripenessPct}%
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: space.md,
    marginTop: space.md,
  },
  tile: {
    // Three-column grid. Fixed basis with no flexGrow so an orphan tile
    // in a partial row (e.g. the 7th banana) stays the same width as the
    // others instead of stretching to fill the row.
    flexBasis: '31%',
    flexGrow: 0,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: colors.accent,
  },
  deadTile: {
    opacity: 0.6,
  },
  glyph: {
    fontSize: 30,
  },
  deadGlyph: {
    opacity: 0.5,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 4,
  },
  deadText: {
    color: colors.inkSoft,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  metaGlyph: {
    fontSize: 12,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  deadReason: {
    fontSize: 10,
    color: colors.inkSoft,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '700',
  },
  hammockBadge: {
    position: 'absolute',
    top: 4,
    right: 6,
    fontSize: 14,
  },
});
