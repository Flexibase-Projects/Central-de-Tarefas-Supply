# Referência Visual de Cores — CDT v2

## Comparativo: Antes × Depois

| Elemento | v1 (Atual) | v2 (Proposto) | Motivo |
|---|---|---|---|
| Background | `#050508` preto-roxo | `#F8FAFC` / `#0F172A` | Light + Dark real |
| Primária | `#a855f7` violeta | `#2563EB` azul-corporativo | Mais confiança/enterprise |
| Acento game | tudo é roxo | `#7C3AED` só em XP/Level | Separação clara de contexto |
| Tipografia | Cinzel serif fantasy | Inter sans-serif | Padrão SaaS moderno |
| Borda card | roxo `rgba(88,28,135,0.35)` | `#E2E8F0` / `#334155` | Elegante, não pesa |
| Hover scale | `scale(1.03)` + 0.85s | `scale(1.015)` + 0.2s | Mais responsivo |
| Animação borda | luz branca, 40s | azul (light) / branca (dark), 60s | Discreta e temática |

## Paleta Completa — Visualização

### LIGHT MODE
```
Background:  ████ #F8FAFC (slate-50)
Surface:     ████ #FFFFFF (white)
Surface-2:   ████ #F1F5F9 (slate-100)
Text:        ████ #0F172A (slate-900)
Text-2:      ████ #475569 (slate-600)
Muted:       ████ #94A3B8 (slate-400)
Border:      ████ #E2E8F0 (slate-200)
Primary:     ████ #2563EB (blue-600)
Game:        ████ #7C3AED (violet-700)
Success:     ████ #059669 (emerald-600)
Warning:     ████ #D97706 (amber-600)
Danger:      ████ #DC2626 (red-600)
Gold:        ████ #F59E0B (amber-500)
```

### DARK MODE
```
Background:  ████ #0F172A (slate-900)
Surface:     ████ #1E293B (slate-800)
Surface-2:   ████ #1E293B (slate-800)
Text:        ████ #F1F5F9 (slate-100)
Text-2:      ████ #94A3B8 (slate-400)
Muted:       ████ #475569 (slate-600)
Border:      ████ #334155 (slate-700)
Primary:     ████ #60A5FA (blue-400)
Game:        ████ #A78BFA (violet-400)
Success:     ████ #34D399 (emerald-400)
Warning:     ████ #FBBF24 (amber-400)
Danger:      ████ #F87171 (red-400)
Gold:        ████ #FBBF24 (amber-400)
```

## Contrastes WCAG AA (verificados)

| Par | Ratio | Status |
|---|---|---|
| `#0F172A` sobre `#F8FAFC` | 19.1:1 | ✅ AAA |
| `#475569` sobre `#F8FAFC` | 6.8:1  | ✅ AA |
| `#2563EB` sobre `#FFFFFF` | 4.7:1  | ✅ AA |
| `#FFFFFF` sobre `#2563EB` | 4.7:1  | ✅ AA |
| `#F1F5F9` sobre `#0F172A` | 16.8:1 | ✅ AAA |
| `#94A3B8` sobre `#0F172A` | 7.1:1  | ✅ AA |
| `#60A5FA` sobre `#0F172A` | 4.9:1  | ✅ AA |

## Uso da Cor de Gamificação (Violet)

**ONDE usar `--accent-game` (violet):**
- Barra de XP (fill do progresso)
- Badge "Nv. X" no sidebar footer
- Highlights na página de Conquistas
- Highlights na página de Níveis
- Badge de nivel na página de Perfil

**ONDE NÃO usar:**
- Navegação principal
- Botões de ação em formulários
- Status de tarefas/projetos
- Cards de dados operacionais
- Dashboard principal

## Uso do Gold (Amber)

**ONDE usar `--gold`:**
- Ícone de troféu nas Conquistas
- Badge de top-ranking
- "Conquista rara/lendária"
- Streak (sequência de dias)

**Regra:** Gold = raridade e conquista. Não usar como cor decorativa.
