import type { CSSProperties, ElementType } from 'react'
import { Person, Trophy, TrendingUp, HelpCircle } from '@/components/ui/icons'

export const LEVEL_CARD_MENU_ITEMS: {
  title: string
  url: string
  icon: ElementType
  iconStyle?: CSSProperties
}[] = [
  { title: 'Ver Meu Nível', url: '/perfil', icon: Person },
  { title: 'Conquistas', url: '/conquistas', icon: Trophy, iconStyle: { color: '#F59E0B' } },
  { title: 'Progressão', url: '/niveis', icon: TrendingUp },
  { title: 'Como Funciona?', url: '/tutorial', icon: HelpCircle },
]
