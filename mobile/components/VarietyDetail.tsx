import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import {
  Variety,
  RARITY_COLOR,
  RARITY_LABEL,
  RARITY_TEXT_ON,
} from '../lib/drops';
import { colors, radius, space, shadow } from '../lib/theme';

interface Props {
  variety: Variety | null;
  onClose: () => void;
}

/**
 * Re-show the detail card for an already-earned variety: tap an unlocked
 * collection tile or a recent-drop row to reopen the name, art, rarity,
 * flavor, and perk you saw when it first dropped. Read-only — no crate
 * animation or confetti. Mirrors the CrateOpen reveal card.
 */
export function VarietyDetail({ variety, onClose }: Props) {
  return (
    <Modal
      visible={!!variety}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close details"
      >
        {variety && (
          // The card claims the touch responder so taps on it don't fall
          // through to the backdrop and dismiss the modal.
          <View
            style={[
              styles.card,
              {
                backgroundColor: variety.colorSoft,
                borderColor: RARITY_COLOR[variety.rarity],
              },
              shadow.card,
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View
              style={[
                styles.rarityChip,
                { backgroundColor: RARITY_COLOR[variety.rarity] },
              ]}
            >
              <Text
                style={[
                  styles.rarityChipText,
                  { color: RARITY_TEXT_ON[variety.rarity] },
                ]}
              >
                {RARITY_LABEL[variety.rarity].toUpperCase()}
                {variety.seasonal ? ` · ${variety.seasonal.toUpperCase()}` : ''}
              </Text>
            </View>

            <Text style={styles.glyph}>{variety.glyph}</Text>
            <Text style={styles.name}>{variety.name}</Text>
            <Text style={styles.flavor}>{variety.flavor}</Text>

            {variety.perk && (
              <View style={styles.perkRow}>
                <Text style={styles.perkLabel}>PERK</Text>
                <Text style={styles.perkText}>{variety.perk}</Text>
              </View>
            )}

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={({ pressed }) => [
                styles.closeBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        )}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(31,29,24,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  card: {
    borderRadius: radius.xl,
    paddingVertical: space.lg,
    paddingHorizontal: space.lg,
    borderWidth: 2,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    overflow: 'hidden',
  },
  rarityChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: 12,
  },
  rarityChipText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  glyph: {
    fontSize: 76,
    marginVertical: 6,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  flavor: {
    fontSize: 13,
    color: colors.ink,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 12,
    lineHeight: 18,
  },
  perkRow: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: '100%',
  },
  perkLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.inkSoft,
  },
  perkText: {
    fontSize: 13,
    color: colors.ink,
    marginTop: 2,
  },
  closeBtn: {
    marginTop: 18,
    backgroundColor: colors.ink,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  closeText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
