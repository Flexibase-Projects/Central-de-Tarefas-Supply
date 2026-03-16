import type { TierInfo, TierName } from '@/types'

export const TIERS: TierInfo[] = [
  { name: 'Platinum',  min: 11, max: 15, color: '#E5E4E2', glowColor: 'rgba(229,228,226,0.6)', cssClass: 'tier-platinum',
    gradient: 'linear-gradient(135deg, #E5E4E2 0%, #BFC1C2 30%, #E5E4E2 50%, #A8AAAB 70%, #E5E4E2 100%)' },
  { name: 'Cobalt',    min: 1,  max: 5,  color: '#94A3B8', glowColor: 'rgba(148,163,184,0.4)', cssClass: 'tier-cobalt' },
  { name: 'Uranium',   min: 6,  max: 10, color: '#39FF14', glowColor: 'rgba(57,255,20,0.5)',   cssClass: 'tier-uranium' },
  { name: 'FlexiBase', min: 16, max: 20, color: '#00BFFF', glowColor: 'rgba(0,191,255,0.6)',   cssClass: 'tier-flexibase' },
]

export const TIER_LABELS: Record<TierName, string> = {
  Cobalt: 'Cobalt',
  Uranium: 'Uranium',
  Platinum: 'Platinum',
  FlexiBase: 'FlexiBase',
}

export function getTierForLevel(level: number): TierInfo {
  return TIERS.find(t => level >= t.min && level <= t.max) ?? TIERS[TIERS.length - 1]
}

// XP thresholds (same formula as backend)
function buildXpThresholds(): number[] {
  const list = [0, 2, 6, 14, 30]
  let delta = 20
  for (let i = 5; i < 200; i++) {
    list.push(list[list.length - 1] + delta)
    delta += 2
  }
  return list
}

export const XP_THRESHOLDS = buildXpThresholds()

export function getXpThresholdForLevel(level: number): number {
  return XP_THRESHOLDS[level - 1] ?? XP_THRESHOLDS[XP_THRESHOLDS.length - 1]
}

// Tier entry XP points (for display)
export const TIER_ENTRY_XP: Record<TierName, number> = {
  Cobalt: 0,
  Uranium: XP_THRESHOLDS[5],   // L6 = 50
  Platinum: XP_THRESHOLDS[10], // L11
  FlexiBase: XP_THRESHOLDS[15], // L16
}
