export interface AchievementDef {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category:
    | 'productivity'
    | 'activities'
    | 'milestone'
    | 'streak'
    | 'collaboration'
    | 'projects'
    | 'challenge'
    | 'misc';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpBonus: number;
  conditionType:
    | 'todos_count'
    | 'activities_count'
    | 'level'
    | 'total_xp'
    | 'streak'
    | 'deadline_todos'
    | 'deadline_activities'
    | 'challenge_todos'
    | 'comments_count'
    | 'manual';
  conditionValue: number;
}

export interface AchievementContext {
  completedTodos: number;
  completedActivities: number;
  level: number;
  totalXp: number;
  streakDays: number;
  deadlineTodos: number;       // todos completed before deadline
  deadlineActivities: number;  // activities completed before due_date
  challengeTodos: number;      // todos with achievement_id completed
  commentsCount: number;
}

export const PRESET_ACHIEVEMENTS: AchievementDef[] = [
  // ── Category: productivity (todos) ──────────────────────────────────────
  {
    slug: 'first_todo',
    name: 'Primeira Missão',
    description: 'Conclua seu primeiro to-do.',
    icon: 'check_circle',
    category: 'productivity',
    rarity: 'common',
    xpBonus: 5,
    conditionType: 'todos_count',
    conditionValue: 1,
  },
  {
    slug: 'five_todos',
    name: 'Em Ritmo',
    description: 'Conclua 5 to-dos.',
    icon: 'task_alt',
    category: 'productivity',
    rarity: 'common',
    xpBonus: 10,
    conditionType: 'todos_count',
    conditionValue: 5,
  },
  {
    slug: 'ten_todos',
    name: 'Produtivo',
    description: 'Conclua 10 to-dos.',
    icon: 'stars',
    category: 'productivity',
    rarity: 'common',
    xpBonus: 15,
    conditionType: 'todos_count',
    conditionValue: 10,
  },
  {
    slug: 'twentyfive_todos',
    name: 'Máquina de Tarefas',
    description: 'Conclua 25 to-dos.',
    icon: 'bolt',
    category: 'productivity',
    rarity: 'rare',
    xpBonus: 25,
    conditionType: 'todos_count',
    conditionValue: 25,
  },
  {
    slug: 'hundred_todos',
    name: 'Centurião',
    description: 'Conclua 100 to-dos.',
    icon: 'military_tech',
    category: 'productivity',
    rarity: 'epic',
    xpBonus: 50,
    conditionType: 'todos_count',
    conditionValue: 100,
  },
  {
    slug: 'twofifty_todos',
    name: 'Lendário da Lista',
    description: 'Conclua 250 to-dos.',
    icon: 'emoji_events',
    category: 'productivity',
    rarity: 'legendary',
    xpBonus: 100,
    conditionType: 'todos_count',
    conditionValue: 250,
  },
  {
    slug: 'deadline_first',
    name: 'Prazo Cumprido',
    description: 'Conclua um to-do antes do prazo.',
    icon: 'timer',
    category: 'productivity',
    rarity: 'common',
    xpBonus: 10,
    conditionType: 'deadline_todos',
    conditionValue: 1,
  },
  {
    slug: 'deadline_five',
    name: 'Pontualidade',
    description: 'Conclua 5 to-dos antes do prazo.',
    icon: 'schedule',
    category: 'productivity',
    rarity: 'rare',
    xpBonus: 25,
    conditionType: 'deadline_todos',
    conditionValue: 5,
  },
  {
    slug: 'deadline_twenty',
    name: 'Sem Atrasos',
    description: 'Conclua 20 to-dos antes do prazo.',
    icon: 'alarm_on',
    category: 'productivity',
    rarity: 'epic',
    xpBonus: 50,
    conditionType: 'deadline_todos',
    conditionValue: 20,
  },
  // ── Category: activities ─────────────────────────────────────────────────
  {
    slug: 'first_activity',
    name: 'Primeira Atividade',
    description: 'Conclua sua primeira atividade.',
    icon: 'flag',
    category: 'activities',
    rarity: 'common',
    xpBonus: 10,
    conditionType: 'activities_count',
    conditionValue: 1,
  },
  {
    slug: 'five_activities',
    name: 'Executor',
    description: 'Conclua 5 atividades.',
    icon: 'play_circle',
    category: 'activities',
    rarity: 'common',
    xpBonus: 15,
    conditionType: 'activities_count',
    conditionValue: 5,
  },
  {
    slug: 'fifteen_activities',
    name: 'Especialista',
    description: 'Conclua 15 atividades.',
    icon: 'workspace_premium',
    category: 'activities',
    rarity: 'rare',
    xpBonus: 30,
    conditionType: 'activities_count',
    conditionValue: 15,
  },
  {
    slug: 'thirty_activities',
    name: 'Veterano',
    description: 'Conclua 30 atividades.',
    icon: 'verified',
    category: 'activities',
    rarity: 'epic',
    xpBonus: 60,
    conditionType: 'activities_count',
    conditionValue: 30,
  },
  {
    slug: 'fifty_activities',
    name: 'Mestre das Atividades',
    description: 'Conclua 50 atividades.',
    icon: 'auto_awesome',
    category: 'activities',
    rarity: 'legendary',
    xpBonus: 120,
    conditionType: 'activities_count',
    conditionValue: 50,
  },
  {
    slug: 'activity_deadline_first',
    name: 'Atividade Relâmpago',
    description: 'Conclua uma atividade antes do prazo.',
    icon: 'flash_on',
    category: 'activities',
    rarity: 'common',
    xpBonus: 15,
    conditionType: 'deadline_activities',
    conditionValue: 1,
  },
  {
    slug: 'activity_deadline_ten',
    name: 'Sem Pendências',
    description: 'Conclua 10 atividades antes do prazo.',
    icon: 'done_all',
    category: 'activities',
    rarity: 'rare',
    xpBonus: 40,
    conditionType: 'deadline_activities',
    conditionValue: 10,
  },
  // ── Category: milestone (levels & XP) ───────────────────────────────────
  {
    slug: 'level_5',
    name: 'Nível 5',
    description: 'Alcance o nível 5.',
    icon: 'looks_5',
    category: 'milestone',
    rarity: 'common',
    xpBonus: 10,
    conditionType: 'level',
    conditionValue: 5,
  },
  {
    slug: 'uranium_unlocked',
    name: 'Uranizado',
    description: 'Alcance o nível 6 — tier Uranium desbloqueado!',
    icon: 'science',
    category: 'milestone',
    rarity: 'rare',
    xpBonus: 20,
    conditionType: 'level',
    conditionValue: 6,
  },
  {
    slug: 'level_10',
    name: 'Nível 10',
    description: 'Alcance o nível 10.',
    icon: 'looks_10',
    category: 'milestone',
    rarity: 'rare',
    xpBonus: 30,
    conditionType: 'level',
    conditionValue: 10,
  },
  {
    slug: 'platinum_unlocked',
    name: 'Platinado',
    description: 'Alcance o nível 11 — tier Platinum desbloqueado!',
    icon: 'diamond',
    category: 'milestone',
    rarity: 'epic',
    xpBonus: 50,
    conditionType: 'level',
    conditionValue: 11,
  },
  {
    slug: 'level_15',
    name: 'Nível 15',
    description: 'Alcance o nível 15.',
    icon: 'star',
    category: 'milestone',
    rarity: 'epic',
    xpBonus: 50,
    conditionType: 'level',
    conditionValue: 15,
  },
  {
    slug: 'flexibase_unlocked',
    name: 'FlexiBase',
    description: 'Alcance o nível 16 — tier FlexiBase desbloqueado!',
    icon: 'electric_bolt',
    category: 'milestone',
    rarity: 'legendary',
    xpBonus: 100,
    conditionType: 'level',
    conditionValue: 16,
  },
  {
    slug: 'level_20',
    name: 'Nível 20',
    description: 'Alcance o nível 20 — nível máximo!',
    icon: 'crown',
    category: 'milestone',
    rarity: 'legendary',
    xpBonus: 200,
    conditionType: 'level',
    conditionValue: 20,
  },
  {
    slug: 'xp_500',
    name: 'XP 500',
    description: 'Acumule 500 XP total.',
    icon: 'bar_chart',
    category: 'milestone',
    rarity: 'rare',
    xpBonus: 20,
    conditionType: 'total_xp',
    conditionValue: 500,
  },
  {
    slug: 'xp_1000',
    name: 'XP 1000',
    description: 'Acumule 1000 XP total.',
    icon: 'trending_up',
    category: 'milestone',
    rarity: 'epic',
    xpBonus: 50,
    conditionType: 'total_xp',
    conditionValue: 1000,
  },
  // ── Category: streak ─────────────────────────────────────────────────────
  {
    slug: 'streak_2',
    name: 'Dois Dias Seguidos',
    description: 'Conclua tarefas em 2 dias consecutivos.',
    icon: 'local_fire_department',
    category: 'streak',
    rarity: 'common',
    xpBonus: 10,
    conditionType: 'streak',
    conditionValue: 2,
  },
  {
    slug: 'streak_7',
    name: 'Semana Produtiva',
    description: 'Streak de 7 dias.',
    icon: 'whatshot',
    category: 'streak',
    rarity: 'rare',
    xpBonus: 30,
    conditionType: 'streak',
    conditionValue: 7,
  },
  {
    slug: 'streak_15',
    name: 'Quinzena Forte',
    description: 'Streak de 15 dias.',
    icon: 'flare',
    category: 'streak',
    rarity: 'epic',
    xpBonus: 60,
    conditionType: 'streak',
    conditionValue: 15,
  },
  {
    slug: 'streak_30',
    name: 'Mês Impecável',
    description: 'Streak de 30 dias.',
    icon: 'stars',
    category: 'streak',
    rarity: 'legendary',
    xpBonus: 150,
    conditionType: 'streak',
    conditionValue: 30,
  },
  // ── Category: collaboration ───────────────────────────────────────────────
  {
    slug: 'first_comment',
    name: 'Primeiro Comentário',
    description: 'Poste seu primeiro comentário.',
    icon: 'chat',
    category: 'collaboration',
    rarity: 'common',
    xpBonus: 5,
    conditionType: 'comments_count',
    conditionValue: 1,
  },
  {
    slug: 'ten_comments',
    name: 'Discussão Ativa',
    description: 'Poste 10 comentários.',
    icon: 'forum',
    category: 'collaboration',
    rarity: 'common',
    xpBonus: 10,
    conditionType: 'comments_count',
    conditionValue: 10,
  },
  {
    slug: 'twentyfive_comments',
    name: 'Voz do Time',
    description: 'Poste 25 comentários.',
    icon: 'record_voice_over',
    category: 'collaboration',
    rarity: 'rare',
    xpBonus: 25,
    conditionType: 'comments_count',
    conditionValue: 25,
  },
  // ── Category: challenge ───────────────────────────────────────────────────
  {
    slug: 'challenge_first',
    name: 'Desafio Aceitador',
    description: 'Conclua 1 to-do desafio.',
    icon: 'sports_score',
    category: 'challenge',
    rarity: 'rare',
    xpBonus: 30,
    conditionType: 'challenge_todos',
    conditionValue: 1,
  },
  {
    slug: 'challenge_five',
    name: 'Desafiante',
    description: 'Conclua 5 to-dos desafio.',
    icon: 'gps_fixed',
    category: 'challenge',
    rarity: 'epic',
    xpBonus: 75,
    conditionType: 'challenge_todos',
    conditionValue: 5,
  },
  {
    slug: 'challenge_ten',
    name: 'Mestre dos Desafios',
    description: 'Conclua 10 to-dos desafio.',
    icon: 'workspace_premium',
    category: 'challenge',
    rarity: 'legendary',
    xpBonus: 150,
    conditionType: 'challenge_todos',
    conditionValue: 10,
  },
  // ── Category: misc ────────────────────────────────────────────────────────
  {
    slug: 'eisenhower_3',
    name: 'Mapa Estratégico',
    description: 'Posicione 3 itens no Mapa Eisenhower.',
    icon: 'map',
    category: 'misc',
    rarity: 'common',
    xpBonus: 10,
    conditionType: 'manual',
    conditionValue: 0,
  },
  {
    slug: 'eisenhower_all',
    name: 'Estrategista',
    description: 'Preencha todos os 4 quadrantes do Mapa.',
    icon: 'grid_4x4',
    category: 'misc',
    rarity: 'rare',
    xpBonus: 25,
    conditionType: 'manual',
    conditionValue: 0,
  },
  {
    slug: 'canvas_first',
    name: 'Canva do Time',
    description: 'Faça sua primeira edição no Canva em Equipe.',
    icon: 'brush',
    category: 'misc',
    rarity: 'common',
    xpBonus: 10,
    conditionType: 'manual',
    conditionValue: 0,
  },
  {
    slug: 'canvas_ten',
    name: 'Artista Colaborativo',
    description: 'Faça 10 edições no Canva em Equipe.',
    icon: 'palette',
    category: 'misc',
    rarity: 'rare',
    xpBonus: 25,
    conditionType: 'manual',
    conditionValue: 0,
  },
  {
    slug: 'profile_complete',
    name: 'Perfil Completo',
    description: 'Preencha seu nome e avatar no perfil.',
    icon: 'account_circle',
    category: 'misc',
    rarity: 'common',
    xpBonus: 15,
    conditionType: 'manual',
    conditionValue: 0,
  },
  {
    slug: 'early_bird',
    name: 'Madrugador',
    description: 'Conclua uma tarefa antes das 8h.',
    icon: 'wb_sunny',
    category: 'misc',
    rarity: 'rare',
    xpBonus: 20,
    conditionType: 'manual',
    conditionValue: 0,
  },
  {
    slug: 'night_owl',
    name: 'Coruja da Noite',
    description: 'Conclua uma tarefa após as 22h.',
    icon: 'nights_stay',
    category: 'misc',
    rarity: 'rare',
    xpBonus: 20,
    conditionType: 'manual',
    conditionValue: 0,
  },
  // ── Category: projects ────────────────────────────────────────────────────
  {
    slug: 'first_project',
    name: 'Primeiro Projeto',
    description: 'Participe do seu primeiro projeto.',
    icon: 'folder',
    category: 'projects',
    rarity: 'common',
    xpBonus: 10,
    conditionType: 'manual',
    conditionValue: 0,
  },
  {
    slug: 'five_projects',
    name: 'Multi-Projeto',
    description: 'Participe de 5 projetos.',
    icon: 'folder_open',
    category: 'projects',
    rarity: 'rare',
    xpBonus: 25,
    conditionType: 'manual',
    conditionValue: 0,
  },
  {
    slug: 'ten_projects',
    name: 'Portfólio Completo',
    description: 'Participe de 10 projetos.',
    icon: 'inventory_2',
    category: 'projects',
    rarity: 'epic',
    xpBonus: 50,
    conditionType: 'manual',
    conditionValue: 0,
  },
  {
    slug: 'github_integrated',
    name: 'Código Comprometido',
    description: 'Vincule um repositório GitHub a um projeto.',
    icon: 'code',
    category: 'projects',
    rarity: 'common',
    xpBonus: 15,
    conditionType: 'manual',
    conditionValue: 0,
  },
  {
    slug: 'three_github',
    name: 'Dev Integrado',
    description: 'Vincule GitHub a 3 projetos.',
    icon: 'hub',
    category: 'projects',
    rarity: 'rare',
    xpBonus: 30,
    conditionType: 'manual',
    conditionValue: 0,
  },
  {
    slug: 'pioneer',
    name: 'Pioneiro',
    description: 'Seja o primeiro a concluir um projeto compartilhado.',
    icon: 'rocket_launch',
    category: 'projects',
    rarity: 'legendary',
    xpBonus: 200,
    conditionType: 'manual',
    conditionValue: 0,
  },
];

