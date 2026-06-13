import { useEffect, useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  STAGES,
  Stage,
  peakLabel,
  ratingFromStage,
  ratingLabel,
} from '../lib/stages';
import { ScanRecord, loadHistory, updateScanCorrection } from '../lib/history';
import { StageDot } from '../components/StageDot';
import { DancingBanana } from '../components/DancingBanana';
import { BananaRating } from '../components/BananaRating';
import { colors, radius, space } from '../lib/theme';
import { loadConsent, sendCorrection } from '../lib/corrections';

const ALL_STAGES: Stage[] = [1, 2, 3, 4, 5, 6, 7];

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [record, setRecord] = useState<ScanRecord | null>(null);
  const [consentOn, setConsentOn] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    (async () => {
      const all = await loadHistory();
      setRecord(all.find((r) => r.id === id) ?? null);
    })();
  }, [id]);

  useEffect(() => {
    loadConsent().then(setConsentOn);
  }, []);

  if (!record) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.loading}>Loading…</Text>
      </SafeAreaView>
    );
  }

  const def = STAGES[record.stage];

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🍌 My banana is ${def.label.toLowerCase()} — ${def.vibe} (Go Bananas)`,
      });
    } catch (err) {
      console.warn(err);
    }
  };

  const handleCorrect = async (stage: Stage) => {
    if (!record) return;
    setRecord({ ...record, corrected: stage });
    setEditing(false);
    await updateScanCorrection(record.id, stage);
    await sendCorrection({
      predictedStage: record.stage,
      correctedStage: stage,
      hue: record.hue,
      confidence: record.confidence,
      demo: record.demo,
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: def.colorSoft }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Close result"
            hitSlop={12}
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Ionicons name="close" size={22} color={colors.ink} />
          </Pressable>
          <View />
          <Pressable
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel="Share result"
            hitSlop={12}
            style={({ pressed }) => [
              styles.shareBtn,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Ionicons
              name="share-outline"
              size={20}
              color={colors.ink}
            />
            <Text style={styles.share}>Share</Text>
          </Pressable>
        </View>

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
          <Text style={styles.vibe}>{def.vibe}</Text>
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
          <Text style={styles.diagLine}>
            Hue <Text style={styles.diagValue}>{Math.round(record.hue)}°</Text>
            {'   ·   '}called{' '}
            <Text style={styles.diagValue}>Stage {record.stage}</Text>
            {'   ·   '}
            <Text style={styles.diagValue}>
              {Math.round(record.confidence)}%
            </Text>
          </Text>

          {record.corrected && !editing ? (
            <View style={styles.correctDone}>
              <Text style={styles.correctThanks}>
                Logged as Stage {record.corrected} ·{' '}
                {STAGES[record.corrected].label}.{' '}
                {consentOn
                  ? 'Sent anonymously to help tune the algorithm.'
                  : 'Saved on your device only.'}
              </Text>
              <Pressable
                onPress={() => setEditing(true)}
                accessibilityRole="button"
                accessibilityLabel="Change your correction"
                hitSlop={8}
                style={({ pressed }) => pressed && { opacity: 0.6 }}
              >
                <Text style={styles.correctChange}>Change</Text>
              </Pressable>
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
              </View>
              {!consentOn && (
                <Text style={styles.correctHint}>
                  Sharing is off, so this only saves on your phone. Turn on
                  "Send anonymous corrections" in the You tab to help tune the
                  algorithm.
                </Text>
              )}
            </>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
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
  correctHint: {
    fontSize: 11.5,
    color: colors.inkSoft,
    marginTop: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  correctDone: {
    marginTop: 10,
    gap: 8,
    alignItems: 'flex-start',
  },
  correctThanks: {
    fontSize: 13.5,
    color: colors.ink,
    lineHeight: 19,
  },
  correctChange: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brown,
  },
});
