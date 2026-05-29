import { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { STAGES, Stage } from '../../lib/stages';
import { StageDot } from '../../components/StageDot';
import { PetBananaCard } from '../../components/PetBananaCard';
import { PetActions } from '../../components/PetActions';
import { PetEventLog } from '../../components/PetEventLog';
import { BananaGrid } from '../../components/BananaGrid';
import { DancingBanana } from '../../components/DancingBanana';
import {
  Bunch,
  Environment,
  GAME_SPEEDS,
  GAME_SPEED_ORDER,
  GameSpeed,
  DEFAULT_GAME_SPEED,
  loadBunch,
  loadPrefs,
  plantBunch,
  tickBunch,
  setBananaEnvironment,
  eatBanana,
  clearBunch,
  persistBunch,
  bunchOver,
  formatLifespan,
  bunchAlive,
} from '../../lib/pet';
import {
  scheduleBunchPeakAlert,
  cancelPeakAlert,
} from '../../lib/notifications';
import { colors, radius, space, shadow } from '../../lib/theme';

const ORDER: Stage[] = [1, 2, 3, 4, 5, 6, 7];

/**
 * Bananas tab — split into:
 *   1. Bunch overview (top: family name + alive/eaten/lost stats)
 *   2. Banana grid (3-col tiles, tap to select)
 *   3. Selected-banana actions (environment selector + eat)
 *   4. Story log (shared timeline)
 *   5. The 7-stage USDA scale (static reference)
 *
 * The bunch ticks every 4 seconds while the screen is focused. Random
 * events fire on a random alive banana from the foreground only.
 */
export default function BananasScreen() {
  const [bunch, setBunch] = useState<Bunch | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [namingOpen, setNamingOpen] = useState(false);
  const [bunchNameInput, setBunchNameInput] = useState('');
  const [plantSpeed, setPlantSpeed] = useState<GameSpeed>(DEFAULT_GAME_SPEED);

  /** Load on mount, catch up time without rolling random events. */
  useEffect(() => {
    (async () => {
      const stored = await loadBunch();
      if (stored) {
        const ticked = tickBunch(stored, false);
        if (ticked !== stored) await persistBunch(ticked);
        setBunch(ticked);
        // Default selection: first alive banana, else first one.
        const firstAlive = ticked.bananas.find((b) => b.alive);
        setSelectedId((firstAlive ?? ticked.bananas[0])?.id ?? null);
      }
    })();
  }, []);

  /** Tick every 4 seconds while focused, with random events on. */
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      const interval = setInterval(async () => {
        if (!alive) return;
        const current = await loadBunch();
        if (!current) return;
        const ticked = tickBunch(current, true);
        if (ticked !== current) {
          await persistBunch(ticked);
          if (alive) setBunch(ticked);
        }
      }, 4000);
      return () => {
        alive = false;
        clearInterval(interval);
      };
    }, []),
  );

  const handlePlantPrompt = async () => {
    setBunchNameInput('');
    const prefs = await loadPrefs();
    setPlantSpeed(prefs.default_game_speed);
    setNamingOpen(true);
  };

  const confirmPlant = async () => {
    const next = await plantBunch(bunchNameInput, plantSpeed);
    setBunch(next);
    setSelectedId(next.bananas[0]?.id ?? null);
    setNamingOpen(false);
    scheduleBunchPeakAlert(next).catch(() => {});
  };

  const handleEnvChange = async (env: Environment) => {
    if (!bunch || !selectedId) return;
    const next = await setBananaEnvironment(bunch, selectedId, env);
    setBunch(next);
    scheduleBunchPeakAlert(next).catch(() => {});
  };

  const handleEat = async () => {
    if (!bunch || !selectedId) return;
    const next = await eatBanana(bunch, selectedId);
    setBunch(next);
    // Auto-advance to the next alive banana, if any.
    const nextAlive = next.bananas.find((b) => b.alive && b.id !== selectedId);
    if (nextAlive) setSelectedId(nextAlive.id);
    scheduleBunchPeakAlert(next).catch(() => {});
  };

  const handleNewBunch = async () => {
    await clearBunch();
    await cancelPeakAlert();
    setBunch(null);
    setSelectedId(null);
    handlePlantPrompt();
  };

  const selectedBanana =
    bunch?.bananas.find((b) => b.id === selectedId) ?? null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={styles.head}>
          <Text style={styles.title} accessibilityRole="header">
            Bananas
          </Text>
          <Text style={styles.lede}>
            Get a bunch. Stagger their ripening. Eat them at peak before
            something happens to them. (Something often happens.)
          </Text>
        </View>

        {bunch === null ? (
          <PlantPrompt onPress={handlePlantPrompt} />
        ) : (
          <>
            <PetBananaCard bunch={bunch} />

            {bunchOver(bunch) ? (
              <BunchOverBanner bunch={bunch} onPlantNew={handleNewBunch} />
            ) : (
              <>
                <BananaGrid
                  bananas={bunch.bananas}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
                {selectedBanana && (
                  <PetActions
                    banana={selectedBanana}
                    bunchName={bunch.name}
                    onChangeEnvironment={handleEnvChange}
                    onEat={handleEat}
                  />
                )}
              </>
            )}

            <PetEventLog events={bunch.history} limit={6} />
          </>
        )}

        {/* USDA SCALE — existing reference content */}
        <Text style={styles.sectionTitle}>THE 7-STAGE USDA SCALE</Text>
        <View style={styles.list}>
          {ORDER.map((s) => {
            const def = STAGES[s];
            return (
              <View key={s} style={styles.row}>
                <StageDot stage={s} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.stageLabel}>
                    Stage {s} · {def.label}
                  </Text>
                  <Text style={styles.vibe}>{def.vibe}</Text>
                  <Text style={styles.desc}>{def.description}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.foot}>
          <Text style={styles.footTitle}>Why hue?</Text>
          <Text style={styles.footBody}>
            Banana skin chlorophyll breaks down as the fruit ripens and
            carotenoid pigments take over. That shift moves the dominant
            hue from green (~90°) toward yellow (~25°) and finally browns
            (under 20°). Go Bananas reads the dominant hue from your photo
            and maps it to the USDA scale.
          </Text>
        </View>
      </ScrollView>

      <NamingModal
        visible={namingOpen}
        value={bunchNameInput}
        speed={plantSpeed}
        onChange={setBunchNameInput}
        onChangeSpeed={setPlantSpeed}
        onCancel={() => setNamingOpen(false)}
        onConfirm={confirmPlant}
      />
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Subcomponents                                                       */
/* ------------------------------------------------------------------ */

function PlantPrompt({ onPress }: { onPress: () => void }) {
  return (
    <View style={[styles.plantWrap, shadow.card]}>
      <DancingBanana variant="wiggle" size={56} />
      <Text style={styles.plantTitle}>You don't have a bunch yet</Text>
      <Text style={styles.plantBody}>
        Get 5–8 fresh green ones. Decide where each lives — fridge, paper bag,
        windowsill — and try to eat them all at peak. Sometimes a 🐒 has
        other plans.
      </Text>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Plant a bunch"
        style={({ pressed }) => [
          styles.plantBtn,
          pressed && { opacity: 0.85 },
        ]}
      >
        <Text style={styles.plantBtnText}>🌱 Plant a bunch</Text>
      </Pressable>
    </View>
  );
}

function BunchOverBanner({
  bunch,
  onPlantNew,
}: {
  bunch: Bunch;
  onPlantNew: () => void;
}) {
  const lifespan = formatLifespan(
    bunch.planted_iso,
    bunch.history[bunch.history.length - 1]?.iso,
  );
  const eatenAtPeak = bunch.bananas.filter(
    (b) =>
      b.end_reason === 'eaten' && b.ripeness >= 65 && b.ripeness < 85,
  ).length;
  const total = bunch.bananas.length;

  let verdict: string;
  if (eatenAtPeak === total) {
    verdict = "You ate every banana at peak. Chef's kiss.";
  } else if (eatenAtPeak >= Math.ceil(total / 2)) {
    verdict = `${eatenAtPeak} of ${total} eaten at peak. Solid run.`;
  } else if (eatenAtPeak > 0) {
    verdict = `${eatenAtPeak} of ${total} at peak. Could've been better.`;
  } else {
    verdict = `${bunch.name} are gone. Zero at peak. Ouch.`;
  }

  return (
    <View style={[styles.deadBanner, shadow.card]}>
      <Text style={styles.deadHeadline}>{verdict}</Text>
      <Text style={styles.deadSub}>{bunch.name} lived {lifespan}.</Text>
      <Pressable
        onPress={onPlantNew}
        accessibilityRole="button"
        accessibilityLabel="Plant a new bunch"
        style={({ pressed }) => [
          styles.plantBtn,
          pressed && { opacity: 0.85 },
        ]}
      >
        <Text style={styles.plantBtnText}>🌱 Plant a new bunch</Text>
      </Pressable>
    </View>
  );
}

function NamingModal({
  visible,
  value,
  speed,
  onChange,
  onChangeSpeed,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  value: string;
  speed: GameSpeed;
  onChange: (v: string) => void;
  onChangeSpeed: (s: GameSpeed) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const speedDef = GAME_SPEEDS[speed];
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalScrim}
      >
        <View style={[styles.modalCard, shadow.card]}>
          <Text style={styles.modalTitle}>Name the family</Text>
          <Text style={styles.modalBody}>
            5–8 bananas, all related. Phil, Carla, Greg, etc. — they get
            their own first names. You name the family.
          </Text>
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder="The Smiths"
            autoFocus
            maxLength={28}
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={onConfirm}
          />
          <View style={styles.speedChip}>
            <Text style={styles.speedChipLabel}>SPEED</Text>
            <View style={styles.speedOptions}>
              {GAME_SPEED_ORDER.map((id) => {
                const def = GAME_SPEEDS[id];
                const selected = id === speed;
                return (
                  <Pressable
                    key={id}
                    onPress={() => onChangeSpeed(id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${def.label} speed`}
                    style={({ pressed }) => [
                      styles.speedOption,
                      selected && styles.speedOptionSelected,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.speedOptionText,
                        selected && styles.speedOptionTextSelected,
                      ]}
                    >
                      {def.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.speedChipValue}>{speedDef.blurb}</Text>
          </View>
          <View style={styles.modalActions}>
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              style={({ pressed }) => [
                styles.modalBtnSecondary,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel="Plant the bunch"
              style={({ pressed }) => [
                styles.modalBtnPrimary,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.modalBtnPrimaryText}>🌱 Plant</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

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
  plantWrap: {
    marginHorizontal: space.md,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingVertical: space.xl,
    paddingHorizontal: space.lg,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
  },
  plantTitle: {
    marginTop: 8,
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
  },
  plantBody: {
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  plantBtn: {
    marginTop: 16,
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  plantBtnText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },

  deadBanner: {
    marginHorizontal: space.md,
    marginTop: space.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.md,
    alignItems: 'center',
  },
  deadHeadline: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
  },
  deadSub: {
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.inkSoft,
    paddingHorizontal: space.lg,
    marginTop: space.xl,
    marginBottom: 8,
  },
  list: {
    backgroundColor: colors.card,
    marginHorizontal: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: space.md,
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  stageLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  vibe: {
    fontSize: 13,
    color: colors.accentDeep,
    fontWeight: '600',
    marginTop: 2,
    fontStyle: 'italic',
  },
  desc: {
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 4,
    lineHeight: 18,
  },
  foot: {
    marginHorizontal: space.md,
    marginTop: space.md,
    backgroundColor: colors.greenSoft,
    borderRadius: radius.lg,
    padding: space.md,
  },
  footTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 4,
  },
  footBody: {
    fontSize: 13,
    color: colors.ink,
    lineHeight: 19,
  },

  modalScrim: {
    flex: 1,
    backgroundColor: 'rgba(31,29,24,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: space.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.3,
  },
  modalBody: {
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 18,
    marginTop: 4,
  },
  input: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.bg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  modalBtnSecondary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  modalBtnSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.inkSoft,
  },
  modalBtnPrimary: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  modalBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  speedChip: {
    marginTop: 12,
    backgroundColor: colors.yellowSoft,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  speedChipLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: colors.inkSoft,
  },
  speedChipValue: {
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 8,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  speedOptions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  speedOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
  },
  speedOptionSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accentDeep,
  },
  speedOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkSoft,
  },
  speedOptionTextSelected: {
    color: colors.ink,
    fontWeight: '700',
  },
});
