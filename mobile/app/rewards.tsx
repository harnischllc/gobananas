import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { CrateOpen } from '../components/CrateOpen';
import { VarietyCard } from '../components/VarietyCard';
import { VarietyDetail } from '../components/VarietyDetail';
import {
  VARIETIES,
  loadCollection,
  loadDropHistory,
  openCrate,
  clearCollection,
  totalUnlockable,
  RARITY_COLOR,
  currentSeason,
  type DropResult,
  type Variety,
} from '../lib/drops';
import {
  ClaimGate,
  StreakState,
  evaluateClaim,
  claim,
  loadStreak,
  streakHeadline,
  daysToWeek,
  daysToMonth,
  demoAdvanceDay,
  demoResetCalendar,
  clearStreak,
  effectiveToday,
} from '../lib/streak';
import { clearHammock } from '../lib/hammock';
import { colors, radius, space, shadow } from '../lib/theme';

/**
 * Rewards screen — v2.0 demo. Modal route presented from the You tab.
 *
 * Layout:
 *   1. Header with streak + best + next-milestone progress
 *   2. Today's crate (gated by daily-claim) OR a "come back tomorrow" state
 *   3. Variety collection grid (unlocked + silhouettes)
 *   4. Recent drops history
 *   5. Demo controls (advance day, reset)
 */
