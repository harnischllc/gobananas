import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  STAGES,
  Stage,
  peakLabel,
  ratingFromStage,
  ratingLabel,
} from '../lib/stages';
import {
  ScanRecord,
  confirmBananaScan,
  isBananaScan,
  loadHistory,
  markNotBanana,
  notBananaRunEndingAt,
  updateScanCorrection,
} from '../lib/history';
import { asideFor } from '../lib/asides';
import { StageDot } from '../components/StageDot';
import { DancingBanana } from '../components/DancingBanana';
import { BananaRating } from '../components/BananaRating';
import { colors, radius, space } from '../lib/theme';
import {
  ConsentState,
  loadConsentState,
  sendCorrection,
  setConsent,
} from '../lib/corrections';

const ALL_STAGES: Stage[] = [1, 2, 3, 4, 5, 6, 7];

/** Third not-a-banana in a row (or more) gets the sharper line. */
const NOT_BANANA_ESCALATE_AT = 3;

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [record, setRecord] = useState<ScanRecord | null>(null);
  const [oddRun, setOddRun] = useState(0);
  const [consent, setConsentState] = useState<ConsentState>('unset');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    (async () => {
      const all = await loadHistory();
      setRecord(all.find((r) => r.id === id) ?? null);
      setOddRun(notBananaRunEndingAt(all, id));
    })();
  }, [id]);

  // Re-read on focus, not just mount, so the share-state text can't go stale
  // if the toggle is flipped in the You tab while a result is open.
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadConsentState().then((v) => {
        if (alive) setConsentState(v);
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  if (!record) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.loading}>Loading…</Text>
      </SafeAreaView>
    );
  }

  /** "Not a banana" from the person: the unsure answer, or the chip below the stage picker. */
  const handleNotBanana = async () => {
    const updated = await markNotBanana(record.id);
    if (updated) setRecord(updated);
  };

  if (record.unsure && !record.notBanana) {
    return (
      <QuickCheck
        record={record}
        onClose={() => router.back()}
        onYes={async () => {
          const updated = await confirmBananaScan(record.id);
          if (updated) setRecord(updated);
        }}
        onNo={handleNotBanana}
      />
    );
  }

  if (!isBananaScan(record)) {
    return (
      <OddResult record={record} run={oddRun} onClose={() => router.back()} />
    );
  }

  const def = STAGES[record.stage];
  const aside = asideFor(record.aside);

  const handleShare = async () => {
    try {
      // A shareable aside stands in for the vibe; both are self-contained.
      const tail = aside?.shareable ? aside.line : def.vibe;
      await Share.share({
        message: `🍌 My banana is ${def.label.toLowerCase()}. ${tail} (Go Bananas)`,
      });
    } catch (err) {
      console.warn(err);
    }
  };

  const send = (stage: Stage) =>
    sendCorrection({
      predictedStage: record.stage,
      correctedStage: stage,
      hue: record.hue,
      rawHue: record.rawHue,
      confidence: record.confidence,
      demo: record.demo,
      candidateFraction: record.candidateFraction,
      satMedian: record.satMedian,
    });

  const handleCorrect = async (stage: Stage) => {
    if (!record) return;
    setRecord({ ...record, corrected: stage });
    setEditing(false);
    await updateScanCorrection(record.id, stage);
    // With consent 'unset' the inline ask below takes over; with 'off' this
    // is a silent no-op inside sendCorrection and the row stays local.
    await send(stage);
  };

  /** Inline consent answer. Turning it on also sends the correction just made. */
  const handleConsent = async (on: boolean) => {
    setConsentState(on ? 'on' : 'off');
    await setConsent(on);
    if (on && record.corrected) await send(record.corrected);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: def.colorSoft }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <TopBar onClose={() => router.back()} onShare={handleShare} />

        <View style={styles.hero}>
          {/*
            Fixed-size frame so the hero doesn't jump when stage 6 swaps
            the static StageDot for the larger party banana. Both render
            inside the same 150x150 box, centered.
          */}
          <View style={styles.heroBadge}>
            {record.stage === 6 ? (
              <DancingBanana variant="party" size={70} />
            ) : (
              <StageDot stage={record.stage} size={88} />
            )}
          </View>
          <Text style={styles.stageNum}>STAGE {record.stage}</Text>
          <Text style={styles.label} accessibilityRole="header">
            {def.label}
          </Text>
          {/* An aside replaces the vibe for this scan; two italic lines halve each other. */}
          <Text style={styles.vibe}>{aside ? aside.line : def.vibe}</Text>
        </View>

        {record.imageUri && (
          <View style={styles.photoWrap}>
            <Image
              source={{ uri: record.imageUri }}
              style={styles.photo}
              resizeMode="cover"
              accessibilityLabel={`Photo of the banana you scanned at stage ${record.stage}`}
            />
          </View>
        )}

        <View style={styles.statsRow}>
          <Stat label="Peak" value={peakLabel(record.stage)} />
          <RatingStat stage={record.stage} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What this means</Text>
          <Text style={styles.cardBody}>{def.description}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Suggestions</Text>
          {def.recommendations.map((r) => (
            <Text key={r} style={styles.bullet}>
              · {r}
            </Text>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Wrong stage?</Text>
          {/*
            Diagnostic line: the hue the classifier read, how much of the
            frame was banana-colored, how saturated that was, and the stage
            it called. The two middle numbers are what diagnose a misread
            from a screenshot (the keyboard would have printed 26% / 0.11;
            a banana prints 30-50% / 0.6). The percentage that used to sit
            here was the inverted build 14 confidence number; it is gone.
          */}
          <Text style={styles.diagLine}>
            Hue{' '}
            <Text style={styles.diagValue}>
              {Math.round(record.rawHue ?? record.hue)}°
            </Text>
            {record.candidateFraction !== undefined && (
              <>
                {'  ·  '}
                <Text style={styles.diagValue}>
                  {Math.round(record.candidateFraction * 100)}%
                </Text>{' '}
                of frame
              </>
            )}
            {record.satMedian !== undefined && (
              <>
                {'  ·  '}sat{' '}
                <Text style={styles.diagValue}>{record.satMedian.toFixed(2)}</Text>
              </>
            )}
            {'  ·  '}called{' '}
            <Text style={styles.diagValue}>Stage {record.stage}</Text>
          </Text>

          {record.corrected && !editing ? (
            <View style={styles.correctDone}>
              <Text style={styles.correctThanks}>
                Logged as Stage {record.corrected} ·{' '}
                {STAGES[record.corrected].label}.
                {consent === 'on' &&
                  ' Sent anonymously to help tune the algorithm.'}
                {consent === 'off' && ' Saved on your device only.'}
              </Text>

              {consent === 'unset' && (
                <View style={styles.askWrap}>
                  <Text style={styles.askBody}>
                    Send this one in? Anonymous: the stage you picked and the
                    color we measured. No photo, no account.
                  </Text>
                  <View style={styles.askButtons}>
                    <Pressable
                      onPress={() => handleConsent(true)}
                      accessibilityRole="button"
                      accessibilityLabel="Send this correction anonymously and keep sharing on"
                      style={({ pressed }) => [
                        styles.askPrimary,
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <Text style={styles.askPrimaryText}>Send it</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleConsent(false)}
                      accessibilityRole="button"
                      accessibilityLabel="Keep corrections on this phone only"
                      style={({ pressed }) => [
                        styles.askSecondary,
                        pressed && { opacity: 0.6 },
                      ]}
                    >
                      <Text style={styles.askSecondaryText}>
                        Keep it on my phone
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              <View style={styles.doneActions}>
                <Pressable
                  onPress={() => setEditing(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Change your correction"
                  hitSlop={8}
                  style={({ pressed }) => pressed && { opacity: 0.6 }}
                >
                  <Text style={styles.correctChange}>Change</Text>
                </Pressable>
                {consent === 'off' && (
                  <Pressable
                    onPress={() => handleConsent(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Turn on anonymous sharing and send this correction"
                    hitSlop={8}
                    style={({ pressed }) => pressed && { opacity: 0.6 }}
                  >
                    <Text style={styles.correctChange}>Send anonymously</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.correctBody}>
                If that looks off, tap the stage it actually is.
              </Text>
              <View style={styles.correctOptions}>
                {ALL_STAGES.filter((s) => s !== record.stage).map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => handleCorrect(s)}
                    accessibilityRole="button"
                    accessibilityLabel={`Mark as Stage ${s}, ${STAGES[s].label}`}
                    style={({ pressed }) => [
                      styles.correctChip,
                      pressed && { opacity: 0.6 },
                    ]}
                  >
                    <View
                      style={[
                        styles.correctDot,
                        { backgroundColor: STAGES[s].color },
                      ]}
                    />
                    <Text style={styles.correctChipLabel}>
                      {STAGES[s].label}
                    </Text>
                  </Pressable>
                ))}
                {/*
                  The honest escape hatch for the lemon, the plate, the
                  keyboard that still got a stage. Local only: the backend
                  takes stages 1-7, so this is not sent (follow-up in
                  bananascanner-website).
                */}
                <Pressable
                  onPress={handleNotBanana}
                  accessibilityRole="button"
                  accessibilityLabel="Mark as not a banana"
                  style={({ pressed }) => [
                    styles.correctChip,
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <Text style={styles.correctChipGlyph}>🙊</Text>
                  <Text style={styles.correctChipLabel}>Not a banana</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Not-a-banana and unreadable-photo results. No stage, no rating, no
 * correction card (the backend only knows stages 1-7). The third monkey.
 */
function OddResult({
  record,
  run,
  onClose,
}: {
  record: ScanRecord;
  run: number;
  onClose: () => void;
}) {
  const notBanana = !!record.notBanana;
  const byUser = record.notBananaBy === 'user';
  const escalated = notBanana && !byUser && run >= NOT_BANANA_ESCALATE_AT;

  const eyebrow = notBanana ? 'NOT A BANANA' : "COULDN'T READ THAT";
  const title = notBanana ? 'Banana not found.' : 'Couldn’t read that photo.';
  const vibe = !notBanana
    ? 'The camera blinked. Try again?'
    : byUser
      ? 'Logged. The algorithm has been informed.'
      : escalated
        ? `${run} in a row. The bananas are starting to worry about you.`
        : 'Or one in witness protection.';
  const tips = notBanana
    ? [
        'Get closer. Let the banana fill the frame.',
        'Take it in daylight, by a window. Warm bulbs make everything banana-colored.',
      ]
    : [
        'Take the photo again. If it keeps happening, tell us at bananascanner.com/support.',
      ];
  const shareLine = notBanana
    ? 'I pointed Go Bananas at something that was not a banana. It noticed.'
    : 'Go Bananas could not read my photo. The banana remains a mystery.';

  const handleShare = async () => {
    try {
      await Share.share({ message: `🙊 ${shareLine} (Go Bananas)` });
    } catch (err) {
      console.warn(err);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <TopBar onClose={onClose} onShare={handleShare} />

        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Text style={styles.oddGlyph} accessibilityElementsHidden>
              {notBanana ? '🙊' : '📷'}
            </Text>
          </View>
          <Text style={styles.stageNum}>{eyebrow}</Text>
          <Text style={styles.label} accessibilityRole="header">
            {title}
          </Text>
          <Text style={styles.vibe}>{vibe}</Text>
        </View>

        {record.imageUri && (
          <View style={styles.photoWrap}>
            <Image
              source={{ uri: record.imageUri }}
              style={styles.photo}
              resizeMode="cover"
              accessibilityLabel={
                notBanana
                  ? 'The photo you scanned. It did not contain a banana.'
                  : 'The photo you scanned. It could not be read.'
              }
            />
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What now</Text>
          {tips.map((t) => (
            <Text key={t} style={styles.bullet}>
              · {t}
            </Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * The unsure band: the frame is only weakly banana-colored (blown out by a
 * window, a strong warm cast, a small banana). Ask instead of guessing. Yes
 * drops into the normal stage result with no caveat; No is a labeled
 * negative the stage picker could never collect.
 */
function QuickCheck({
  record,
  onClose,
  onYes,
  onNo,
}: {
  record: ScanRecord;
  onClose: () => void;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.yellowSoft }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.topBar}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close result"
            hitSlop={12}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="close" size={22} color={colors.ink} />
          </Pressable>
          <View />
          <View />
        </View>

        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Text style={styles.oddGlyph} accessibilityElementsHidden>
              ❓
            </Text>
          </View>
          <Text style={styles.stageNum}>QUICK CHECK</Text>
          <Text style={styles.label} accessibilityRole="header">
            Is this a banana?
          </Text>
          <Text style={styles.vibe}>Could be a banana. Could be a lamp.</Text>
        </View>

        {record.imageUri && (
          <View style={styles.photoWrap}>
            <Image
              source={{ uri: record.imageUri }}
              style={styles.photo}
              resizeMode="cover"
              accessibilityLabel="The photo you scanned."
            />
          </View>
        )}

        <View style={styles.quickButtons}>
          <Pressable
            onPress={onYes}
            accessibilityRole="button"
            accessibilityLabel="Yes, it's a banana. Show the ripeness result."
            style={({ pressed }) => [styles.quickPrimary, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.quickPrimaryText}>Yes, it's a banana</Text>
          </Pressable>
          <Pressable
            onPress={onNo}
            accessibilityRole="button"
            accessibilityLabel="No, it isn't a banana."
            style={({ pressed }) => [styles.quickSecondary, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.quickSecondaryText}>No, it isn't</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TopBar({
  onClose,
  onShare,
}: {
  onClose: () => void;
  onShare: () => void;
}) {
  return (
    <View style={styles.topBar}>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close result"
        hitSlop={12}
        style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="close" size={22} color={colors.ink} />
      </Pressable>
      <View />
      <Pressable
        onPress={onShare}
        accessibilityRole="button"
        accessibilityLabel="Share result"
        hitSlop={12}
        style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="share-outline" size={20} color={colors.ink} />
        <Text style={styles.share}>Share</Text>
      </Pressable>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function RatingStat({ stage }: { stage: Stage }) {
  const rating = ratingFromStage(stage);
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>Rating</Text>
      <View style={styles.ratingRow}>
        <BananaRating stage={stage} size={16} />
      </View>
      <Text style={styles.statValueSoft}>{ratingLabel(rating)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  loading: {
    flex: 1,
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
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  share: {
    fontSize: 15,
    color: colors.ink,
    fontWeight: '600',
  },
  hero: {
    alignItems: 'center',
    paddingVertical: space.xl,
  },
  heroBadge: {
    width: 150,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oddGlyph: {
    fontSize: 72,
    lineHeight: 88,
  },
  stageNum: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.inkSoft,
    letterSpacing: 1.6,
    marginTop: 14,
  },
  label: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 4,
    letterSpacing: -0.5,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  vibe: {
    fontSize: 15,
    color: colors.ink,
    fontStyle: 'italic',
    marginTop: 8,
    paddingHorizontal: 32,
    textAlign: 'center',
    lineHeight: 21,
  },
  photoWrap: {
    marginHorizontal: space.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.line,
  },
  photo: {
    width: '100%',
    height: 220,
  },
  statsRow: {
    flexDirection: 'row',
    gap: space.sm,
    marginHorizontal: space.md,
    marginTop: space.md,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.inkSoft,
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    marginTop: 4,
  },
  statValueSoft: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.inkSoft,
    marginTop: 2,
  },
  ratingRow: {
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.card,
    marginHorizontal: space.md,
    marginTop: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 14,
    color: colors.ink,
    lineHeight: 20,
  },
  bullet: {
    fontSize: 14,
    color: colors.ink,
    lineHeight: 22,
  },
  diagLine: {
    fontSize: 13,
    color: colors.ink,
    fontFamily: 'Courier New',
    lineHeight: 20,
  },
  diagValue: {
    fontWeight: '700',
    color: colors.ink,
  },
  correctBody: {
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 10,
    lineHeight: 18,
  },
  correctOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  correctChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  correctDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  correctChipLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.ink,
  },
  correctChipGlyph: {
    fontSize: 13,
  },
  quickButtons: {
    marginHorizontal: space.md,
    marginTop: space.lg,
    gap: 10,
  },
  quickPrimary: {
    backgroundColor: colors.ink,
    paddingVertical: 14,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  quickPrimaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  quickSecondary: {
    paddingVertical: 13,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.ink,
    alignItems: 'center',
  },
  quickSecondaryText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '600',
  },
  correctDone: {
    marginTop: 10,
    gap: 10,
    alignItems: 'flex-start',
  },
  correctThanks: {
    fontSize: 13.5,
    color: colors.ink,
    lineHeight: 19,
  },
  doneActions: {
    flexDirection: 'row',
    gap: 18,
  },
  correctChange: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brown,
  },
  askWrap: {
    alignSelf: 'stretch',
    backgroundColor: colors.yellowSoft,
    borderRadius: radius.sm,
    padding: 12,
    gap: 10,
  },
  askBody: {
    fontSize: 13.5,
    color: colors.ink,
    lineHeight: 19,
  },
  askButtons: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  askPrimary: {
    backgroundColor: colors.ink,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
  },
  askPrimaryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  askSecondary: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  askSecondaryText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
});
