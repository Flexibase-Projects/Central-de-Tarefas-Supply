/**
 * Cria usuários no Supabase Auth + supply_users com senha inicial e must_set_password.
 * Uso (na raiz do monorepo): node backend/scripts/seed-supply-auth-users.mjs
 * Requer .env.local na raiz com SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootEnv = path.resolve(__dirname, '../../.env.local')
if (existsSync(rootEnv)) dotenv.config({ path: rootEnv })
else dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/^"|"$/g, '')
const TEMP_PASSWORD = '123456789'

/** @type {{ name: string; email: string }[]} */
const USERS = [
  { name: 'Mateus Amorim', email: 'pcp2@flexibase.com.br' },
  { name: 'Maria Eduarda Fagundes', email: 'produtos@flexibase.com.br' },
  { name: 'Mayke Felix dos Santos', email: 'projetos.flexibase@gmail.com' },
  { name: 'Amanda Santos', email: 'produtos2@flexibase.com.br' },
  // Uelington: mesmo e-mail que Mayke — Supabase Auth não permite duplicata; criar conta alternativa no painel se necessário.
  { name: 'Erick Fernando da Silva', email: 'compras1@flexibase.com.br' },
  { name: 'Renan de Sousa Lima', email: 'compras@flexibase.com.br' },
  { name: 'Marcio Carvalho', email: 'marciocarvalho@flexibase.com.br' },
  { name: 'Marciel Santana', email: 'gestaosupplychain@flexibase.com.br' },
  { name: 'Test User Supply', email: 'testusersupply@gmail.com' },
]

/** Admins: não redefine senha se o usuário já existir no Auth (mantém a senha que você já usa). */
const ADMIN_USERS = [{ name: 'Juan Dalvit', email: 'juan.dalvit1@gmail.com' }]

async function findAuthUserByEmail(supabase, email) {
  const normalized = email.trim().toLowerCase()
  let page = 1
  const perPage = 200
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const u = data.users.find((x) => (x.email || '').toLowerCase() === normalized)
    if (u) return u
    if (data.users.length < perPage) return null
    page += 1
  }
}

async function main() {
  if (!url || !serviceKey) {
    console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local da raiz.')
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: devRole, error: roleErr } = await supabase
    .from('supply_roles')
    .select('id')
    .eq('name', 'developer')
    .maybeSingle()
  if (roleErr || !devRole?.id) {
    const msg = String(roleErr?.message ?? roleErr ?? '')
    if (/fetch failed|ECONNREFUSED|ENOTFOUND/i.test(msg)) {
      console.error(
        'Não foi possível conectar ao Supabase. Confira SUPABASE_URL no .env.local (URL do projeto na nuvem, não 127.0.0.1 se você não estiver com `supabase start` local) e SUPABASE_SERVICE_ROLE_KEY.',
      )
    } else {
      console.error('Cargo developer não encontrado em supply_roles:', roleErr?.message ?? roleErr)
    }
    process.exit(1)
  }

  const { data: adminRole, error: adminRoleErr } = await supabase
    .from('supply_roles')
    .select('id')
    .eq('name', 'admin')
    .maybeSingle()
  if (adminRoleErr || !adminRole?.id) {
    console.error('Cargo admin não encontrado em supply_roles:', adminRoleErr?.message ?? adminRoleErr)
    process.exit(1)
  }

  console.log('--- Seed usuários Supply (senha inicial + troca no 1º login) ---\n')

  for (const { name, email } of USERS) {
    const normalizedEmail = email.trim().toLowerCase()
    const displayName = name.trim() || normalizedEmail.split('@')[0]

    try {
      let userId
      const existing = await findAuthUserByEmail(supabase, normalizedEmail)

      if (existing) {
        userId = existing.id
        const { error: updErr } = await supabase.auth.admin.updateUserById(userId, {
          password: TEMP_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: displayName, name: displayName },
        })
        if (updErr) throw updErr
        console.log(`[atualizado] ${normalizedEmail} (${displayName})`)
      } else {
        const { data: created, error: createErr } = await supabase.auth.admin.createUser({
          email: normalizedEmail,
          password: TEMP_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: displayName, name: displayName },
        })
        if (createErr) throw createErr
        userId = created.user.id
        console.log(`[criado] ${normalizedEmail} (${displayName})`)
      }

      const { error: upsertErr } = await supabase.from('supply_users').upsert(
        {
          id: userId,
          email: normalizedEmail,
          name: displayName,
          is_active: true,
          must_set_password: true,
        },
        { onConflict: 'id' },
      )
      if (upsertErr) throw upsertErr

      await supabase.from('supply_user_roles').delete().eq('user_id', userId)
      const { error: roleInsErr } = await supabase.from('supply_user_roles').insert({
        user_id: userId,
        role_id: devRole.id,
        assigned_by: null,
      })
      if (roleInsErr) throw roleInsErr
    } catch (e) {
      console.error(`[erro] ${normalizedEmail}:`, e?.message || e)
    }
  }

  console.log('\n--- Admins (senha do Auth só na criação de conta nova) ---\n')

  const newAdminPassword = process.env.SEED_NEW_USER_PASSWORD || TEMP_PASSWORD

  for (const { name, email } of ADMIN_USERS) {
    const normalizedEmail = email.trim().toLowerCase()
    const displayName = name.trim() || normalizedEmail.split('@')[0]

    try {
      let userId
      const existing = await findAuthUserByEmail(supabase, normalizedEmail)

      if (existing) {
        userId = existing.id
        const { error: updErr } = await supabase.auth.admin.updateUserById(userId, {
          email_confirm: true,
          user_metadata: { full_name: displayName, name: displayName },
        })
        if (updErr) throw updErr
        console.log(`[admin — conta já existia, senha não alterada] ${normalizedEmail}`)
      } else {
        const { data: created, error: createErr } = await supabase.auth.admin.createUser({
          email: normalizedEmail,
          password: newAdminPassword,
          email_confirm: true,
          user_metadata: { full_name: displayName, name: displayName },
        })
        if (createErr) throw createErr
        userId = created.user.id
        console.log(
          `[admin — criado] ${normalizedEmail} (senha inicial: a que está em SEED_NEW_USER_PASSWORD ou ${TEMP_PASSWORD})`,
        )
      }

      const { error: upsertErr } = await supabase.from('supply_users').upsert(
        {
          id: userId,
          email: normalizedEmail,
          name: displayName,
          is_active: true,
          must_set_password: false,
        },
        { onConflict: 'id' },
      )
      if (upsertErr) throw upsertErr

      await supabase.from('supply_user_roles').delete().eq('user_id', userId)
      const { error: roleInsErr } = await supabase.from('supply_user_roles').insert({
        user_id: userId,
        role_id: adminRole.id,
        assigned_by: null,
      })
      if (roleInsErr) throw roleInsErr
      console.log(`[admin — papel atribuído] ${normalizedEmail}`)
    } catch (e) {
      console.error(`[erro admin] ${normalizedEmail}:`, e?.message || e)
    }
  }

  console.log('\nConcluído.')
  console.log(
    '\nObs.: Uelington de Jesus da Paixão (projetos.flexibase@gmail.com) não foi listado — o e-mail já está em uso por Mayke. Crie um e-mail único para Uelington ou uma conta compartilhada no painel Auth.',
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
