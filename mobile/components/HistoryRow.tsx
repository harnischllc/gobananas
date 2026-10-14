import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  ScanRecord,
  formatScanTime,
  formatScanTimeFlat,
  isBananaScan,
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
  const time = formatScanTime(record.timestamp);

  if (!isBananaScan(record)) {
    return <OddRow record={record} time={time} onPress={onPress} />;
  }

  const def = STAGES[record.stage];
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
      <TimeCol time={time} />
    </Pressable>
  );
}

/**
 * Not-a-banana and unreadable-photo rows. No stage, no rating: the third
 * monkey instead of a stage dot, and a one-line reason.
 */
function OddRow({
  record,
  time,
  onPress,
}: {
  record: ScanRecord;
  time: ReturnType<typeof formatScanTime>;
  onPress?: () => void;
}) {
  const notBanana = !!record.notBanana;
  const unsure = !notBanana && !!record.unsure;
  const title = unsure
    ? 'Is this a banana?'
    : notBanana
      ? 'Not a banana'
      : "Couldn't read photo";
  const sub = unsure
    ? 'Tap to answer'
    : notBanana
      ? 'Nothing banana-colored in frame'
      : 'The camera blinked. Try again.';
  const glyph = unsure ? '❓' : notBanana ? '🙊' : '📷';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${sub}. ${formatScanTimeFlat(record.timestamp)}.`}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
    >
      <View
        style={styles.oddDot}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Text style={styles.oddGlyph}>{glyph}</Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.name} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {sub}
        </Text>
      </View>
      <TimeCol time={time} />
    </Pressable>
  );
}

function TimeCol({ time }: { time: ReturnType<typeof formatScanTime> }) {
  return (
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
  oddDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oddGlyph: {
    fontSize: 18,
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
