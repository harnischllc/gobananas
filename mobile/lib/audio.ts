/**
 * Background music for the game (Bananas) screen.
 *
 * Singleton player. Created lazily on first play so the audio session and
 * file decode only happen when the user opts in. Loops by default.
 *
 * Audio session is configured to:
 *   - Respect the iOS silent switch (no music when the phone is on silent)
 *   - Not run in the background (stops when the app is backgrounded)
 *   - Mix with other audio (don't kill the user's Spotify / podcast)
 *
 * The track is "Samba 8-bit" from Envato, royalty-free for app use.
 */
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';

const TRACK = require('../assets/audio/samba-8bit.m4a');
const LOOP_VOLUME = 0.55;

let player: AudioPlayer | null = null;
let audioModeReady = false;

async function ensureAudioMode(): Promise<void> {
  if (audioModeReady) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: false,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
    });
    audioModeReady = true;
  } catch {
    // Session-config failures must not crash the host screen. Audio is
    // non-essential; we silently degrade.
  }
}

function getPlayer(): AudioPlayer {
  if (!player) {
    player = createAudioPlayer(TRACK);
    player.loop = true;
    player.volume = LOOP_VOLUME;
  }
  return player;
}

/** Start (or resume) the game-screen background loop. Idempotent. */
export async function startMusic(): Promise<void> {
  await ensureAudioMode();
  const p = getPlayer();
  // Restart from beginning if we paused mid-track and the user re-enables.
  // Loops feel cleaner from a known position than from a random offset.
  if (!p.playing && p.currentTime > 0) {
    try {
      await p.seekTo(0);
    } catch {
      // best-effort
    }
  }
  p.play();
}

/** Pause without releasing the player. Resume picks up at the seek point. */
export function pauseMusic(): void {
  if (player && player.playing) {
    player.pause();
  }
}