/**
 * Evaluates which achievements from PRESET_ACHIEVEMENTS are newly unlocked
 * given the current context and the set of already-unlocked slugs.
 * Manual achievements (conditionType: 'manual') are never auto-unlocked here;
 * they must be awarded explicitly via a separate mechanism.
 *
 * Returns an array of newly unlocked slugs.
 */
export function evaluateAchievements(
  ctx: AchievementContext,
  existingSlugSet: Set<string>,
): string[] {
  const newlyUnlocked: string[] = [];
  for (const ach of PRESET_ACHIEVEMENTS) {
    if (existingSlugSet.has(ach.slug)) continue;
    let unlocked = false;
    switch (ach.conditionType) {
      case 'todos_count':
        unlocked = ctx.completedTodos >= ach.conditionValue;
        break;
      case 'activities_count':
        unlocked = ctx.completedActivities >= ach.conditionValue;
        break;
      case 'level':
        unlocked = ctx.level >= ach.conditionValue;
        break;
      case 'total_xp':
        unlocked = ctx.totalXp >= ach.conditionValue;
        break;
      case 'streak':
        unlocked = ctx.streakDays >= ach.conditionValue;
        break;
      case 'deadline_todos':
        unlocked = ctx.deadlineTodos >= ach.conditionValue;
        break;
      case 'deadline_activities':
        unlocked = ctx.deadlineActivities >= ach.conditionValue;
        break;
      case 'challenge_todos':
        unlocked = ctx.challengeTodos >= ach.conditionValue;
        break;
      case 'comments_count':
        unlocked = ctx.commentsCount >= ach.conditionValue;
        break;
      case 'manual':
        // Manual achievements are awarded explicitly — never auto-evaluated
        unlocked = false;
        break;
    }
    if (unlocked) newlyUnlocked.push(ach.slug);
  }
  return newlyUnlocked;
}
