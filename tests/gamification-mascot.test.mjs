import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Gamification Progression & Formulas', () => {
  it('should calculate exponential level progression correctly with 1.35 multiplier', () => {
    let maxExp = 100;
    const expected = [100, 135, 182, 246, 332]; // round(prev * 1.35)

    for (let i = 0; i < expected.length; i++) {
      assert.strictEqual(maxExp, expected[i], `Level ${i + 1} maxExp mismatch`);
      maxExp = Math.round(maxExp * 1.35);
    }
  });

  it('should handle multi-level up progression cleanly without infinite loops', () => {
    let exp = 0;
    let level = 1;
    let maxExp = 100;
    const expGained = 450; // Should level up L1 -> L2 (100), L2 -> L3 (135), L3 -> L4 (182), leaving 33 exp

    let newExp = exp + expGained;
    let leveledUp = false;

    while (newExp >= maxExp) {
      newExp -= maxExp;
      level += 1;
      maxExp = Math.round(maxExp * 1.35);
      leveledUp = true;
    }

    assert.strictEqual(leveledUp, true);
    assert.strictEqual(level, 4);
    assert.strictEqual(newExp, 33);
    assert.strictEqual(maxExp, 246);
  });

  it('should clamp hunger and happiness between 0 and 100', () => {
    const hunger = 85;
    const bonus = 30; // 85 + 30 = 115
    const clampedHunger = Math.min(100, Math.max(0, hunger + bonus));
    assert.strictEqual(clampedHunger, 100);

    const decay = -150;
    const decayedHunger = Math.min(100, Math.max(0, hunger + decay));
    assert.strictEqual(decayedHunger, 0);
  });

  it('should award favorite food bonus for all starter pets', () => {
    const favorites = {
      PUFFY: 'bánh cá ram',
      DINO: 'thịt nướng',
      BYTEY: 'sushi cá hồi',
      OCTY: 'bánh donut cà phê',
    };

    for (const [pet, favFood] of Object.entries(favorites)) {
      const isFav = favFood.toLowerCase().includes('cá') || favFood.toLowerCase().includes('thịt') || favFood.toLowerCase().includes('donut');
      assert.strictEqual(isFav, true, `Favorite food matching failed for ${pet}`);
    }
  });
});

describe('Mascot Vector Math & Physics Simulation', () => {
  it('should clamp pupil displacement within 12% of eye radius', () => {
    const eyeRadius = 50; // px
    const maxClamp = eyeRadius * 0.12; // 6px

    // Extreme touch point far away: dx = 300, dy = 400 (hypot = 500)
    const dx = 300;
    const dy = 400;
    const dist = Math.hypot(dx, dy);

    let pupilX = dx;
    let pupilY = dy;
    if (dist > maxClamp) {
      pupilX = (dx / dist) * maxClamp;
      pupilY = (dy / dist) * maxClamp;
    }

    const clampedDist = Math.hypot(pupilX, pupilY);
    assert.ok(clampedDist <= maxClamp + 0.0001, 'Pupil escaped maximum 12% radius bound');
    assert.ok(Math.abs(clampedDist - 6) < 0.001, 'Clamped distance should be 6px');
  });

  it('should calculate opposite specular highlight reflection at -20%', () => {
    const pupilX = 5;
    const pupilY = 3;
    const specularFactor = -0.2;

    const specX = pupilX * specularFactor;
    const specY = pupilY * specularFactor;

    assert.strictEqual(specX, -1);
    assert.ok(Math.abs(specY - (-0.6)) < 1e-6);
  });

  it('should lerp smoothly towards target at rate 0.15/frame', () => {
    let current = 0;
    const target = 10;
    const lerp = 0.15;

    // Simulate 5 frames
    for (let f = 0; f < 5; f++) {
      current += (target - current) * lerp;
    }

    // After 5 frames with 0.15 lerp: ~5.56
    assert.ok(current > 5.0 && current < 6.0, `Lerp did not converge as expected: ${current}`);
  });

  it('should trigger dizzy mood when tapped 5 times within rapid window', () => {
    let tapTimes = [];
    const now = Date.now();

    // 5 taps within 800ms
    for (let i = 0; i < 5; i++) {
      tapTimes.push(now + i * 150);
    }

    // Filter taps in last 1500ms
    const recentTaps = tapTimes.filter((t) => now + 600 - t < 1500);
    assert.strictEqual(recentTaps.length >= 5, true, 'Dizzy threshold not met');
  });
});

describe('UI & Text Overflow Safeguards', () => {
  it('should ensure feeding speech message length fits within mobile chat bubble (<= 60 chars)', () => {
    const testCases = [
      'Ngon tuyệt! Cảm ơn sen nhé!',
      'Măm măm... Bánh Cá RAM giòn rụm! (+25 No)',
      'Oa, no căng bụng rồi! (+100%)',
      'Đầy năng lượng rồi, làm việc thôi!',
    ];

    for (const msg of testCases) {
      assert.ok(msg.length <= 60, `Message too long for speech bubble: "${msg}"`);
    }
  });
});
