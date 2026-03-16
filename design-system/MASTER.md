# Central de Tarefas — Design System Master
**Versão:** 2.0 | **Status:** Planejamento aprovado | **Atualizado:** 2026-03-16

---

## 1. Diagnóstico do Tema Atual

### Problemas identificados
| Elemento | Atual (v1) | Problema |
|---|---|---|
| Cor primária | `#a855f7` violet intenso | Gamey, pouco corporativo |
| Background | `#050508` quase preto | Extremo, cansativo, não suporta light mode |
| Tipografia | Cinzel serif | Demasiado medieval/fantasy |
| Paleta | Só dark, roxo/cyan | Sem contraste tonal, tudo igual |
| Identidade | "Master Mode" game-theme | Conflita com uso enterprise |

### O que PRESERVAR (decisão do produto)
- ✅ **Animação da borda giratória** — `conic-gradient` com `@property --angle` (apenas adaptar cor)
- ✅ **Hover light sweep** — reflexo que atravessa o card na esquerda → direita
- ✅ **Estrutura de layout** — sidebar colapsável, grid de cards
- ✅ **Sistema de gamificação** — XP, níveis, conquistas (redesign visual, não remover)

---

## 2. Design System v2 — "Slate Enterprise"

### Filosofia
> **"Corporate first, gamified subtly."**
> A interface deve comunicar seriedade e eficiência em 90% do espaço visual.
> A gamificação deve ser uma camada de recompensa, visível mas nunca dominante.
> Inspirações: Linear, Vercel Dashboard, Jira Premium, Notion.

---

## 3. Paleta de Cores

### Tokens semânticos (CSS Variables)

```css
/* ===== LIGHT MODE ===== */
:root {
  /* Backgrounds */
  --bg-base:        #F8FAFC;   /* slate-50  — página */
  --bg-surface:     #FFFFFF;   /* branco    — cards, modais */
  --bg-surface-2:   #F1F5F9;   /* slate-100 — sidebar, headers internos */
  --bg-overlay:     rgba(15, 23, 42, 0.45); /* scrim de modal */

  /* Texto */
  --text-primary:   #0F172A;   /* slate-900 */
  --text-secondary: #475569;   /* slate-600 */
  --text-muted:     #94A3B8;   /* slate-400 */
  --text-inverse:   #F8FAFC;   /* sobre fundos escuros */

  /* Borda / Divider */
  --border-base:    #E2E8F0;   /* slate-200 */
  --border-strong:  #CBD5E1;   /* slate-300 */

  /* Ações primárias */
  --primary:        #2563EB;   /* blue-600 */
  --primary-hover:  #1D4ED8;   /* blue-700 */
  --primary-soft:   #DBEAFE;   /* blue-100 — bg chips/badges */
  --primary-text:   #1E40AF;   /* blue-800 — texto sobre --primary-soft */

  /* Acento de gamificação — violeta suave, SÓ em XP/Level/Conquistas */
  --accent-game:    #7C3AED;   /* violet-700 */
  --accent-game-soft: #EDE9FE; /* violet-100 */
  --accent-game-text: #5B21B6; /* violet-800 */

  /* Status */
  --success:        #059669;   /* emerald-600 */
  --success-soft:   #D1FAE5;
  --warning:        #D97706;   /* amber-600 */
  --warning-soft:   #FEF3C7;
  --danger:         #DC2626;   /* red-600 */
  --danger-soft:    #FEE2E2;
  --info:           #0284C7;   /* sky-600 */
  --info-soft:      #E0F2FE;

  /* Gamification Gold — para ícones de troféu, conquistas, nível máximo */
  --gold:           #F59E0B;   /* amber-500 */
  --gold-soft:      #FEF3C7;
}

/* ===== DARK MODE ===== */
.dark, [data-theme="dark"] {
  --bg-base:        #0F172A;   /* slate-900 */
  --bg-surface:     #1E293B;   /* slate-800 */
  --bg-surface-2:   #1E293B;   /* slate-800 — sidebar */
  --bg-overlay:     rgba(0, 0, 0, 0.60);

  --text-primary:   #F1F5F9;   /* slate-100 */
  --text-secondary: #94A3B8;   /* slate-400 */
  --text-muted:     #475569;   /* slate-600 */
  --text-inverse:   #0F172A;

  --border-base:    #334155;   /* slate-700 */
  --border-strong:  #475569;   /* slate-600 */

  --primary:        #60A5FA;   /* blue-400 — mais claro no dark */
  --primary-hover:  #93C5FD;   /* blue-300 */
  --primary-soft:   rgba(96, 165, 250, 0.12);
  --primary-text:   #93C5FD;   /* blue-300 */

  --accent-game:    #A78BFA;   /* violet-400 */
  --accent-game-soft: rgba(167, 139, 250, 0.12);
  --accent-game-text: #C4B5FD; /* violet-300 */

  --success:        #34D399;   /* emerald-400 */
  --success-soft:   rgba(52, 211, 153, 0.12);
  --warning:        #FBBF24;   /* amber-400 */
  --warning-soft:   rgba(251, 191, 36, 0.12);
  --danger:         #F87171;   /* red-400 */
  --danger-soft:    rgba(248, 113, 113, 0.12);
  --info:           #38BDF8;   /* sky-400 */
  --info-soft:      rgba(56, 189, 248, 0.12);

  --gold:           #FBBF24;   /* amber-400 */
  --gold-soft:      rgba(251, 191, 36, 0.12);
}
```

