import { View, Text, StyleSheet } from 'react-native';
import { BunchEvent } from '../lib/pet';
import { colors, radius, space } from '../lib/theme';

interface Props {
  events: BunchEvent[];
  /** Most recent first; cap how many to show. */
  limit?: number;
}

/**
 * The pet's diary. Most recent first. Each row: glyph, detail, time-ago.
 */
export function PetEventLog({ events, limit = 5 }: Props) {
  const shown = [...events].reverse().slice(0, limit);

  if (shown.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>STORY SO FAR</Text>
      <View style={styles.card}>
        {shown.map((ev, i) => (
          <View
            key={`${ev.iso}-${i}`}
            style={[styles.row, i === shown.length - 1 && styles.rowLast]}
          >
            <Text style={styles.glyph}>{ev.glyph ?? '·'}</Text>
            <Text style={styles.detail}>{ev.detail}</Text>
            <Text style={styles.ago}>{timeAgo(ev.iso)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function timeAgo(iso: string): string {
  const sec = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${Math.round(sec)}s ago`;
  if (sec < 3600) return `${Math.round(sec / 60)}m ago`;
  return `${Math.round(sec / 3600)}h ago`;
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: space.md,
    paddingHorizontal: space.md,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.inkSoft,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  glyph: {
    fontSize: 16,
    width: 22,
    textAlign: 'center',
  },
  detail: {
    flex: 1,
    fontSize: 13,
    color: colors.ink,
    lineHeight: 18,
  },
  ago: {
    fontSize: 11,
    color: colors.inkSoft,
    fontWeight: '600',
  },
});
