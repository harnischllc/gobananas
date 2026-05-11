import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  ScanRecord,
  formatScanTime,
  formatScanTimeFlat,
} from '../lib/history';
import {
  STAGES,
  peakLabel,
  ratingFromStage,
  ratingLabel,
} from '../lib/stages';
import { colors, space } from '../lib/theme';
import { StageDot } from './StageDot';
import { BananaRating } from './BananaRating';

interface Props {
  record: ScanRecord;
  onPress?: () => void;
}

export function HistoryRow({ record, onPress }: Props) {
  const def = STAGES[record.stage];
  const time = formatScanTime(record.timestamp);
  const rating = ratingFromStage(record.stage);
  const ratingText = ratingLabel(rating);
  // Single accessible string for the screen reader.
  const a11yLabel =
    `Stage ${record.stage}, ${def.label}. ` +
    `${rating} out of 5, ${ratingText}. ` +
    `${peakLabel(record.stage)}. ` +
    `${formatScanTimeFlat(record.timestamp)}.`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
    >
      <StageDot stage={record.stage} />
      <View style={styles.meta}>
        <Text style={styles.name} numberOfLines={1}>
          {def.label}
        </Text>
        <View style={styles.ratingRow}>
          <BananaRating stage={record.stage} size={12} />
          <Text style={styles.sub} numberOfLines={1}>
            {' · '}
            {peakLabel(record.stage)}
          </Text>
        </View>
      </View>
      <View style={styles.timeCol}>
        <Text style={styles.timePrimary} numberOfLines={1}>
          {time.primary}
        </Text>
        {time.secondary && (
          <Text style={styles.timeSecondary} numberOfLines={1}>
            {time.secondary}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: 14,
    paddingHorizontal: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  meta: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
  },
  sub: {
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timeCol: {
    minWidth: 76, // Enough for "Yesterday" plus breathing room.
    alignItems: 'flex-end',
  },
  timePrimary: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
    textAlign: 'right',
  },
  timeSecondary: {
    fontSize: 11,
    color: colors.inkSoft,
    textAlign: 'right',
    marginTop: 1,
  },
});
