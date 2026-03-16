export type TierName = 'Cobalt' | 'Uranium' | 'Platinum' | 'FlexiBase';

export interface Tier {
  name: TierName;
  min: number;
  max: number;
  color: string;
  glowColor: string;
  cssClass: string;
  gradient?: string;
}

export const TIERS: Tier[] = [
  {
    name: 'Cobalt',
    min: 1,
    max: 5,
    color: '#94A3B8',
    glowColor: 'rgba(148,163,184,0.4)',
    cssClass: 'tier-cobalt',
  },
  {
    name: 'Uranium',
    min: 6,
    max: 10,
    color: '#39FF14',
    glowColor: 'rgba(57,255,20,0.5)',
    cssClass: 'tier-uranium',
  },
  {
    name: 'Platinum',
    min: 11,
    max: 15,
    color: '#E5E4E2',
    glowColor: 'rgba(229,228,226,0.6)',
    cssClass: 'tier-platinum',
    gradient:
      'linear-gradient(135deg, #E5E4E2 0%, #BFC1C2 30%, #E5E4E2 50%, #A8AAAB 70%, #E5E4E2 100%)',
  },
  {
    name: 'FlexiBase',
    min: 16,
    max: 20,
    color: '#00BFFF',
    glowColor: 'rgba(0,191,255,0.6)',
    cssClass: 'tier-flexibase',
  },
];

/** Returns the tier that contains the given level. Falls back to the last tier if out of range. */
export function getTierForLevel(level: number): Tier {
  return TIERS.find((t) => level >= t.min && level <= t.max) ?? TIERS[TIERS.length - 1];
}
