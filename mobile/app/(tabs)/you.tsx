import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

import { colors, radius, space } from '../../lib/theme';
import { RewardsCard } from '../../components/RewardsCard';
import {
  DEFAULT_GAME_SPEED,
  GAME_SPEEDS,
  GAME_SPEED_ORDER,
  GameSpeed,
  loadPrefs,
  setDefaultGameSpeed,
} from '../../lib/pet';
import { loadCollection } from '../../lib/drops';
import {
  evaluateClaim,
  loadStreak,
} from '../../lib/streak';
import { loadConsent, setConsent } from '../../lib/corrections';

/**
 * Settings for v1. Surfaces:
 *  - Corrections opt-in: persisted consent for the anonymous corrections
 *    loop (lib/corrections). When on, correcting a stage on a result sends
 *    the hue and stages to the backend.
 *  - Game speed: ripening pace for the next bunch.
 *  - About / version / links.
 *
 * Eventually: notifications, account, share-with-roommate.
 */
function AboutLink({ label, url }: { label: string; url: string }) {
  return (
    <Pressable
      onPress={() => Linking.openURL(url)}
      accessibilityRole="link"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [
        styles.aboutLinkRow,
        pressed && { opacity: 0.6 },
      ]}
    >
      <Text style={styles.aboutLink}>{label}</Text>
    </Pressable>
  );
}

export default function YouScreen() {
  const router = useRouter();
  const [optIn, setOptIn] = useState(false);
  const [gameSpeed, setGameSpeed] =
    useState<GameSpeed>(DEFAULT_GAME_SPEED);
  const [streakCurrent, setStreakCurrent] = useState(0);
  const [canClaim, setCanClaim] = useState(false);
  const [collectionCount, setCollectionCount] = useState(0);

  // Load static prefs once on mount.
  useEffect(() => {
    (async () => {
      const prefs = await loadPrefs();
      setGameSpeed(prefs.default_game_speed);
      setOptIn(await loadConsent());
    })();
  }, []);

  // Refresh streak / collection on every focus so coming back from the
  // rewards modal shows the new state without a manual reload.
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const [streak, gate, collection] = await Promise.all([
          loadStreak(),
          evaluateClaim(),
          loadCollection(),
        ]);
        if (!alive) return;
        setStreakCurrent(streak.current);
        setCanClaim(gate.canClaim);
        setCollectionCount(collection.length);
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  const handleSelectSpeed = async (speed: GameSpeed) => {
    setGameSpeed(speed);
    await setDefaultGameSpeed(speed);
  };

  const handleToggleOptIn = async (on: boolean) => {
    setOptIn(on);
    await setConsent(on);
  };

  const openRewards = () => {
    router.push('/rewards');
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DAILY-SCAN REWARDS</Text>
          <RewardsCard
            streakCurrent={streakCurrent}
            canClaim={canClaim}
            collectionCount={collectionCount}
            onPress={openRewards}
          />
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
                onValueChange={handleToggleOptIn}
                trackColor={{ false: colors.line, true: colors.accent }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.optInLinkWrap}>
              <AboutLink
                label="Read the privacy policy"
                url="https://bananascanner.com/privacy"
              />
            </View>
          </View>
          <Text style={styles.note}>
            On by choice. When it's on, correcting a stage on a result sends
            just the hue and the stages, never a photo or an account, to help
            tune the algorithm.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <View style={styles.card}>
            <Text style={styles.aboutTitle}>Go Bananas</Text>
            <Text style={styles.aboutTagline}>
              Catch every banana at its peak.
            </Text>
            <Text style={styles.aboutBody}>
              On-device ripeness scanning. Photos never leave your phone.
            </Text>

            <View style={styles.linkList}>
              <AboutLink
                label="bananascanner.com"
                url="https://bananascanner.com/"
              />
              <AboutLink
                label="Privacy policy"
                url="https://bananascanner.com/privacy"
              />
              <AboutLink
                label="Support & contact"
                url="https://bananascanner.com/support"
              />
              <AboutLink
                label="Email info@harnischllc.com"
                url="mailto:info@harnischllc.com"
              />
            </View>

            <Text style={styles.aboutFooter}>
              Published by{' '}
              <Text
                style={styles.aboutFooterLink}
                onPress={() => Linking.openURL('https://harnischllc.com')}
                accessibilityRole="link"
              >
                Harnisch LLC
              </Text>
              .
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optInLinkWrap: {
    marginTop: 10,
    alignSelf: 'flex-start',
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
  aboutTagline: {
    fontSize: 13.5,
    fontStyle: 'italic',
    color: colors.ink,
    marginTop: 4,
    lineHeight: 18,
  },
  aboutBody: {
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 4,
    lineHeight: 18,
  },
  linkList: {
    marginTop: 12,
    gap: 6,
  },
  aboutLinkRow: {
    paddingVertical: 4,
  },
  aboutLink: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.brown,
    textDecorationLine: 'underline',
  },
  aboutFooter: {
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 14,
    lineHeight: 17,
  },
  aboutFooterLink: {
    color: colors.brown,
    textDecorationLine: 'underline',
    fontWeight: '600',
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
