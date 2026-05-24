import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Share,
  Linking,
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
import { ScanRecord, loadHistory } from '../lib/history';
import { StageDot } from '../components/StageDot';
import { DancingBanana } from '../components/DancingBanana';
import { BananaRating } from '../components/BananaRating';
import { colors, radius, space } from '../lib/theme';

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [record, setRecord] = useState<ScanRecord | null>(null);

  useEffect(() => {
    (async () => {
      const all = await loadHistory();
      setRecord(all.find((r) => r.id === id) ?? null);
    })();
  }, [id]);

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

  const handleReportMisclassification = () => {
    const subject = encodeURIComponent('Go Bananas misclassification');
    const body = encodeURIComponent(
      `The app called my banana Stage ${record.stage} (${def.label}).\n` +
        `Hue: ${Math.round(record.hue)}°\n` +
        `Confidence: ${Math.round(record.confidence)}%\n\n` +
        `I'd actually call it stage: \n\n` +
        `If you can, attach a screenshot of the result screen so the diagnostic data goes along with this.\n`,
    );
    Linking.openURL(
      `mailto:info@harnischllc.com?subject=${subject}&body=${body}`,
    );
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

        {/*
          TEMPORARY: TestFlight calibration diagnostic. Lets Eric report
          the detected hue alongside the visual ripeness of the banana so
          we can retune the Stage hue ranges in lib/stages.ts. Remove this
          card and the related styles before App Store submission.
        */}
        <View style={[styles.card, styles.diagCard]}>
          <Text style={styles.diagBadge}>TEST · ALGORITHM DIAGNOSTIC</Text>
          <Text style={styles.diagLine}>
            Hue:{' '}
            <Text style={styles.diagValue}>{Math.round(record.hue)}°</Text>
            {'   '}·{'   '}Stage:{' '}
            <Text style={styles.diagValue}>{record.stage}</Text>
            {'   '}·{'   '}Confidence:{' '}
            <Text style={styles.diagValue}>{Math.round(record.confidence)}%</Text>
          </Text>
          <Text style={styles.diagHelp}>
            If this rating feels off, tap Report below. Helps tune the
            algorithm.
          </Text>
          <Pressable
            onPress={handleReportMisclassification}
            accessibilityRole="button"
            accessibilityLabel="Report misclassification by email"
            style={({ pressed }) => [
              styles.reportBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="mail-outline" size={15} color={colors.ink} />
            <Text style={styles.reportBtnLabel}>Report misclassification</Text>
          </Pressable>
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
  // TEMPORARY diagnostic styles — remove with the diagnostic card before
  // App Store submission.
  diagCard: {
    borderStyle: 'dashed',
    borderColor: colors.inkSoft,
    backgroundColor: 'transparent',
  },
  diagBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.inkSoft,
    letterSpacing: 1.4,
    marginBottom: 8,
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
  diagHelp: {
    fontSize: 11,
    color: colors.inkSoft,
    marginTop: 8,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.inkSoft,
    backgroundColor: colors.card,
  },
  reportBtnLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.ink,
  },
});
