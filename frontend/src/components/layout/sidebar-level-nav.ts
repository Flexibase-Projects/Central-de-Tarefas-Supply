import type { CSSProperties, ElementType } from 'react'
import { Person, Trophy, TrendingUp, HelpCircle } from '@/components/ui/icons'

type LevelMenuItem = {
  title: string
  url: string
  icon: ElementType
  iconStyle?: CSSProperties
}

const BASE_ITEMS: LevelMenuItem[] = [{ title: 'Perfil', url: '/perfil', icon: Person }]
const GAMIFICATION_ITEMS: LevelMenuItem[] = [
  { title: 'Conquistas', url: '/conquistas', icon: Trophy, iconStyle: { color: '#F59E0B' } },
  { title: 'Progressão', url: '/niveis', icon: TrendingUp },
  { title: 'Como Funciona?', url: '/tutorial', icon: HelpCircle },
]

export function getLevelCardMenuItems(gamificationEnabled: boolean): LevelMenuItem[] {
  return gamificationEnabled ? [...BASE_ITEMS, ...GAMIFICATION_ITEMS] : BASE_ITEMS
}
