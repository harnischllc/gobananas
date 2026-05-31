import { useCallback, useEffect, useRef, useState } from 'react';
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
  ENVIRONMENTS,
  ENVIRONMENT_ORDER,
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
  setBananaProtected,
} from '../../lib/pet';
import {
  scheduleBunchPeakAlert,
  cancelPeakAlert,
} from '../../lib/notifications';
import { effectiveToday } from '../../lib/streak';
import {
  HammockState,
  RaidOutcome,
  loadHammock,
  saveHammock,
  resolveRaid,
} from '../../lib/hammock';
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
  const [hammock, setHammock] = useState<HammockState | null>(null);
  const [raidReveal, setRaidReveal] = useState<RaidOutcome | null>(null);
  const [namingOpen, setNamingOpen] = useState(false);
  const [bunchNameInput, setBunchNameInput] = useState('');
  const [plantSpeed, setPlantSpeed] = useState<GameSpeed>(DEFAULT_GAME_SPEED);
  // Placement walkthrough: when non-null, the modal is open.
  // `placementMode` flips from per-banana picking to a final review screen.
  const [placementBunch, setPlacementBunch] = useState<Bunch | null>(null);
  const [placementIndex, setPlacementIndex] = useState(0);
  const [placementMode, setPlacementMode] = useState<'pick' | 'review'>('pick');
  // The env the user just tapped but hasn't been auto-committed yet. Lets
  // the modal show the highlight + blurb for a beat before advancing.
  const [pendingEnv, setPendingEnv] = useState<Environment | null>(null);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * On focus (which also fires on first mount): load the bunch, catch up
   * ripeness without rolling random events, resolve at most one overnight
   * monkey raid per effective day, then start the 4s foreground ticker.
   * This is the ONLY load->persist chain for the bunch on entry, so there is
   * no race with a separate mount loader.
   */
  useFocusEffect(
    useCallback(() => {
      let alive = true;

      (async () => {
        const today = await effectiveToday();
        const h = await loadHammock();
        const current = await loadBunch();

        if (!current) {
          if (h.last_raid_date !== today) {
            const stamped = { ...h, last_raid_date: today };
            await saveHammock(stamped);
            if (alive) setHammock(stamped);
          } else if (alive) {
            setHammock(h);
          }
          return;
        }

        let nextBunch = tickBunch(current, false);
        let nextHammock = h;
        let outcome: RaidOutcome | null = null;

        if (h.last_raid_date !== today) {
          const r = resolveRaid(nextBunch, h, today);
          nextBunch = r.bunch;
          nextHammock = r.state;
          outcome = r.outcome;
          // Stamp-first: persist the hammock (carrying the new raid date)
          // before mutating the bunch, so a crash between the two writes errs
          // toward "no raid recorded" rather than re-rolling it next focus.
          await saveHammock(nextHammock);
          await persistBunch(nextBunch);
        } else if (nextBunch !== current) {
          await persistBunch(nextBunch);
        }

        if (alive) {
          setBunch(nextBunch);
          setHammock(nextHammock);
          // Keep the current selection if it's still alive, else default to
          // the first alive banana (covers a selected banana being raided).
          setSelectedId((prev) =>
            prev && nextBunch.bananas.some((b) => b.id === prev && b.alive)
              ? prev
              : (nextBunch.bananas.find((b) => b.alive) ?? nextBunch.bananas[0])
                  ?.id ?? null,
          );
          if (outcome && outcome.kind !== 'quiet') setRaidReveal(outcome);
        }
      })();

      // The IIFE above finishes in a few ms (AsyncStorage), well before this
      // first 4s tick, so the ticker never races the raid write.
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

  // Clear an in-flight pending-env timer so we don't fire a stale advance
  // after a Back, Skip, or finalize.
  const cancelPendingPlacement = () => {
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
    setPendingEnv(null);
  };

  // Make sure no pending timer outlives the screen.
  useEffect(() => {
    return () => {
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    };
  }, []);

  const confirmPlant = async () => {
    const next = await plantBunch(bunchNameInput, plantSpeed);
    setBunch(next);
    setSelectedId(next.bananas[0]?.id ?? null);
    setNamingOpen(false);
    // Hand off to the placement walkthrough. Peak-alert scheduling is
    // deferred until placement finishes (or is skipped) so it uses the
    // final environment mix, not the all-counter default.
    cancelPendingPlacement();
    setPlacementBunch(next);
    setPlacementIndex(0);
    setPlacementMode('pick');
  };

  const finalizePlacement = (finalBunch: Bunch) => {
    cancelPendingPlacement();
    setBunch(finalBunch);
    setPlacementBunch(null);
    setPlacementIndex(0);
    setPlacementMode('pick');
    scheduleBunchPeakAlert(finalBunch).catch(() => {});
  };

  // Tap an env tile: stage the choice, hold the highlight + blurb for a
  // beat, then commit + advance to the next banana (or to the review
  // screen if this was the last one).
  const handlePickPlacement = (env: Environment) => {
    if (!placementBunch) return;
    if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    setPendingEnv(env);
    const snapshotIndex = placementIndex;
    pendingTimerRef.current = setTimeout(async () => {
      pendingTimerRef.current = null;
      const banana = placementBunch.bananas[snapshotIndex];
      if (!banana) return;
      const updated = await setBananaEnvironment(
        placementBunch,
        banana.id,
        env,
      );
      setPendingEnv(null);
      setBunch(updated);
      const nextIdx = snapshotIndex + 1;
      if (nextIdx >= updated.bananas.length) {
        setPlacementBunch(updated);
        setPlacementIndex(snapshotIndex);
        setPlacementMode('review');
      } else {
        setPlacementBunch(updated);
        setPlacementIndex(nextIdx);
      }
    }, 650);
  };

  const handleBackPlacement = () => {
    if (!placementBunch) return;
    cancelPendingPlacement();
    if (placementIndex > 0) setPlacementIndex(placementIndex - 1);
  };

  const handleEditFromReview = (idx: number) => {
    cancelPendingPlacement();
    setPlacementIndex(idx);
    setPlacementMode('pick');
  };

  const handleConfirmReview = () => {
    if (placementBunch) finalizePlacement(placementBunch);
  };

  const handleSkipPlacement = () => {
    if (placementBunch) finalizePlacement(placementBunch);
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

  const handleToggleHammock = async () => {
    if (!bunch || !selectedId || !hammock) return;
    const target = bunch.bananas.find((b) => b.id === selectedId);
    if (!target || !target.alive) return;
    const willProtect = !target.protected;
    if (willProtect && hammock.count < 1) return;
    const next = await setBananaProtected(bunch, selectedId, willProtect);
    setBunch(next);
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
          <Text style={styles.hammockLine}>
            🪢 {hammock?.count ?? 0} hammock
            {(hammock?.count ?? 0) === 1 ? '' : 's'} in reserve
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
                    hammockCount={hammock?.count ?? 0}
                    onToggleHammock={handleToggleHammock}
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

      <PlacementModal
        bunch={placementBunch}
        index={placementIndex}
        mode={placementMode}
        pendingEnv={pendingEnv}
        onPick={handlePickPlacement}
        onBack={handleBackPlacement}
        onEdit={handleEditFromReview}
        onConfirm={handleConfirmReview}
        onSkip={handleSkipPlacement}
      />

      <RaidRevealModal
        outcome={raidReveal}
        onDismiss={() => setRaidReveal(null)}
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
        Get 5 to 8 fresh green ones. Decide where each lives (fridge, paper
        bag, windowsill) and try to eat them all at peak. And tuck your best
        one into a hammock, because a 🐒 raids overnight.
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

/**
 * Walks the user through placing each banana right after planting. Real
 * bananas ripen at different rates depending on where they live (counter,
 * fridge, paper bag, etc.), so making the choice up-front beats defaulting
 * everything to the counter.
 *
 * Two modes:
 *   pick   — one banana at a time. Tap an env tile, the tile + blurb
 *            highlight, and after a beat the modal auto-advances. Back
 *            returns to the previous banana. Skip bails any remaining
 *            bananas to their planting default.
 *   review — final confirmation. Lists every banana with the env it's
 *            ended up in; tapping any row jumps back into pick mode at
 *            that index for one more pass.
 */
function PlacementModal({
  bunch,
  index,
  mode,
  pendingEnv,
  onPick,
  onBack,
  onEdit,
  onConfirm,
  onSkip,
}: {
  bunch: Bunch | null;
  index: number;
  mode: 'pick' | 'review';
  pendingEnv: Environment | null;
  onPick: (env: Environment) => void;
  onBack: () => void;
  onEdit: (idx: number) => void;
  onConfirm: () => void;
  onSkip: () => void;
}) {
  if (!bunch) return null;
  const total = bunch.bananas.length;

  if (mode === 'review') {
    return (
      <Modal
        visible
        transparent
        animationType="fade"
        onRequestClose={onSkip}
      >
        <View style={styles.modalScrim}>
          <View style={[styles.placementCard, shadow.card]}>
            <Text style={styles.placementProgress}>All set?</Text>
            <Text style={styles.placementName}>Review the placements</Text>
            <Text style={styles.placementPrompt}>
              Tap any row to change a banana's spot. Tap Plant to lock it in.
            </Text>
            <View style={styles.reviewList}>
              {bunch.bananas.map((b, i) => {
                const env = ENVIRONMENTS[b.environment];
                return (
                  <Pressable
                    key={b.id}
                    onPress={() => onEdit(i)}
                    accessibilityRole="button"
                    accessibilityLabel={`Change ${b.name}'s spot. Currently ${env.label}.`}
                    style={({ pressed }) => [
                      styles.reviewRow,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text style={styles.reviewRowName}>{b.name}</Text>
                    <View style={styles.reviewRowEnv}>
                      <Text style={styles.reviewRowGlyph}>{env.glyph}</Text>
                      <Text style={styles.reviewRowEnvLabel}>
                        {env.short}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel="Plant the bunch"
              style={({ pressed }) => [
                styles.reviewConfirm,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.reviewConfirmText}>🌱 Plant for real</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  const banana = bunch.bananas[index];
  if (!banana) return null;
  // The highlight reflects the staged choice if there is one, otherwise
  // whatever's been committed (defaults to counter on a fresh banana).
  const highlightEnv: Environment = pendingEnv ?? banana.environment;
  const showBackBtn = index > 0;
  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onSkip}
    >
      <View style={styles.modalScrim}>
        <View style={[styles.placementCard, shadow.card]}>
          <View style={styles.placementTopRow}>
            {showBackBtn ? (
              <Pressable
                onPress={onBack}
                accessibilityRole="button"
                accessibilityLabel="Back to previous banana"
                hitSlop={10}
                style={({ pressed }) => [
                  styles.placementBackBtn,
                  pressed && { opacity: 0.6 },
                ]}
              >
                <Text style={styles.placementBackText}>‹ Back</Text>
              </Pressable>
            ) : (
              <View style={styles.placementBackBtn} />
            )}
            <Text style={styles.placementProgress}>
              Banana {index + 1} of {total}
            </Text>
            <View style={styles.placementBackBtn} />
          </View>
          <Text style={styles.placementGlyph}>🍌</Text>
          <Text style={styles.placementName}>{banana.name}</Text>
          <Text style={styles.placementPrompt}>
            Where will {banana.name} live?
          </Text>
          <View style={styles.envGrid}>
            {ENVIRONMENT_ORDER.map((id) => {
              const def = ENVIRONMENTS[id];
              const selected = highlightEnv === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => onPick(id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${def.label}. ${def.blurb}`}
                  style={({ pressed }) => [
                    styles.envTile,
                    selected && styles.envTileSelected,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={styles.envTileGlyph}>{def.glyph}</Text>
                  <Text style={styles.envTileLabel}>{def.short}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.envHint}>
            {ENVIRONMENTS[highlightEnv].blurb}
          </Text>
          <Pressable
            onPress={onSkip}
            accessibilityRole="button"
            hitSlop={8}
            style={({ pressed }) => [
              styles.placementSkip,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Text style={styles.placementSkipText}>
              Keep the rest on the counter
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Raid reveal                                                         */
/* ------------------------------------------------------------------ */

function RaidRevealModal({
  outcome,
  onDismiss,
}: {
  outcome: RaidOutcome | null;
  onDismiss: () => void;
}) {
  if (!outcome || outcome.kind === 'quiet') return null;
  const blocked = outcome.kind === 'blocked';
  const name = outcome.bananaName;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.modalScrim}>
        <View style={[styles.modalCard, shadow.card]}>
          <Text style={styles.raidGlyph}>{blocked ? '🪢' : '🐒'}</Text>
          <Text style={styles.modalTitle}>
            {blocked ? 'Hammock held!' : 'Monkey raid'}
          </Text>
          <Text style={styles.modalBody}>
            {blocked
              ? `A monkey crept in for ${name} overnight. The hammock held. It left with nothing but a loose peel.`
              : `A monkey slipped in overnight and made off with ${name}. Tuck your best one into a hammock next time.`}
          </Text>
          <View style={styles.modalActions}>
            <Pressable
              onPress={onDismiss}
              accessibilityRole="button"
              accessibilityLabel="Dismiss the raid notice"
              style={({ pressed }) => [
                styles.modalBtnPrimary,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.modalBtnPrimaryText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </View>
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
  hammockLine: {
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 6,
    fontWeight: '600',
  },
  raidGlyph: {
    fontSize: 44,
    textAlign: 'center',
    marginBottom: 4,
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

  placementCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: space.lg,
    alignItems: 'center',
  },
  placementProgress: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: colors.inkSoft,
  },
  placementGlyph: {
    fontSize: 44,
    marginTop: 6,
  },
  placementName: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: colors.ink,
    marginTop: 2,
  },
  placementPrompt: {
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 4,
    textAlign: 'center',
  },
  envGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 16,
    width: '100%',
  },
  envTile: {
    flexBasis: '31%',
    flexGrow: 0,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  envTileSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accentDeep,
  },
  envTileGlyph: {
    fontSize: 22,
  },
  envTileLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 4,
  },
  envHint: {
    fontSize: 12,
    color: colors.inkSoft,
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  placementSkip: {
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  placementSkipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkSoft,
    textDecorationLine: 'underline',
  },
  placementTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginBottom: 4,
  },
  placementBackBtn: {
    minWidth: 64,
    paddingVertical: 4,
  },
  placementBackText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brown,
  },
  reviewList: {
    alignSelf: 'stretch',
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  reviewRowName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  reviewRowEnv: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewRowGlyph: {
    fontSize: 16,
  },
  reviewRowEnvLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkSoft,
  },
  reviewConfirm: {
    marginTop: 16,
    alignSelf: 'stretch',
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
  },
  reviewConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
});
