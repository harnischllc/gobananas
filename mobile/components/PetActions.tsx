import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import {
  Banana,
  Environment,
  ENVIRONMENTS,
  ENVIRONMENT_ORDER,
  ripenessToStage,
} from '../lib/pet';
import { STAGES } from '../lib/stages';
import { colors, radius, space } from '../lib/theme';

/**
 * Action panel for the *selected* banana within the bunch.
 *   - Header: name + current stage
 *   - Environment selector: scrollable chips
 *   - Eat button (copy adjusts to current ripeness)
 *
 * If the banana is dead, the panel shows a fate readout instead.
 */
interface Props {
  banana: Banana;
  bunchName: string;
  onChangeEnvironment: (env: Environment) => void;
  onEat: () => void;
  hammockCount: number;
  onToggleHammock: () => void;
}

export function PetActions({
  banana,
  onChangeEnvironment,
  onEat,
  hammockCount,
  onToggleHammock,
}: Props) {
  const stage = ripenessToStage(banana.ripeness);
  const def = STAGES[stage];
  const currentEnv = ENVIRONMENTS[banana.environment];

  if (!banana.alive) {
    return (
      <View style={styles.wrap}>
        <View style={styles.header}>
          <Text style={styles.headerName}>{banana.name}</Text>
          <Text style={styles.headerSub}>
            {fateText(banana)}
          </Text>
        </View>
      </View>
    );
  }

  const ripenessLabel =
    banana.ripeness < 24
      ? `Eat ${banana.name}? Way too green`
      : banana.ripeness < 50
        ? `Eat ${banana.name}? Bold but legal`
        : banana.ripeness < 65
          ? `Eat ${banana.name}? Almost peak`
          : banana.ripeness < 85
            ? `Eat ${banana.name} now — peak`
            : `Eat ${banana.name} (past peak)`;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.headerName}>{banana.name}</Text>
        <Text style={styles.headerSub}>
          Stage {stage} · {def.label}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>WHERE?</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.envRow}
      >
        {ENVIRONMENT_ORDER.map((id) => {
          const env = ENVIRONMENTS[id];
          const active = banana.environment === id;
          return (
            <Pressable
              key={id}
              onPress={() => onChangeEnvironment(id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${env.label}, multiplier ${env.multiplier}`}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.chipGlyph}>{env.glyph}</Text>
              <Text
                style={[
                  styles.chipLabel,
                  active && styles.chipLabelActive,
                ]}
                numberOfLines={1}
              >
                {env.short}
              </Text>
              <Text style={styles.chipMult}>×{env.multiplier}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.envBlurb}>{currentEnv.blurb}</Text>

      <Pressable
        onPress={onEat}
        accessibilityRole="button"
        accessibilityLabel={ripenessLabel}
        style={({ pressed }) => [
          styles.eatBtn,
          pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        ]}
      >
        <Text style={styles.eatGlyph}>🤤</Text>
        <Text style={styles.eatText}>{ripenessLabel}</Text>
      </Pressable>

      <Pressable
        onPress={onToggleHammock}
        disabled={!banana.protected && hammockCount < 1}
        accessibilityRole="button"
        accessibilityLabel={
          banana.protected
            ? `Take ${banana.name} out of the hammock`
            : hammockCount < 1
              ? 'No hammocks. Open a crate to find one.'
              : `Tuck ${banana.name} into a hammock`
        }
        style={({ pressed }) => [
          styles.hammockBtn,
          banana.protected && styles.hammockBtnActive,
          !banana.protected && hammockCount < 1 && styles.hammockBtnDisabled,
          pressed && { opacity: 0.85 },
        ]}
      >
        <Text style={styles.hammockBtnText}>
          {banana.protected
            ? '🪢 Take out of hammock'
            : hammockCount < 1
              ? '🪢 No hammocks, open a crate'
              : '🪢 Tuck into hammock'}
        </Text>
      </Pressable>
    </View>
  );
}

function fateText(banana: Banana): string {
  switch (banana.end_reason) {
    case 'eaten': return 'Eaten. Gone but not forgotten.';
    case 'monkey': return '🐒 took them. RIP.';
    case 'roommate': return '👻 Your roommate. Still no replacement bananas.';
    case 'bird': return '🐦 Off to a nest somewhere.';
    case 'dropped': return '💥 Bruised beyond saving. Banana bread material.';
    case 'mush': return '💀 Liquefied. Past the bread point.';
    default: return 'No longer with us.';
  }
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: space.md,
    paddingHorizontal: space.md,
  },
  header: {
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12.5,
    color: colors.inkSoft,
    marginTop: 2,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.inkSoft,
    marginTop: 8,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  envRow: {
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  chip: {
    width: 84,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    gap: 4,
  },
  chipActive: {
    backgroundColor: colors.yellowSoft,
    borderColor: colors.accent,
  },
  chipGlyph: { fontSize: 20 },
  chipLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.inkSoft,
  },
  chipLabelActive: { color: colors.ink },
  chipMult: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.inkSoft,
    fontVariant: ['tabular-nums'],
  },
  envBlurb: {
    fontSize: 12,
    color: colors.inkSoft,
    fontStyle: 'italic',
    paddingHorizontal: 4,
    marginTop: 10,
    lineHeight: 16,
  },
  eatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.ink,
    paddingVertical: 14,
    borderRadius: radius.pill,
    marginTop: space.md,
  },
  eatGlyph: { fontSize: 18 },
  eatText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  hammockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.yellowSoft,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingVertical: 12,
    borderRadius: radius.pill,
    marginTop: 10,
  },
  hammockBtnActive: {
    backgroundColor: colors.accent,
  },
  hammockBtnDisabled: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    opacity: 0.7,
  },
  hammockBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
});