### Mapeamento MUI (theme.ts v2)

```ts
palette: {
  mode: 'light' | 'dark',   // controlado por toggle
  primary: { main: '#2563EB', light: '#60A5FA', dark: '#1D4ED8' },
  secondary: { main: '#7C3AED', light: '#A78BFA', dark: '#5B21B6' },
  // secondary = acento game (violeta), usado APENAS em XP/Level/Conquistas
  background: {
    default: '#F8FAFC',      // light: slate-50  | dark: #0F172A
    paper: '#FFFFFF',        // light: white      | dark: #1E293B
  },
  text: {
    primary: '#0F172A',      // light: slate-900  | dark: #F1F5F9
    secondary: '#475569',    // light: slate-600  | dark: #94A3B8
    disabled: '#CBD5E1',     // light: slate-300  | dark: #334155
  },
  divider: '#E2E8F0',        // light: slate-200  | dark: #334155
  success: { main: '#059669' },
  warning: { main: '#D97706' },
  error:   { main: '#DC2626' },
  info:    { main: '#0284C7' },
}
```

---

## 4. Tipografia

### Stack

| Papel | Fonte | Peso | Tamanho |
|---|---|---|---|
| Títulos (h1–h3) | **Inter** | 700 | 32 / 24 / 20px |
| Subtítulos (h4–h6) | **Inter** | 600 | 18 / 16 / 14px |
| Corpo | **Inter** | 400 | 14–16px |
| Labels / caps | **Inter** | 500–600 | 10–12px, letter-spacing 0.8px |
| Monospace / código | **JetBrains Mono** | 400 | 13px |

> ⚠️ **Remover Cinzel.** Ela é bonita mas comunica "jogo medieval", não "SaaS corporativo".
> Inter é o padrão ouro de enterprise SaaS (Linear, Vercel, GitHub, Notion).

