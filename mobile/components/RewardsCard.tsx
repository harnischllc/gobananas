import { View, Text, StyleSheet, Pressable } from 'react-native';
import { totalUnlockable } from '../lib/drops';
import { colors, radius, space } from '../lib/theme';

/**
 * The Daily-Scan Rewards card. Tapping it opens the rewards / crate modal.
 * Lives on both the home tab and the You tab so the daily crate is easy to
 * find. The screen owns the state (streak / claim / collection) and passes
 * it in.
 */
interface Props {
  streakCurrent: number;
  canClaim: boolean;
  collectionCount: number;
  onPress: () => void;
}

export function RewardsCard({
  streakCurrent,
  canClaim,
  collectionCount,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        canClaim
          ? "Open today's crate"
          : `Open rewards. Current streak ${streakCurrent} days.`
      }
      style={({ pressed }) => [styles.rewardsCard, pressed && { opacity: 0.92 }]}
    >
      <View style={styles.rewardsTopRow}>
        <View style={styles.rewardsStreakChip}>
          <Text style={styles.rewardsStreakGlyph}>🔥</Text>
          <Text style={styles.rewardsStreakText}>
            {streakCurrent > 0
              ? `${streakCurrent}-day streak`
              : 'Start a streak'}
          </Text>
        </View>
        {canClaim && (
          <View style={styles.rewardsClaimPill}>
            <Text style={styles.rewardsClaimText}>📦 OPEN TODAY</Text>
          </View>
        )}
      </View>
      <Text style={styles.rewardsCaption}>
        One crate a day. Build the collection, snag a hammock, keep the streak
        alive.
      </Text>
      <View style={styles.rewardsBottomRow}>
        <Text style={styles.rewardsCollection}>
          Collection {collectionCount} / {totalUnlockable()}
        </Text>
        <Text style={styles.rewardsCta}>Open ›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rewardsCard: {
    marginHorizontal: space.md,
    backgroundColor: colors.yellowSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.md,
  },
  rewardsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rewardsStreakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFFCC',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  rewardsStreakGlyph: {
    fontSize: 14,
  },
  rewardsStreakText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.ink,
  },
  rewardsClaimPill: {
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  rewardsClaimText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: colors.ink,
  },
  rewardsCaption: {
    fontSize: 13,
    color: colors.ink,
    lineHeight: 18,
    marginTop: 10,
  },
  rewardsBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  rewardsCollection: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.inkSoft,
    fontVariant: ['tabular-nums'],
  },
  rewardsCta: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brown,
  },
});
