import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';

import { colors, radius, space } from '../../lib/theme';
import {
  DEFAULT_GAME_SPEED,
  GAME_SPEEDS,
  GAME_SPEED_ORDER,
  GameSpeed,
  loadPrefs,
  setDefaultGameSpeed,
} from '../../lib/pet';
import { VarietyCard } from '../../components/VarietyCard';
import { VARIETIES } from '../../lib/drops';

/**
 * Stub for v1. Real surfaces this will hold:
 *  - Corrections opt-in (the feedback loop toggle)
 *  - Notifications (peak-banana reminders, eventually)
 *  - About / version / open-source credits
 *  - Eventually: account, streaks, share-with-roommate
 *
 * For the demo build the toggle does nothing — it's there to anchor the
 * conversation about how the consent UX should feel, not to ship a feature.
 */
export default function YouScreen() {
  const [optIn, setOptIn] = useState(false);
  const [gameSpeed, setGameSpeed] =
    useState<GameSpeed>(DEFAULT_GAME_SPEED);

  useEffect(() => {
    (async () => {
      const prefs = await loadPrefs();
      setGameSpeed(prefs.default_game_speed);
    })();
  }, []);

  const handleSelectSpeed = async (speed: GameSpeed) => {
    setGameSpeed(speed);
    await setDefaultGameSpeed(speed);
  };

  const currentSpeedDef = GAME_SPEEDS[gameSpeed];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.head}>
          <Text style={styles.title} accessibilityRole="header">
            You
          </Text>
          <Text style={styles.lede}>
            v1 doesn't need an account. Settings live here once we have any.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GAME SPEED</Text>
          <View style={styles.card}>
            <Text style={styles.speedHead}>
              How fast should the bunch ripen?
            </Text>
            <Text style={styles.speedSub}>
              Applies to your next bunch. Current bunch keeps its speed.
            </Text>
            <View style={styles.speedRow}>
              {GAME_SPEED_ORDER.map((id) => {
                const def = GAME_SPEEDS[id];
                const active = gameSpeed === id;
                return (
                  <Pressable
                    key={id}
                    onPress={() => handleSelectSpeed(id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${def.label}: ${def.blurb}`}
                    style={({ pressed }) => [
                      styles.speedChip,
                      active && styles.speedChipActive,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.speedChipLabel,
                        active && styles.speedChipLabelActive,
                      ]}
                    >
                      {def.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.speedBlurb}>{currentSpeedDef.blurb}</Text>
          </View>
        </View>

        {/*
          Sneak-peek at v1.1's daily-scan rewards. Always visible, but
          visually recedes from the live settings cards (bg fill + dashed
          border) so it reads as "preview, not interactive."
        */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            COMING SOON · DAILY-SCAN REWARDS
          </Text>
          <View
            style={styles.previewCard}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel="Coming soon: daily scan rewards, drops, and varieties. Preview only, not interactive in this build."
          >
            <View style={styles.previewStreakChip}>
              <Text style={styles.previewStreakGlyph}>🔥</Text>
              <Text style={styles.previewStreakText}>Streak</Text>
              <View style={styles.previewTagPill}>
                <Text style={styles.previewTagText}>PREVIEW</Text>
              </View>
            </View>

            <Text style={styles.previewCaption}>
              One scan a day unlocks a crate. Keep the streak alive. Build the
              collection.
            </Text>

            <View style={styles.previewCrateRow}>
              <View style={styles.previewCrateWrap}>
                <Text style={styles.previewCrateGlyph}>📦</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.previewCrateTitle}>Today's crate</Text>
                <Text style={styles.previewCrateSub}>
                  Drops when v1.1 ships.
                </Text>
              </View>
            </View>

            <View
              pointerEvents="none"
              style={styles.previewVarietyRow}
              accessibilityElementsHidden={true}
              importantForAccessibility="no-hide-descendants"
            >
              {['baboon_delight', 'yellow_scorcher', 'lunar_banana'].map(
                (id) => {
                  const variety = VARIETIES.find((v) => v.id === id);
                  if (!variety) return null;
                  return (
                    <VarietyCard
                      key={id}
                      variety={variety}
                      unlocked={false}
                    />
                  );
                },
              )}
            </View>

            <Text style={styles.previewFootnote}>
              Preview only. Nothing's wired up yet.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HELP US GET SMARTER</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.toggleTitle}>Send anonymous corrections</Text>
                <Text style={styles.toggleSub}>
                  When you tap "Actually it was Stage X" on a result, we'll
                  send the predicted hue, predicted stage, and your correction
                  to help tune the algorithm. No photos, no account, no
                  tracking.
                </Text>
              </View>
              <Switch
                value={optIn}
                onValueChange={setOptIn}
                trackColor={{ false: colors.line, true: colors.accent }}
                thumbColor="#fff"
              />
            </View>
          </View>
          <Text style={styles.note}>
            Coming soon: anonymous corrections will help tune the algorithm.
            Toggle on to opt in early.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <View style={styles.card}>
            <Text style={styles.aboutTitle}>Go Bananas</Text>
            <Text style={styles.aboutBody}>
              On-device banana ripeness scanning. Photos never leave your
              phone. More at bananascanner.com.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  head: {
    paddingHorizontal: space.lg,
    paddingTop: 12,
    paddingBottom: space.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.ink,
    marginBottom: 6,
  },
  lede: {
    fontSize: 14,
    color: colors.inkSoft,
    lineHeight: 20,
  },
  section: {
    marginTop: space.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.inkSoft,
    paddingHorizontal: space.lg,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.card,
    marginHorizontal: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.md,
  },
  previewCard: {
    backgroundColor: colors.bg,
    marginHorizontal: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: 'dashed',
    padding: space.md,
  },
  previewStreakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.line,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  previewStreakGlyph: {
    fontSize: 14,
  },
  previewStreakText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.inkSoft,
  },
  previewTagPill: {
    backgroundColor: colors.bg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  previewTagText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.inkSoft,
  },
  previewCaption: {
    fontSize: 12.5,
    color: colors.inkSoft,
    lineHeight: 17,
    marginTop: 10,
  },
  previewCrateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },
  previewCrateWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCrateGlyph: {
    fontSize: 22,
    opacity: 0.55,
  },
  previewCrateTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.inkSoft,
  },
  previewCrateSub: {
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
  },
  previewVarietyRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    opacity: 0.55,
  },
  previewFootnote: {
    fontSize: 11,
    color: colors.inkSoft,
    fontStyle: 'italic',
    marginTop: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  toggleSub: {
    fontSize: 12.5,
    color: colors.inkSoft,
    marginTop: 4,
    lineHeight: 17,
  },
  note: {
    fontSize: 11,
    color: colors.inkSoft,
    fontStyle: 'italic',
    paddingHorizontal: space.lg,
    marginTop: 6,
  },
  aboutTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  aboutBody: {
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 4,
    lineHeight: 18,
  },
  speedHead: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  speedSub: {
    fontSize: 12.5,
    color: colors.inkSoft,
    marginTop: 4,
    lineHeight: 17,
  },
  speedRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  speedChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
  },
  speedChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  speedChipLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.inkSoft,
  },
  speedChipLabelActive: {
    color: colors.ink,
  },
  speedBlurb: {
    fontSize: 12,
    color: colors.inkSoft,
    fontStyle: 'italic',
    marginTop: 10,
    lineHeight: 16,
  },
});