```html
<!-- Google Fonts — adicionar no index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Escala tipográfica MUI

```ts
typography: {
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  h1: { fontSize: '2rem',    fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 },
  h2: { fontSize: '1.5rem',  fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.3 },
  h3: { fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.01em' },
  h4: { fontSize: '1.125rem',fontWeight: 600 },
  h5: { fontSize: '1rem',    fontWeight: 600 },
  h6: { fontSize: '0.875rem',fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' },
  body1: { fontSize: '0.9375rem', lineHeight: 1.6 },  // 15px
  body2: { fontSize: '0.875rem',  lineHeight: 1.55 },  // 14px
  caption: { fontSize: '0.75rem', letterSpacing: '0.03em' },
  overline: { fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' },
}
```

---

## 5. Forma, Sombra e Elevação

### Border Radius

```ts
shape: { borderRadius: 8 }   // base: 8px — corporativo moderno, não redondo demais
// Derivados via CSS:
// --radius-sm:  4px   — badges, chips, inputs
// --radius-md:  8px   — cards, botões, dropdowns
// --radius-lg: 12px   — modais, sidesheets
// --radius-xl: 16px   — modais grandes, login card
// --radius-full: 9999px — avatars, progress pills
```

### Sistema de Sombra (Elevation Scale)

```css
/* Light Mode */
--shadow-xs:  0 1px 2px rgba(15,23,42,0.06);
--shadow-sm:  0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04);
--shadow-md:  0 4px 6px rgba(15,23,42,0.07), 0 2px 4px rgba(15,23,42,0.04);
--shadow-lg:  0 10px 15px rgba(15,23,42,0.08), 0 4px 6px rgba(15,23,42,0.03);
--shadow-xl:  0 20px 25px rgba(15,23,42,0.09), 0 8px 10px rgba(15,23,42,0.04);

/* Dark Mode — sombras mais fracas, o contraste de superfície já separa */
.dark {
  --shadow-xs: 0 1px 2px rgba(0,0,0,0.25);
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.30);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.25);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.28);
  --shadow-xl: 0 20px 25px rgba(0,0,0,0.30);
}
```

---

## 6. Animações — PRESERVAR E ADAPTAR

### 6.1 Borda Giratória (manter mecanismo, trocar cor)

A técnica com `@property`, `conic-gradient` e `mask-composite` é mantida integralmente.
Apenas a **cor do brilho** muda conforme o tema:

```css
/* LIGHT MODE — brilho azul-índigo discreto */
html[data-theme="light"] .animated-border-card::before {
  background: conic-gradient(
    from var(--border-angle) at 50% 50%,
    transparent 0deg,
    transparent 300deg,
    rgba(37, 99, 235, 0.15)  320deg,   /* blue-600 fraco */
    rgba(37, 99, 235, 0.45)  340deg,
    rgba(99, 102, 241, 0.80) 352deg,   /* indigo-500 pico */
    rgba(37, 99, 235, 0.45)  357deg,
    rgba(37, 99, 235, 0.15)  360deg
  );
}

/* DARK MODE — brilho branco (manter atual, funciona perfeitamente) */
html[data-theme="dark"] .animated-border-card::before {
  background: conic-gradient(
    from var(--border-angle) at 50% 50%,
    transparent 0deg,
    transparent 280deg,
    rgba(255,255,255,0.20) 300deg,
    rgba(255,255,255,0.55) 325deg,
    rgba(255,255,255,0.90) 350deg,
    rgba(255,255,255,0.55) 355deg,
    rgba(255,255,255,0.20) 360deg
  );
}

/* Velocidade: 40s (atual) → 60s — mais sutil, mais corporativo */
animation: border-rotate 60s linear infinite;
```

### 6.2 Hover Light Sweep (manter mecanismo, adaptar)

```css
/* LIGHT MODE — reflexo mais suave, tom branco-leitoso */
.animated-border-card::after {
  background:
    linear-gradient(78deg,
      transparent 10%,
      rgba(255,255,255,0.0) 25%,
      rgba(255,255,255,0.08) 40%,
      rgba(255,255,255,0.16) 50%,
      rgba(255,255,255,0.08) 60%,
      rgba(255,255,255,0.0) 75%,
      transparent 90%
    ),
    var(--bg-surface);
}

