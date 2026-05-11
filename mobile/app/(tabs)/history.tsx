import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { HistoryRow } from '../../components/HistoryRow';
import { DancingBanana } from '../../components/DancingBanana';
import {
  ScanRecord,
  loadHistory,
  clearHistory,
} from '../../lib/history';
import { colors, radius, space } from '../../lib/theme';

export default function HistoryScreen() {
  const router = useRouter();
  const [items, setItems] = useState<ScanRecord[]>([]);

  const refresh = useCallback(async () => {
    setItems(await loadHistory());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleClear = () => {
    Alert.alert('Clear history?', 'This wipes all scans on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearHistory();
          refresh();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.head}>
        <Text style={styles.title} accessibilityRole="header">
          History
        </Text>
        {items.length > 0 && (
          <Pressable
            onPress={handleClear}
            accessibilityRole="button"
            accessibilityLabel="Clear all scan history"
            hitSlop={12}
            style={({ pressed }) => pressed && { opacity: 0.6 }}
          >
            <Text style={styles.clear}>Clear</Text>
          </Pressable>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <DancingBanana variant="wiggle" size={56} />
          <Text style={styles.emptyTitle}>Nothing scanned yet</Text>
          <Text style={styles.emptyBody}>
            Pop back to the Scan tab and check a banana.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.listWrap}
          renderItem={({ item }) => (
            <HistoryRow
              record={item}
              onPress={() =>
                router.push({ pathname: '/result', params: { id: item.id } })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.ink,
  },
  clear: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.inkSoft,
  },
  listWrap: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    marginHorizontal: space.md,
    marginTop: space.sm,
    overflow: 'hidden',
  },
  empty: {
    marginTop: 80,
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
  },
  emptyBody: {
    fontSize: 14,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 4,
  },
});
