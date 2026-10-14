#!/usr/bin/env node
// voice-ok: the double hyphen below is npm's argument separator, not prose.
//
// Why did the classifier say that? Prints the pixel statistics behind a
// reading for one or more JPEGs (HEIC too, on macOS): saturation and
// brightness histograms, the share of pixels that count as banana
// candidates at several saturation floors, and the dominant hues. Use it on
// a misread photo before touching the thresholds in lib/hue.ts.
//
//   npm run stats -- ~/Downloads/IMG_1234.jpg [more.jpg ...]
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { decode } from 'jpeg-js';
import { rgbToHue, isBananaCandidateHue, DEFAULT_MIN_SATURATION } from '../lib/hue.ts';
import { sampleStep } from '../lib/decision.ts';

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: npm run stats -- <photo.jpg|heic> [...]');
  process.exit(2);
}

const FLOORS = [0.1, 0.2, 0.3, 0.35, 0.4, 0.5];
const tmp = mkdtempSync(join(tmpdir(), 'gobananas-stats-'));

try {
  for (const f of files) {
    let path = f;
    if (/\.heic$/i.test(f)) {
      path = join(tmp, basename(f, extname(f)) + '.jpg');
      execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '90', '-Z', '1600', f, '--out', path], { stdio: 'ignore' });
    }
    const img = decode(readFileSync(path), { useTArray: true, tolerantDecoding: true });
    const { width: W, height: H, data } = img;
    const step = sampleStep(W, H);
    let sampled = 0;
    const satBins = new Array(10).fill(0);
    const valBins = new Array(10).fill(0);
    const candAt = Object.fromEntries(FLOORS.map((s) => [s, 0]));
    const hueAt = Object.fromEntries(FLOORS.map((s) => [s, {}]));
    const satOfCandidates = []; // sat of banana-hue pixels at floor 0.1

    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        sampled++;
        const i = (y * W + x) * 4;
        const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const sat = max === 0 ? 0 : (max - min) / max;
        satBins[Math.min(9, Math.floor(sat * 10))]++;
        valBins[Math.min(9, Math.floor(max * 10))]++;
        const h = rgbToHue(r, g, b);
        if (!isBananaCandidateHue(h)) continue;
        if (sat >= 0.1) satOfCandidates.push(sat);
        const k = Math.round(h / 5) * 5;
        for (const s of FLOORS) {
          if (sat >= s) {
            candAt[s]++;
            hueAt[s][k] = (hueAt[s][k] || 0) + 1;
          }
        }
      }
    }

    const pct = (n) => ((100 * n) / sampled).toFixed(1) + '%';
    const top = (o) =>
      Object.entries(o)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([h, n]) => `${h}°:${pct(n)}`)
        .join('  ');
    satOfCandidates.sort((a, b) => a - b);
    const q = (p) =>
      satOfCandidates.length
        ? satOfCandidates[Math.floor(p * (satOfCandidates.length - 1))].toFixed(2)
        : '-';

    console.log(`\n== ${basename(f)}  ${W}x${H}  step ${step}  sampled ${sampled}`);
    console.log(`saturation 0.0-0.1 .. 0.9-1.0 : ${satBins.map(pct).join(' ')}`);
    console.log(`brightness 0.0-0.1 .. 0.9-1.0 : ${valBins.map(pct).join(' ')}`);
    console.log(
      `banana-hue candidates by saturation floor: ${FLOORS.map((s) => `>=${s}${s === DEFAULT_MIN_SATURATION ? '*' : ''} ${pct(candAt[s])}`).join(' | ')}   (* = shipped floor)`,
    );
    console.log(`saturation of banana-hue pixels (floor 0.1): p10 ${q(0.1)}  median ${q(0.5)}  p90 ${q(0.9)}`);
    for (const s of [0.1, DEFAULT_MIN_SATURATION]) console.log(`top hues at floor ${s}: ${top(hueAt[s])}`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