/* DARK MODE — manter atual (funciona bem) */
```

### 6.3 Micro-interações gerais

```
Duração padrão:  200ms
Ease padrão:     cubic-bezier(0.4, 0, 0.2, 1)  (Material ease standard)
Hover scale:     1.015  (reduzir de 1.03 — mais discreto no corporativo)
Hover transição: 200ms (reduzir de 0.85s — mais responsivo)
```

---

## 7. Componentes — Especificação por Tipo

### 7.1 Cards (base)

```
Light: bg #FFF, border 1px solid #E2E8F0, shadow-sm
       hover: shadow-md, border #CBD5E1, scale(1.015)
Dark:  bg #1E293B, border 1px solid #334155
       hover: border #475569, shadow-lg, scale(1.015)

Borda animada: SIM — aplicada via classe .card-animated
Hover sweep:   SIM — nas mesmas classes
border-radius: 8px (--radius-md)
padding:       16–24px conforme uso
```

### 7.2 Sidebar

```
Width: 240px expandida | 64px colapsada
Light: bg #F1F5F9 (slate-100), border-right 1px solid #E2E8F0
Dark:  bg #0F172A (same as base), border-right 1px solid #1E293B

Nav item ativo:
  - indicator bar: 3px, cor --primary, left side
  - text/icon: cor --primary
  - bg: --primary-soft

Nav item hover:
  - bg: #E2E8F0 (light) | #334155 (dark)
  - transition: 150ms

Seção label (INSIGHT, FERRAMENTAS):
  - overline style: 10px, 600, uppercase, letter-spacing 1.2px
  - cor: --text-muted

Logo/header: border-bottom 1px solid --border-base
```

### 7.3 Botões

```
Primary:   bg --primary, text branco, radius 8px, shadow-xs
           hover: --primary-hover, shadow-sm, translate(-1px)
           active: scale(0.97)

Secondary: bg --bg-surface-2, text --text-primary, border 1px solid --border-base
           hover: bg --border-base

Danger:    bg --danger, text branco
Ghost:     text --primary, bg transparent
           hover: --primary-soft

Size SM:   h 32px, px 12px, fontSize 13px
Size MD:   h 38px, px 16px, fontSize 14px  (padrão)
Size LG:   h 44px, px 20px, fontSize 15px
```

### 7.4 Badges e Chips de Status

```
Todo/Backlog: bg #F1F5F9, text slate-600
Em andamento: bg blue-100,  text blue-800 (dark: blue-soft, blue-300)
Concluído:    bg emerald-100, text emerald-800
Revisão:      bg amber-100, text amber-800
Bloqueado:    bg red-100,   text red-800

Formato: pill (radius-full), 6px 12px padding, 12px font, 500 weight
```

### 7.5 Inputs / Forms

```
Light: bg #FFFFFF, border 1px solid #CBD5E1, text #0F172A
       focus: border --primary, ring 2px rgba(37,99,235,0.15)
Dark:  bg #0F172A, border 1px solid #334155, text #F1F5F9
       focus: border --primary, ring 2px rgba(96,165,250,0.2)

height: 38px
radius: 8px
label: 13px, 500 weight, --text-secondary, mb 6px
helper/error: 12px, below field, error em --danger
```

### 7.6 Tabelas (Admin)

```
Header:   bg --bg-surface-2, text --text-secondary, overline style
Row:      bg --bg-surface, hover bg --bg-surface-2
Divider:  1px solid --border-base
Padding:  12px 16px por célula

Badges de permissão/role: sistema de chips coloridos por tipo
Actions:  ícones ghost, aparecem no row hover
```

### 7.7 Kanban Cards

```
Card:       bg --bg-surface, shadow-sm, radius-md, border 1px solid --border-base
            hover: shadow-md, border --border-strong, scale(1.015)
            borda animada: SIM (mais lenta: 80s cycle)

Priority dot: 8px circle, cor por prioridade
  Alta:     #DC2626 (red)
  Média:    #D97706 (amber)
  Baixa:    #059669 (emerald)

