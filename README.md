# Central de Tarefas - Supply

Sistema de gerenciamento de tarefas, projetos e atividades para o departamento de **Supply Chain** da Flexibase.

Versão: **1.0.0**

---

## Sobre o Projeto

Clone dedicado ao Supply Chain, com banco de dados totalmente isolado (tabelas `supply_*`) no mesmo projeto Supabase. Derivado do CDT-Inteligência, mas com identidade, configurações e dados independentes.

Funcionalidades incluídas:

- Kanban de Projetos com Mapa Eisenhower e prioridades
- Gestão de Atividades com gamificação (XP, conquistas, níveis)
- To-dos por projeto e atividade com notificações
- Organograma do departamento Supply Chain
- Gestão de Custos (itens, departamentos, mapa React Flow)
- Canva em Equipe (Excalidraw colaborativo)
- Indicadores e dashboard de progresso
- Integração com GitHub (commits, repositórios)
- RBAC (papéis e permissões por usuário)

---

## Tecnologias

**Frontend:** React 18 + TypeScript, Vite, Tailwind CSS, MUI, @dnd-kit, React Router

**Backend:** Node.js + Express + TypeScript, Supabase JS Client, Octokit

**Banco de Dados:** Supabase (PostgreSQL) — tabelas prefixadas com `supply_`

---

## Instalação

### Pré-requisitos

- Node.js 18+ e npm
- Supabase rodando (local em `http://127.0.0.1:54321` ou cloud)
- (Opcional) Token GitHub para integração com repositórios

### Passos

1. **Clone o repositório**

```bash
git clone https://github.com/Flexibase-Projects/Central-de-Tarefas-Supply.git
cd Central-de-Tarefas-Supply
```

2. **Instale as dependências**

```bash
npm run install:all
```

3. **Configure as variáveis de ambiente**

Crie `.env.local` na raiz do projeto (copie de `.env.example`):

```env
# Supabase
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<sua_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<sua_service_role_key>
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<sua_anon_key>

# Portas (Supply usa 3012 backend / 3005 frontend para não conflitar com o CDT original)
BACKEND_PORT=3012
VITE_PORT=3005
FRONTEND_URL=http://localhost:3005

# GitHub (opcional)
GITHUB_TOKEN=<seu_token>
```

4. **Banco de dados**

A migration `backend/migrations/012_supply_tables.sql` cria todas as tabelas `supply_*`. Execute via MCP Supabase ou manualmente no SQL Editor do Supabase Dashboard.

5. **Execute o projeto**

```bash
npm run dev
```

Acesse `http://localhost:3005` no navegador.

6. **Usuários base (Auth + `supply_users`)**

Na raiz, com `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` do **mesmo projeto** no `.env.local`:

```bash
npm run seed:supply-users
```

Isso cria ou atualiza contas com senha inicial `123456789`, marca `must_set_password` e atribui o papel `developer`. No primeiro login, a tela pede nova senha com confirmação. **Mayke** e **Uelington** não podem compartilhar o mesmo e-mail no Auth; defina um e-mail exclusivo para Uelington e inclua no script `backend/scripts/seed-supply-auth-users.mjs` se necessário.

---

## Estrutura do Projeto

```
Central-de-Tarefas-Supply/
├── backend/
│   ├── migrations/           # SQL versionado (012_supply_tables.sql)
│   └── src/
│       ├── routes/           # Rotas da API (tabelas supply_*)
│       ├── config/           # Supabase client
│       ├── middleware/        # Auth JWT
│       └── utils/
├── frontend/
│   └── src/
│       ├── components/       # Componentes React
│       ├── pages/            # Páginas da aplicação
│       ├── hooks/            # React hooks
│       └── lib/              # Supabase client, utilitários
├── .env.example              # Modelo de variáveis (nunca commitar .env.local)
├── supabase-schema.sql       # Schema de referência
└── package.json              # Workspace root (cdt-supply v1.0.0)
```

---

## Separação de Bancos (Isolamento Supply vs. Inteligência)

| Sistema          | Prefixo tabelas | Backend porta | Frontend porta |
|------------------|-----------------|---------------|----------------|
| CDT Inteligência | `cdt_`          | 3002          | 3003           |
| CDT Supply       | `supply_`       | 3012          | 3005           |

Ambos os sistemas compartilham o mesmo projeto Supabase, mas com dados completamente isolados.

---

## Scripts Disponíveis

- `npm run dev` — Inicia frontend (3005) e backend (3012) simultaneamente
- `npm run build` — Build de produção
- `npm run start` — Inicia apenas o backend (serve API + SPA na mesma porta em produção)
- `npm run install:all` — Instala dependências de todos os workspaces
- `npm run seed:supply-users` — Seed de usuários Auth + `supply_users` (requer service role)

---

## Licença

Proprietário — Flexibase
