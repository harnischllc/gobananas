// Aside eligibility and name reactions. Pure functions only; the
// AsyncStorage-backed cooldown lives behind them and is not exercised here.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { nameReaction, normalize } from '../nameReactions.ts';

const ROSTER = ['Phil', 'Carla', 'Gladys'];

test('typed roster first names get the not-a-family line', () => {
  assert.equal(
    nameReaction('phil', ROSTER),
    'Phil is a banana, not a family. Proceeding anyway.',
  );
  assert.equal(
    nameReaction('  The Gladys ', ROSTER),
    'Gladys is a banana, not a family. Proceeding anyway.',
  );
});

test('known family names react, with or without "The"', () => {
  assert.equal(nameReaction('The Monkeys', ROSTER), 'Bold. The monkey has noted this.');
  assert.equal(nameReaction('monkeys!', ROSTER), 'Bold. The monkey has noted this.');
  assert.equal(nameReaction('The Smiths', ROSTER), 'Finally. A family that eats its bananas.');
  assert.equal(nameReaction('Second Banana', ROSTER), 'Second banana? The avocado will be thrilled.');
});

test('an empty or unknown name gets nothing', () => {
  assert.equal(nameReaction('', ROSTER), null);
  assert.equal(nameReaction('   ', ROSTER), null);
  assert.equal(nameReaction('The Harnisches', ROSTER), null);
});

test('normalize strips case, punctuation and a leading The', () => {
  assert.equal(normalize('The  Smiths!'), 'smiths');
  assert.equal(normalize("Gros Michel's"), 'gros michels');
  assert.equal(normalize('THE BANANAS'), 'bananas');
});