Tag chips: inline, radius-sm, bg colorido por categoria
Assignee:  avatar 24px, radius-full, empilhados (-8px)
Due date:  ícone calendar, 12px, --text-muted (vermelho se vencida)
```

### 7.8 Dialog / Modal

```
Overlay:   rgba(0,0,0,0.45) light | rgba(0,0,0,0.65) dark
Backdrop:  blur(4px)
Container: bg --bg-surface, shadow-xl, radius-lg (12px), border 1px solid --border-base
Max-width: 560px (padrão) | 800px (dialogs grandes)
Header:    border-bottom --border-base, h6 + close button
Footer:    border-top --border-base, flex gap-2 justify-end

Animação entrada: scale(0.95) + opacity(0) → scale(1) + opacity(1), 200ms ease-out
Animação saída:   scale(0.95) + opacity(0), 150ms ease-in
```

---

## 8. Gamificação — Redesign Visual (Manter Lógica)

### Filosofia de gamificação corporativa
> Pense em "progresso de carreira", não "personagem de RPG".
> Referência: LinkedIn Premium, Duolingo Pro, GitHub Contributions.

### 8.1 XP Bar (LevelXpBar)

```
Estilo atual: violet glowing bar, fonte Cinzel
Novo estilo:
  - Progress bar: cor --primary (azul), sem glow excessivo
  - Label "Nível X": Inter 12px 600, --text-secondary, uppercase
  - XP counter: Inter 11px 400, --text-muted
  - Track: --bg-surface-2 com border radius-full
  - Fill: linear-gradient(90deg, --primary, --accent-game) — gradiente sutil azul→violeta
  - Height: 5px (mais fino e elegante)
  - Animação fill: transition 600ms ease-out (ao ganhar XP)
```

### 8.2 Level Badge

```
Formato: pill pequeno — "Nv. 12"
Cor:     --accent-game-soft bg, --accent-game-text text
Ícone:   nenhum (simples e limpo)
Posição: ao lado do nome do usuário no sidebar footer
```

### 8.3 Conquistas (Achievements)

```
Grid: 3–4 colunas de badges
Badge conquistado:
  - icon 32px em bg colorido (gold, blue, emerald por categoria)
  - título 12px 600
  - shadow-sm, border --border-base
  - borda animada suave (120s cycle — muito sutil)

Badge bloqueado:
  - icon grayscale, opacity 0.4
  - bg --bg-surface-2
  - lock icon overlay

Toast de conquista nova:
  - entrada: slide-in da direita
  - ícone trophy em --gold
  - texto: "Conquista desbloqueada: [Nome]"
  - 5 segundos, dismiss manual disponível
```

### 8.4 Página Níveis

```
Timeline vertical: cada nível é um item
Nível atual: highlighted com --primary-soft bg + border --primary
Próximo nível: outline dashed --border-base
Completados: checkmark em --success, linha verde
Layout card: shadow-sm, radius-md
```

---

## 9. Telas — Especificação Individual

### 9.1 Login

```
Layout: Duas colunas (desktop) — esquerda branding 40%, direita form 60%
        Mobile: form centralizado full width

