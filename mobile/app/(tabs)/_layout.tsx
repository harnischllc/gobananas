import { Tabs, useRouter } from 'expo-router';
import {
  Text,
  View,
  StyleSheet,
  Pressable,
  DeviceEventEmitter,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../../lib/theme';

/**
 * Bottom tab bar: Home / History / [Scan action] / Bananas / You.
 *
 * "Scan" is not a screen — it's an action button styled as a tab. Tapping
 * it always fires the camera regardless of which tab you're currently on.
 * It bounces you to Home (so the scan flow's busy overlay and history
 * write happen on the right screen) and emits 'gobananas:scanRequest'
 * which the Home screen subscribes to.
 *
 * Outline icons when inactive, filled when active — the skill's "filled
 * vs outline discipline" rule. Center scan button is always filled,
 * always banana-yellow, slightly elevated above the bar so it reads as
 * the primary action.
 */
type IconName = keyof typeof Ionicons.glyphMap;

interface TabSpec {
  label: string;
  iconActive: IconName;
  iconInactive: IconName;
}

const TABS: Record<string, TabSpec> = {
  index: { label: 'Home', iconActive: 'home', iconInactive: 'home-outline' },
  history: { label: 'History', iconActive: 'time', iconInactive: 'time-outline' },
  bananas: { label: 'Bananas', iconActive: 'book', iconInactive: 'book-outline' },
  you: { label: 'You', iconActive: 'person', iconInactive: 'person-outline' },
};

export const SCAN_REQUEST_EVENT = 'gobananas:scanRequest';

function ScanActionButton() {
  const router = useRouter();

  const handlePress = () => {
    // Step onto Home so the scan handler (and its busy overlay,
    // permission prompts, history write) all execute on the right screen.
    router.navigate('/(tabs)');
    // Tiny defer so navigation flushes before we kick off the scan.
    setTimeout(() => {
      DeviceEventEmitter.emit(SCAN_REQUEST_EVENT);
    }, 60);
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Scan a banana"
      accessibilityHint="Opens the camera"
      hitSlop={8}
      style={({ pressed }) => [
        scanStyles.wrap,
        pressed && { transform: [{ scale: 0.93 }] },
      ]}
    >
      <View style={scanStyles.circle}>
        <Ionicons name="camera" size={24} color={colors.ink} />
      </View>
      <Text style={scanStyles.label}>Scan</Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => {
        const t = TABS[route.name];
        return {
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: styles.bar,
          tabBarItemStyle: styles.barItem,
          tabBarAccessibilityLabel: t?.label,
          tabBarIcon: ({ focused }) => {
            if (!t) return null;
            return (
              <View style={styles.item}>
                <Ionicons
                  name={focused ? t.iconActive : t.iconInactive}
                  size={22}
                  color={focused ? colors.ink : colors.inkSoft}
                />
                <Text
                  style={[styles.label, focused ? styles.labelOn : styles.labelOff]}
                >
                  {t.label}
                </Text>
              </View>
            );
          },
        };
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="history" />
      <Tabs.Screen
        name="scan"
        options={{
          // Custom button overrides default press / navigation behavior.
          tabBarButton: () => <ScanActionButton />,
          tabBarAccessibilityLabel: 'Scan a banana',
        }}
      />
      <Tabs.Screen name="bananas" />
      <Tabs.Screen name="you" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopColor: colors.line,
    height: 84,
    paddingTop: 6,
    overflow: 'visible', // Let the elevated Scan button bleed above the bar.
  },
  barItem: {
    paddingVertical: 4,
    minHeight: 48,
  },
  item: {
    alignItems: 'center',
    gap: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
  },
  labelOn: {
    color: colors.ink,
  },
  labelOff: {
    color: colors.inkSoft,
  },
});

const scanStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
    gap: 4,
  },
  circle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14, // Pop above the bar so it reads as the primary action.
    ...shadow.hero,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.ink,
  },
});
