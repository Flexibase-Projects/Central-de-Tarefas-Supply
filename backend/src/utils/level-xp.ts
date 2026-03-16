/**
 * Sistema de níveis por XP — v2
 *
 * Níveis 1–5 (early game, delta dobra a cada nível):
 *   L1=0, L2=2, L3=6, L4=14, L5=30
 *
 * Níveis 6+ (linear com incremento crescente):
 *   delta começa em 20 e aumenta 2 por nível.
 *   L6=50 (30+20), L7=72 (50+22), L8=96 (72+24), L9=122 (96+26), L10=150 (122+28)...
 */

const XP_BY_LEVEL_EARLY = [0, 2, 6, 14, 30]; // thresholds for levels 1–5 (index = level-1)

function buildXpThresholds(): number[] {
  const list = [...XP_BY_LEVEL_EARLY];
  let linearDelta = 20;
  for (let i = 5; i < 200; i++) {
    list.push(list[list.length - 1] + linearDelta);
    linearDelta += 2;
  }
  return list;
}

const THRESHOLDS = buildXpThresholds();

/** Returns the full XP thresholds array (index 0 = level 1). */
export function getXpThresholds(): number[] {
  return THRESHOLDS;
}

/** Returns the cumulative XP required to reach the given level (1-based). */
export function getXpThresholdForLevel(level: number): number {
  if (level < 1) return 0;
  return THRESHOLDS[level - 1] ?? THRESHOLDS[THRESHOLDS.length - 1];
}

export interface LevelInfo {
  level: number;
  xpInCurrentLevel: number;
  xpForNextLevel: number;
}

/** Computes level, XP within current level, and XP needed for next level. */
export function getLevelFromTotalXp(totalXp: number): LevelInfo {
  let level = 1;
  for (let i = 1; i <= THRESHOLDS.length; i++) {
    if (totalXp >= THRESHOLDS[i - 1]) level = i;
    else break;
  }
  const xpAtLevelStart = THRESHOLDS[level - 1] ?? 0;
  const xpAtNextLevel = THRESHOLDS[level] ?? xpAtLevelStart + 1;
  return {
    level,
    xpInCurrentLevel: totalXp - xpAtLevelStart,
    xpForNextLevel: xpAtNextLevel - xpAtLevelStart,
  };
}