Lado esquerdo (branding):
  - bg --primary (gradiente: #1E40AF → #2563EB)
  - Logo CDT centralizado, branco
  - Tagline em Inter 400 branco 90%
  - Pattern sutil (noise texture ou grid dots, opacity 0.06)

Lado direito (form):
  - bg --bg-base (light) | --bg-surface (dark)
  - Card centralizado, max-w 400px
  - "Entrar" — h4, --text-primary
  - Input email + password, labels visíveis
  - Button primário full-width "Acessar"
  - Link "Esqueceu a senha?"
  - SEM borda animada no login card (muito distrativo)
  - Transição de entrada: fade + translate-y(8px), 300ms
```

### 9.2 Dashboard

```
Layout: Grid 4 colunas (xl) → 2 (md) → 1 (sm)
Header: h1 "Dashboard" + data atual à direita

Metric Cards (4x):
  - Projetos Ativos, Tarefas em Andamento, Próximas Revisões, Concluídos
  - bg --bg-surface, shadow-sm, radius-md
  - Número: h2 700, --text-primary
  - Label: body2, --text-secondary
  - Ícone decorativo: 40px, --primary-soft bg, --primary icon
  - Trend indicator: +X% em --success ou --danger
  - Borda animada: SIM (cycle 80s — discreto)
  - Hover sweep: SIM

Seção de atividade recente (futura):
  - Lista timeline, cada item com avatar + descrição
  - bg --bg-surface, shadow-sm

Widget XP (sidebar footer, não no dashboard):
  - Não poluir o dashboard com gamificação
  - Dashboard = informação operacional pura
```

### 9.3 Mapa (Eisenhower)

```
Quadrantes: 2×2 grid, ocupando 90% da viewport
Fundo: bg --bg-base, grid lines em --border-base opacity 0.5
Eixos labels: "Urgente / Não urgente" | "Importante / Não importante"
  - Inter 600 12px, --text-muted, uppercase

Quadrante headers:
  Q1 Urgente+Importante:  bg rgba(220,38,38,0.06), label red-700
  Q2 Não urgente+Import:  bg rgba(37,99,235,0.06), label blue-700
  Q3 Urgente+Não import:  bg rgba(217,119,6,0.06), label amber-700
  Q4 Não urgente+Não imp: bg rgba(5,150,105,0.06), label emerald-700

Bubbles de projeto:
  - Cada projeto = pill/chip arrastável
  - bg --primary com opacity por prioridade
  - shadow-md, radius-md
  - Drag: scale(1.08) + shadow-xl
```

### 9.4 Prioridades

```
Layout: Lista drag-drop vertical + opcional kanban
Cards de prioridade:
  - Número de ordem à esquerda (1, 2, 3...)
  - Drag handle: ícone ⠿ em --text-muted, aparece no hover
  - Título: body1 600
  - Badges: status + categoria
  - Borda animada: SIM (cycle 90s)

Ordem drag visual:
  - Placeholder: border 2px dashed --primary, bg --primary-soft, opacity 0.5
  - Dragging item: scale(1.02), shadow-lg, cursor grabbing
```

### 9.5 Indicadores

```
Layout: Grid flexível, cards de gráfico
Chart cards:
  - Header: h6 título + period selector (tabs: Semana/Mês/Trimestre)
  - bg --bg-surface, shadow-sm, radius-md
  - Borda animada: SIM (cycle 100s — muito sutil)

Paleta de gráficos (acessível, não uso de cor único):
  Serie 1:  #2563EB (blue-600)
  Serie 2:  #059669 (emerald-600)
  Serie 3:  #D97706 (amber-600)
  Serie 4:  #7C3AED (violet-700)
  Serie 5:  #DC2626 (red-600)
  Serie 6:  #0284C7 (sky-600)

Grid lines: --border-base (muito suave)
Tooltips:  bg --bg-surface, shadow-md, radius-sm, border --border-base
Texto eixos: 11px, --text-muted
```

### 9.6 Desenvolvimentos / Atividades (Kanban)

```
Colunas:
  Header: h6 uppercase + badge count (pill --primary-soft)
  bg: --bg-surface-2, radius-md, border 1px solid --border-base
  Min-height: 120px, drop zone highlight: --primary-soft border dashed

Cards Kanban:
  bg --bg-surface, shadow-xs, radius-md, border 1px solid --border-base
  hover: shadow-sm, scale(1.01), border --border-strong
  borda animada: SIM (cycle 70s)
  hover sweep: SIM
  padding: 12px

  Conteúdo:
    - Priority dot (8px, cor por prioridade)
    - Título: body2 600, --text-primary (max 2 linhas)
    - Descrição: caption, --text-muted (max 2 linhas, clamp)
    - Tags: chips inline, radius-sm
    - Footer: assignee avatar + due date, flex justify-between

  Dialog de detalhe:
    - Modal, max-w 700px
    - Header: título + status badge + close
    - Body: descrição completa + todo list + comments
    - Sidebar dentro do modal: meta-info (assignee, due, prioridade)
```

### 9.7 Canva em Equipe

```
Apenas wrapping do Excalidraw:
  - Toolbar customizada sobreposta: shadow-md, radius-lg, bg --bg-surface
  - Fundo do canvas: --bg-base (light) | #1A202C (dark suave, não preto total)
  - SEM borda animada (canvas é diferente)
```

### 9.8 Administração

```
Layout: Tabs (Usuários / Perfis / Permissões)
  Tab ativa: border-bottom 2px --primary, text --primary

Tabelas:
  Header sticky: bg --bg-surface-2
  Row hover: bg --bg-surface-2
  Actions visíveis apenas no hover (ícones edit/delete)

Modais de edição: padrão Modal spec acima
Chips de role/permissão: coloridos por categoria
```

### 9.9 Conquistas

```
Header: "Suas Conquistas" h2 + contador "X / Y desbloqueadas"
Progress bar geral: --accent-game color, radius-full

Grid: 4 colunas (lg) → 3 (md) → 2 (sm)
Cards de conquista:
  - 120×120px cards quadrados, radius-lg
  - Ícone 48px centralizado
  - Nome: 12px 600 abaixo
  - Conquistado: cores vivas, shadow-sm, borda animada (120s)
  - Bloqueado: grayscale + lock + opacity 0.5

Categorias: filtro por chips no topo
```

### 9.10 Níveis

```
Layout: Linha do tempo vertical (progress steps)
Nível atual: card destacado --primary-soft border, tag "Você está aqui"
Cada nível:
  - Badge de número: circle 48px, bg conforme tier
  - Título do tier: h5
  - XP necessário: body2 --text-muted
  - Recompensas desbloqueadas: chips

Tiers de cor:
  1–5:   Slate  (iniciante)  — --border-strong
  6–10:  Blue   (júnior)     — --primary-soft
  11–20: Violet (sênior)     — --accent-game-soft
  21–50: Gold   (expert)     — --gold-soft
```

### 9.11 Perfil

```
Header: Avatar 80px (radius-full) + nome h3 + cargo body2
        Badges de nível + conquistas destaque

Seções:
  - Informações pessoais: form read-only com botão Editar
  - Estatísticas: grid 2×2 mini-cards (tasks criadas, completadas, streak, rank)
  - Atividade recente: timeline compacta
  - Conquistas recentes: 3–4 últimas
```

---

## 10. Sidebar Footer — Gamificação Integrada

```
[Nv. 12 ████████░░ 80% → Nv. 13]   ← XP bar compacta, visível sempre
[Avatar] João Silva          [Sair]  ← footer do usuário

Detalhes:
  - XP bar: height 4px, radius-full
  - Fill: linear-gradient(90deg, --primary 0%, --accent-game 100%)
  - Nível badge: "Nv. 12" em pill --accent-game-soft
  - Ao clicar na barra: vai para /niveis
  - Conquistas link: ícone trophy em --gold (só o ícone, com tooltip)
```

---

## 11. Light/Dark Toggle

```
Posição: Header superior direito (TopBar) ou no footer do sidebar
Componente: Switch com ícone Sun/Moon
Persistência: localStorage('theme') + prefers-color-scheme fallback
Transição: color-scheme transition 300ms (apenas colors, SEM layout shift)

CSS:
  * { transition: background-color 300ms ease, border-color 300ms ease, color 200ms ease; }
  /* Exceção: desabilitar para animações de entrada/saída */
```

---

## 12. TopBar / Header

```
Altura: 56px
Light: bg #FFFFFF, border-bottom 1px solid --border-base, shadow-xs
Dark:  bg #1E293B, border-bottom 1px solid --border-base

Conteúdo (esquerda → direita):
  [ Título da página atual (h5) ]        [ Busca global ] [ Notificações ] [ Light/Dark ] [ Avatar ]

Notificações:
  - Badge: pill vermelho com count, max "9+"
  - Dropdown: shadow-xl, radius-lg, max-h 400px, scroll interno

Avatar:
  - Circle 32px, iniciais ou foto
  - Click → dropdown: Perfil, Conquistas, Sair
```

---

## 13. Espaçamento e Grid

```
Sistema: 4pt base (múltiplos de 4px)

Gap entre cards no grid:  24px (6 × 4)
Padding interno de cards: 20px (5 × 4)
Padding de página:        24–32px
Sidebar padding:          8–12px

Breakpoints:
  xs:  0–599px    → 1 coluna, sem sidebar
  sm:  600–899px  → 2 colunas, sidebar colapsada
  md:  900–1199px → 3 colunas, sidebar colapsada
  lg:  1200–1535px→ 4 colunas, sidebar expandida
  xl:  1536px+    → sidebar expandida, conteúdo max-w ajustado
```

---

## 14. Scrollbar Customizada

```css
/* Manter o que já existe, apenas ajustar cores */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--border-strong) transparent;
}
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: var(--radius-full);
}
::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
```

---

## 15. Background de Página

```
Atual: imagem + overlay roxo, muito pesado
Novo:
  Light: bg --bg-base (#F8FAFC) — limpo, sem imagem
         Opcional: noise texture ultra-sutil (opacity 0.015)

  Dark:  bg #0F172A — slate-900, limpo
         Opcional: radial-gradient muito sutil no canto superior:
         radial-gradient(ellipse 800px 500px at 0% 0%,
           rgba(37,99,235,0.04) 0%, transparent 70%)
```

---

## 16. Checklist de Implementação

### Fase 1 — Fundação (theme.ts + index.css)
- [ ] Novo tema MUI com paleta Slate+Blue
- [ ] CSS Variables completas (light + dark)
- [ ] ThemeProvider com toggle light/dark
- [ ] Trocar Cinzel → Inter (Google Fonts)
- [ ] Adaptar animação da borda (cor azul no light)
- [ ] Remover background.png do :root
- [ ] Ajustar velocidade das animações (60s+ cycle)

### Fase 2 — Layout Base
- [ ] Sidebar: adaptar cores e remover purple hard-coded
- [ ] TopBar: novo componente com toggle de tema
- [ ] XP Bar: redesign com nova paleta
- [ ] Login: novo layout dois-painéis

### Fase 3 — Cards e Kanban
- [ ] Card base: nova sombra e borda
- [ ] Kanban cards: atualizar estilos
- [ ] Status badges: paleta semântica
- [ ] Dialogs: novo design

### Fase 4 — Páginas de Gamificação
- [ ] Conquistas: redesign grid
- [ ] Níveis: timeline redesign
- [ ] Perfil: novo layout

### Fase 5 — Páginas de Dados
- [ ] Dashboard: metric cards + ícones
- [ ] Indicadores: paleta de gráficos acessível
- [ ] Mapa Eisenhower: quadrantes coloridos

---

## 17. Tokens de Cor — Referência Rápida

| Token | Light | Dark | Uso |
|---|---|---|---|
| `--bg-base` | #F8FAFC | #0F172A | Fundo da página |
| `--bg-surface` | #FFFFFF | #1E293B | Cards, modais |
| `--bg-surface-2` | #F1F5F9 | #1E293B | Sidebar, headers internos |
| `--text-primary` | #0F172A | #F1F5F9 | Texto principal |
| `--text-secondary` | #475569 | #94A3B8 | Labels, meta |
| `--text-muted` | #94A3B8 | #475569 | Placeholder, caps |
| `--primary` | #2563EB | #60A5FA | Ações, links, foco |
| `--accent-game` | #7C3AED | #A78BFA | XP, Level, Conquistas |
| `--gold` | #F59E0B | #FBBF24 | Troféus, rank top |
| `--border-base` | #E2E8F0 | #334155 | Borda padrão |
| `--border-strong` | #CBD5E1 | #475569 | Borda enfatizada |

---

*Documento gerado para o projeto Central de Tarefas — uso interno.*
*Próximo passo: implementar Fase 1 após aprovação deste planejamento.*
