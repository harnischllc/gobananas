import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Linking,
  DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { ScanCard } from '../../components/ScanCard';
import { HistoryRow } from '../../components/HistoryRow';
import { DancingBanana } from '../../components/DancingBanana';
import { PetBananaCard } from '../../components/PetBananaCard';
import { SCAN_REQUEST_EVENT } from './_layout';
import { addScan, loadHistory, ScanRecord } from '../../lib/history';
import { classifyImage } from '../../lib/classify';
import {
  Bunch,
  bunchOver,
  loadBunch,
  persistBunch,
  tickBunch,
} from '../../lib/pet';
import { colors, radius, space } from '../../lib/theme';

export default function ScanHome() {
  const router = useRouter();
  const [recent, setRecent] = useState<ScanRecord[]>([]);
  const [bunch, setBunch] = useState<Bunch | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setRecent((await loadHistory()).slice(0, 3));
  }, []);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      refresh();
      (async () => {
        const stored = await loadBunch();
        if (!alive) return;
        if (stored) {
          const ticked = tickBunch(stored, false);
          if (ticked !== stored) await persistBunch(ticked);
          if (alive) setBunch(ticked);
        } else if (alive) {
          setBunch(null);
        }
      })();
      return () => {
        alive = false;
      };
    }, [refresh]),
  );

  // The center "Scan" tab button fires this event. Keep a ref to the
  // latest handleScan so the listener stays subscribed across busy
  // transitions but always calls the current handler.
  const handleScanRef = useRef<() => void>(() => {});
  useEffect(() => {
    handleScanRef.current = handleScan;
  });
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(SCAN_REQUEST_EVENT, () => {
      handleScanRef.current();
    });
    return () => sub.remove();
  }, []);

  const handleScan = useCallback(async () => {
    if (busy) return;
    setBusy(true);

    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Camera off',
          'Go Bananas needs camera access to scan a banana. Enable it in Settings?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
        setBusy(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        exif: false,
      });

      if (result.canceled) {
        setBusy(false);
        return;
      }

      const asset = result.assets[0];
      const classification = await classifyImage(asset.uri);
      const record = await addScan({
        imageUri: asset.uri,
        stage: classification.stage,
        hue: classification.hue,
        confidence: classification.confidence,
        demo: classification.demo,
      });

      router.push({ pathname: '/result', params: { id: record.id } });
    } catch (err) {
      Alert.alert('Hmm', 'Something went sideways. Try again?');
      console.warn(err);
    } finally {
      setBusy(false);
    }
  }, [busy, router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.nav}>
          <Text style={styles.title}>
            <Text style={styles.logo}>🍌</Text> Go Bananas
          </Text>
          <Pressable
            onPress={() => router.push('/you')}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            hitSlop={8}
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Ionicons name="settings-outline" size={18} color={colors.inkSoft} />
          </Pressable>
        </View>

        {bunch !== null && !bunchOver(bunch) ? (
          <Pressable
            onPress={() => router.push('/bananas')}
            accessibilityRole="button"
            accessibilityLabel={`${bunch.name}, tap to tend the bunch`}
            style={({ pressed }) => pressed && { opacity: 0.93 }}
          >
            <PetBananaCard bunch={bunch} />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.push('/bananas')}
            accessibilityRole="button"
            accessibilityLabel={
              bunch === null ? 'Start a bunch' : 'Plant a new bunch'
            }
            style={({ pressed }) => [
              styles.bunchPrompt,
              pressed && { opacity: 0.88 },
            ]}
          >
            <Text style={styles.bunchPromptEmoji}>🌱</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bunchPromptTitle}>
                {bunch === null ? 'Start a bunch' : 'Plant a new bunch'}
              </Text>
              <Text style={styles.bunchPromptSub}>
                5–8 bananas. Stagger ripening. Eat at peak.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
          </Pressable>
        )}

        <ScanCard onScan={handleScan} busy={busy} />

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>RECENT</Text>
          {recent.length > 0 && (
            <Pressable
              onPress={() => router.push('/history')}
              accessibilityRole="button"
              accessibilityLabel="See all scans"
              hitSlop={8}
              style={({ pressed }) => pressed && { opacity: 0.6 }}
            >
              <Text style={styles.link}>See all</Text>
            </Pressable>
          )}
        </View>

        {recent.length === 0 ? (
          <View style={styles.empty}>
            <DancingBanana variant="wiggle" size={48} />
            <Text style={styles.emptyTitle}>No bananas yet</Text>
            <Text style={styles.emptyBody}>
              Tap "Scan with camera" up top. Your scans land here.
            </Text>
          </View>
        ) : (
          <View style={styles.history}>
            {recent.map((r) => (
              <HistoryRow
                key={r.id}
                record={r}
                onPress={() =>
                  router.push({ pathname: '/result', params: { id: r.id } })
                }
              />
            ))}
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.learnCard,
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => router.push('/bananas')}
          accessibilityRole="button"
          accessibilityLabel="Learn the seven-stage USDA scale, two minute read"
        >
          <View style={styles.learnGlyph}>
            <Ionicons name="book-outline" size={22} color={colors.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.learnTitle}>The 7-stage USDA scale</Text>
            <Text style={styles.learnSub}>Why hue maps to ripeness · 2 min read</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
        </Pressable>

      </ScrollView>

      {busy && (
        <View
          style={styles.busyOverlay}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <DancingBanana variant="wiggle" size={64} />
          <Text style={styles.busyText}>Reading your banana…</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingTop: 12,
    paddingBottom: space.xs,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.ink,
  },
  logo: {
    fontSize: 22,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: space.lg,
    paddingTop: 24,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.inkSoft,
  },
  link: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.inkSoft,
  },
  history: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    marginHorizontal: space.md,
    overflow: 'hidden',
  },
  empty: {
    marginHorizontal: space.md,
    paddingVertical: 28,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 4,
  },
  emptyBody: {
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  learnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    marginHorizontal: space.md,
    marginTop: space.md,
    padding: space.md,
  },
  learnGlyph: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  learnTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  learnSub: {
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
  },
  bunchPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.yellowSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    marginHorizontal: space.md,
    marginTop: space.sm,
    padding: space.md,
  },
  bunchPromptEmoji: {
    fontSize: 28,
  },
  bunchPromptTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  bunchPromptSub: {
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
  },
  busyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(250, 247, 240, 0.85)',
  },
  busyText: {
    color: colors.inkSoft,
    fontSize: 14,
    fontWeight: '600',
  },
});