export default function RewardsScreen() {
  const router = useRouter();
  const [streak, setStreak] = useState<StreakState | null>(null);
  const [gate, setGate] = useState<ClaimGate | null>(null);
  const [collection, setCollection] = useState<string[]>([]);
  const [history, setHistory] = useState<DropResult[]>([]);
  const [today, setToday] = useState<string>('');
  const [opening, setOpening] = useState(false);
  const [selected, setSelected] = useState<Variety | null>(null);

  const refresh = useCallback(async () => {
    const [s, g, c, h, t] = await Promise.all([
      loadStreak(),
      evaluateClaim(),
      loadCollection(),
      loadDropHistory(),
      effectiveToday(),
    ]);
    setStreak(s);
    setGate(g);
    setCollection(c);
    setHistory(h);
    setToday(t);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleStartOpen = () => {
    if (!gate?.canClaim) return;
    setOpening(true);
  };

  const handleCrateOpen = async (): Promise<DropResult> => {
    // Claim the streak first so it advances even if the user closes
    // the app mid-animation.
    await claim();
    return openCrate();
  };

  const handleCrateComplete = async () => {
    setOpening(false);
    await refresh();
  };

  const handleAdvanceDay = async () => {
    await demoAdvanceDay();
    await refresh();
  };

  const handleResetAll = () => {
    Alert.alert(
      'Reset everything?',
      'Clears your streak, collection, drop history, and any demo day-offset.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await Promise.all([
              clearStreak(),
              clearCollection(),
              demoResetCalendar(),
              clearHammock(),
            ]);
            await refresh();
          },
        },
      ],
    );
  };

  const season = currentSeason();
  const totalCount = totalUnlockable();
  const unlockedCount = collection.length;

  if (!streak || !gate) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Text style={styles.loading}>Loading…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Close rewards"
            hitSlop={12}
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Ionicons name="close" size={22} color={colors.ink} />
          </Pressable>
          <Text style={styles.topTitle}>Rewards</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Streak header */}
        <View style={[styles.streakCard, shadow.card]}>
          <Text style={styles.streakHeadline}>
            {streakHeadline(streak.current)}
          </Text>
          <Text style={styles.streakSub}>
            Best: {streak.best} · Total days: {streak.total_days}
          </Text>
          <View style={styles.milestoneRow}>
            <Milestone
              label="To perfect week"
              value={daysToWeek(streak.current)}
              accent="🔥"
            />
            <Milestone
              label="To perfect month"
              value={daysToMonth(streak.current)}
              accent="🎉"
            />
          </View>
        </View>

        {/* Today's crate */}
        {opening ? (
          <CrateOpen onOpen={handleCrateOpen} onComplete={handleCrateComplete} />
        ) : gate.canClaim ? (
          <View style={[styles.crateCta, shadow.card]}>
            <Text style={styles.crateCtaTitle}>📦 Today's crate</Text>
            <Text style={styles.crateCtaBody}>
              {gate.continuesStreak
                ? `Open it to extend your streak to ${gate.willBecome} days.`
                : `Open it to start a fresh streak.`}
            </Text>
            <Pressable
              onPress={handleStartOpen}
              accessibilityRole="button"
              accessibilityLabel="Open today's crate"
              style={({ pressed }) => [
                styles.openBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.openBtnText}>Open it</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.tomorrowCard, shadow.card]}>
            <Text style={styles.tomorrowTitle}>Already opened today</Text>
            <Text style={styles.tomorrowBody}>
              Come back tomorrow for the next crate. Your streak is safe — just
              don't miss a day.
            </Text>
            <Text style={styles.tomorrowDate}>Today: {today}</Text>
          </View>
        )}

        {/* Season banner */}
        {season && (
          <View style={styles.seasonBanner}>
            <Text style={styles.seasonGlyph}>
              {season === 'halloween'
                ? '🎃'
                : season === 'christmas'
                  ? '🎄'
                  : season === 'thanksgiving'
                    ? '🦃'
                    : season === 'valentines'
                      ? '💌'
                      : '☀️'}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.seasonTitle}>
                {season[0].toUpperCase() + season.slice(1)} drops are active
              </Text>
              <Text style={styles.seasonBody}>
                Seasonal varieties have a chance to appear in today's crate.
              </Text>
            </View>
          </View>
        )}

        {/* Collection */}
        <Text style={styles.sectionTitle}>
          COLLECTION · {unlockedCount}/{totalCount}
        </Text>
        <View style={styles.grid}>
          {VARIETIES.map((v) => (
            <VarietyCard
              key={v.id}
              variety={v}
              unlocked={collection.includes(v.id)}
              onPress={() => setSelected(v)}
            />
          ))}
        </View>

        {/* Drop history */}
        {history.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>RECENT DROPS</Text>
            <View style={[styles.historyCard, { borderColor: colors.line }]}>
              {history.slice(0, 6).map((h, i) => (
                <Pressable
                  key={`${h.iso}-${i}`}
                  onPress={() => setSelected(h.variety)}
                  accessibilityRole="button"
                  accessibilityLabel={`${h.variety.name}, view details`}
                  style={({ pressed }) => [
                    styles.historyRow,
                    i === Math.min(history.length, 6) - 1 && {
                      borderBottomWidth: 0,
                    },
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <Text style={styles.historyGlyph}>{h.variety.glyph}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyName}>{h.variety.name}</Text>
                    <Text style={styles.historyFlavor} numberOfLines={1}>
                      {h.variety.flavor}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.historyRarity,
                      { backgroundColor: RARITY_COLOR[h.variety.rarity] },
                    ]}
                  />
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Demo controls — testers don't see these in production builds. */}
        {__DEV__ && (
          <>
            <Text style={styles.sectionTitle}>🙊 DEMO CONTROLS</Text>
            <View style={[styles.demoCard, { borderColor: colors.line }]}>
              <Pressable
                onPress={handleAdvanceDay}
                accessibilityRole="button"
                accessibilityLabel="Advance to tomorrow"
                style={({ pressed }) => [
                  styles.demoBtn,
                  pressed && { opacity: 0.6 },
                ]}
              >
                <Text style={styles.demoBtnText}>Skip to tomorrow ⏭️</Text>
                <Text style={styles.demoBtnSub}>
                  Lets you re-open today's crate. Streak math still applies.
                </Text>
              </Pressable>
              <View style={styles.demoDivider} />
              <Pressable
                onPress={handleResetAll}
                accessibilityRole="button"
                accessibilityLabel="Reset all reward state"
                style={({ pressed }) => [
                  styles.demoBtn,
                  pressed && { opacity: 0.6 },
                ]}
              >
                <Text style={[styles.demoBtnText, { color: colors.brown }]}>
                  Reset everything 🗑️
                </Text>
                <Text style={styles.demoBtnSub}>
                  Clears streak, collection, history, and the day offset.
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      <VarietyDetail variety={selected} onClose={() => setSelected(null)} />
    </SafeAreaView>
  );
}

function Milestone({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <View style={styles.milestone}>
      <Text style={styles.milestoneValue}>
        {value} {accent}
      </Text>
      <Text style={styles.milestoneLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loading: {
    textAlign: 'center',
    marginTop: 80,
    color: colors.inkSoft,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingTop: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
  },

  streakCard: {
    marginHorizontal: space.md,
    marginTop: space.md,
    backgroundColor: colors.yellowSoft,
    borderRadius: radius.xl,
    padding: space.lg,
    alignItems: 'center',
  },
  streakHeadline: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  streakSub: {
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 4,
    fontWeight: '600',
  },
  milestoneRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    width: '100%',
  },
  milestone: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  milestoneValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  milestoneLabel: {
    fontSize: 10,
    color: colors.inkSoft,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginTop: 2,
    textTransform: 'uppercase',
  },

  crateCta: {
    marginHorizontal: space.md,
    marginTop: space.md,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: space.lg,
    alignItems: 'center',
  },
  crateCtaTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
  },
  crateCtaBody: {
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 4,
    textAlign: 'center',
  },
  openBtn: {
    marginTop: 14,
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  openBtnText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },

  tomorrowCard: {
    marginHorizontal: space.md,
    marginTop: space.md,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: space.lg,
    alignItems: 'center',
  },
  tomorrowTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  tomorrowBody: {
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  tomorrowDate: {
    marginTop: 8,
    fontSize: 11,
    color: colors.inkSoft,
    fontVariant: ['tabular-nums'],
  },

  seasonBanner: {
    marginHorizontal: space.md,
    marginTop: space.md,
    backgroundColor: colors.greenSoft,
    borderRadius: radius.lg,
    padding: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  seasonGlyph: {
    fontSize: 28,
  },
  seasonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  seasonBody: {
    fontSize: 12,
    color: colors.ink,
    marginTop: 2,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.inkSoft,
    paddingHorizontal: space.lg,
    marginTop: space.xl,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: space.md,
  },

  historyCard: {
    marginHorizontal: space.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  historyGlyph: {
    fontSize: 22,
  },
  historyName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  historyFlavor: {
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
  },
  historyRarity: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  demoCard: {
    marginHorizontal: space.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  demoBtn: {
    paddingHorizontal: space.md,
    paddingVertical: 14,
  },
  demoBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  demoBtnSub: {
    fontSize: 11,
    color: colors.inkSoft,
    marginTop: 2,
    fontStyle: 'italic',
  },
  demoDivider: {
    height: 1,
    backgroundColor: colors.line,
  },
});
