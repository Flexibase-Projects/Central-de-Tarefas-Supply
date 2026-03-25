import express from 'express';
import { supabase } from '../config/supabase.js';
import { requireAdmin } from '../middleware/require-admin.js';

const router = express.Router();
router.use(requireAdmin);

function isMissingTable(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  return e?.code === '42P01' || !!(e?.message && /does not exist/i.test(String(e.message)));
}

/** GET /api/cost-management/graph — dados agregados para árvore de custos */
router.get('/graph', async (_req, res) => {
  try {
    const [
      { data: departments, error: e1 },
      { data: links, error: e2 },
      { data: members, error: e3 },
      { data: costItems, error: e4 },
      { data: punctualCosts, error: e5 },
    ] = await Promise.all([
      supabase.from('supply_departments').select('*').order('name'),
      supabase.from('supply_department_costs').select('*'),
      supabase.from('supply_department_members').select('*'),
      supabase.from('supply_cost_items').select('*').order('name'),
      supabase
        .from('supply_department_punctual_costs')
        .select('*')
        .order('reference_date', { ascending: false }),
    ]);

    if (e1) throw e1;
    if (e2) throw e2;
    if (e3) throw e3;
    if (e4) throw e4;
    if (e5 && !isMissingTable(e5)) throw e5;

    const userIds = [...new Set((members ?? []).map((m: { user_id: string }) => m.user_id))];
    let users: { id: string; name: string; email: string; avatar_url: string | null }[] = [];
    if (userIds.length > 0) {
      const { data: u } = await supabase.from('supply_users').select('id, name, email, avatar_url').in('id', userIds);
      users = u ?? [];
    }
    const umap = new Map(users.map((u) => [u.id, u]));

    const enrichedMembers = (members ?? []).map((m: Record<string, unknown>) => ({
      ...m,
      user: umap.get(m.user_id as string) ?? null,
    }));

    res.json({
      departments: departments ?? [],
      departmentCosts: links ?? [],
      members: enrichedMembers,
      costItems: costItems ?? [],
      punctualCosts: e5 && isMissingTable(e5) ? [] : punctualCosts ?? [],
    });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/** GET /api/cost-management/summary */
router.get('/summary', async (_req, res) => {
  try {
    const [
      { data: departments },
      { data: costLinks },
      { data: members },
      { data: costItems },
      { data: orgRows, error: orgErr },
      { data: punctualRows, error: punctualErr },
    ] = await Promise.all([
      supabase.from('supply_departments').select('id, name'),
      supabase.from('supply_department_costs').select('department_id, cost_id'),
      supabase.from('supply_department_members').select('department_id, user_id, individual_monthly_cost'),
      supabase.from('supply_cost_items').select('id, name, amount, status, is_active, category, activities_description, result_savings_description, result_savings_amount'),
      supabase.from('supply_user_org').select('department_id, monthly_cost').not('department_id', 'is', null),
      supabase.from('supply_department_punctual_costs').select('department_id, amount'),
    ]);

    const deptList = departments ?? [];
    const links = costLinks ?? [];
    const mems = members ?? [];
    const items = costItems ?? [];

    const costById = new Map(items.map((c: { id: string }) => [c.id, c]));

    const byDept: Record<
      string,
      {
        departmentId: string;
        departmentName: string;
        fixedCostsTotal: number;
        peopleCostsTotal: number;
        orgPeopleCostsTotal: number;
        punctualCostsTotal: number;
        total: number;
        costItemCount: number;
        memberCount: number;
        orgPersonCount: number;
        punctualCount: number;
      }
    > = {};

    for (const d of deptList as { id: string; name: string }[]) {
      byDept[d.id] = {
        departmentId: d.id,
        departmentName: d.name,
        fixedCostsTotal: 0,
        peopleCostsTotal: 0,
        orgPeopleCostsTotal: 0,
        punctualCostsTotal: 0,
        total: 0,
        costItemCount: 0,
        memberCount: 0,
        orgPersonCount: 0,
        punctualCount: 0,
      };
    }

    for (const l of links as { department_id: string; cost_id: string }[]) {
      const row = byDept[l.department_id];
      if (!row) continue;
      const ci = costById.get(l.cost_id) as { amount?: number; is_active?: boolean } | undefined;
      if (ci && ci.is_active !== false) {
        row.fixedCostsTotal += Number(ci.amount) || 0;
      }
      row.costItemCount += 1;
    }

    for (const m of mems as { department_id: string; individual_monthly_cost: number }[]) {
      const row = byDept[m.department_id];
      if (!row) continue;
      row.peopleCostsTotal += Number(m.individual_monthly_cost) || 0;
      row.memberCount += 1;
    }

    if (!orgErr && Array.isArray(orgRows)) {
      for (const o of orgRows as { department_id: string; monthly_cost: number | null }[]) {
        const row = byDept[o.department_id];
        if (!row) continue;
        row.orgPersonCount += 1;
        row.orgPeopleCostsTotal += Number(o.monthly_cost) || 0;
      }
    }

    if (!punctualErr && Array.isArray(punctualRows)) {
      for (const p of punctualRows as { department_id: string; amount: number }[]) {
        const row = byDept[p.department_id];
        if (!row) continue;
        row.punctualCostsTotal += Number(p.amount) || 0;
        row.punctualCount += 1;
      }
    }

    for (const k of Object.keys(byDept)) {
      const r = byDept[k];
      r.total =
        Math.round(
          (r.fixedCostsTotal +
            r.peopleCostsTotal +
            r.orgPeopleCostsTotal +
            r.punctualCostsTotal) *
            100
        ) / 100;
      r.fixedCostsTotal = Math.round(r.fixedCostsTotal * 100) / 100;
      r.peopleCostsTotal = Math.round(r.peopleCostsTotal * 100) / 100;
      r.orgPeopleCostsTotal = Math.round(r.orgPeopleCostsTotal * 100) / 100;
      r.punctualCostsTotal = Math.round(r.punctualCostsTotal * 100) / 100;
    }

    const statusTotals: Record<string, { count: number; amount: number }> = {};
    for (const c of items as { status: string; amount: number }[]) {
      if (!statusTotals[c.status]) statusTotals[c.status] = { count: 0, amount: 0 };
      statusTotals[c.status].count += 1;
      statusTotals[c.status].amount += Number(c.amount) || 0;
    }

    res.json({
      departments: Object.values(byDept),
      costItemsByStatus: statusTotals,
      costItemsNarrative: items.map((c: Record<string, unknown>) => ({
        id: c.id,
        name: c.name,
        amount: c.amount,
        status: c.status,
        category: c.category,
        is_active: c.is_active,
        activities_description: c.activities_description,
        result_savings_description: c.result_savings_description,
        result_savings_amount: c.result_savings_amount,
      })),
    });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

function sliceDate(v: unknown): string | null {
  if (typeof v !== 'string' || v.length < 10) return null;
  return v.slice(0, 10);
}

/** POST /api/cost-management/punctual-costs */
router.post('/punctual-costs', async (req, res) => {
  try {
    const b = req.body ?? {};
    const department_id = b.department_id;
    const title = typeof b.title === 'string' ? b.title.trim() : '';
    if (!department_id || typeof department_id !== 'string') {
      return res.status(400).json({ error: 'department_id is required' });
    }
    if (!title) return res.status(400).json({ error: 'title is required' });

    const timing_kind = b.timing_kind === 'period' ? 'period' : 'punctual';

    let payload: Record<string, unknown>;

    if (timing_kind === 'period') {
      const ps = sliceDate(b.period_start_date);
      const pe = sliceDate(b.period_end_date);
      if (!ps || !pe) {
        return res.status(400).json({ error: 'period_start_date and period_end_date are required (YYYY-MM-DD)' });
      }
      if (pe < ps) {
        return res.status(400).json({ error: 'period_end_date must be on or after period_start_date' });
      }
      payload = {
        department_id,
        title,
        description: typeof b.description === 'string' ? b.description.trim() || null : null,
        amount: b.amount != null ? Number(b.amount) : 0,
        currency: typeof b.currency === 'string' ? b.currency : 'BRL',
        timing_kind: 'period',
        reference_date: ps,
        period_start_date: ps,
        period_end_date: pe,
      };
    } else {
      const reference_date = sliceDate(b.reference_date);
      if (!reference_date) {
        return res.status(400).json({ error: 'reference_date is required (YYYY-MM-DD)' });
      }
      payload = {
        department_id,
        title,
        description: typeof b.description === 'string' ? b.description.trim() || null : null,
        amount: b.amount != null ? Number(b.amount) : 0,
        currency: typeof b.currency === 'string' ? b.currency : 'BRL',
        timing_kind: 'punctual',
        reference_date: reference_date,
        period_start_date: null,
        period_end_date: null,
      };
    }

    const { data, error } = await supabase.from('supply_department_punctual_costs').insert(payload).select('*').single();
    if (error) {
      if (isMissingTable(error)) {
        return res.status(503).json({ error: 'Execute backend/migrations/016_supply_department_punctual_costs.sql', code: 'MIGRATION_REQUIRED' });
      }
      throw error;
    }
    res.status(201).json(data);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

type PunctualRow = {
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  timing_kind?: string;
  reference_date: string;
  period_start_date: string | null;
  period_end_date: string | null;
};

/** PATCH /api/cost-management/punctual-costs/:id */
router.patch('/punctual-costs/:id', async (req, res) => {
  try {
    const b = req.body ?? {};
    const { data: existing, error: fe } = await supabase
      .from('supply_department_punctual_costs')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (fe) throw fe;
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const ex = existing as PunctualRow;
    const next: PunctualRow = {
      title: ex.title,
      description: ex.description,
      amount: Number(ex.amount) || 0,
      currency: ex.currency || 'BRL',
      timing_kind: ex.timing_kind === 'period' ? 'period' : 'punctual',
      reference_date: String(ex.reference_date).slice(0, 10),
      period_start_date: ex.period_start_date ? String(ex.period_start_date).slice(0, 10) : null,
      period_end_date: ex.period_end_date ? String(ex.period_end_date).slice(0, 10) : null,
    };

    if (typeof b.title === 'string') next.title = b.title.trim();
    if (typeof b.description === 'string') next.description = b.description.trim() || null;
    if (b.amount != null) next.amount = Number(b.amount);
    if (typeof b.currency === 'string') next.currency = b.currency;
    if (b.timing_kind === 'period' || b.timing_kind === 'punctual') next.timing_kind = b.timing_kind;

    const r = sliceDate(b.reference_date);
    if (r) next.reference_date = r;
    const ps = sliceDate(b.period_start_date);
    if (ps) next.period_start_date = ps;
    const pe = sliceDate(b.period_end_date);
    if (pe) next.period_end_date = pe;

    if (next.timing_kind === 'punctual') {
      next.period_start_date = null;
      next.period_end_date = null;
    } else {
      if (!next.period_start_date || !next.period_end_date) {
        return res.status(400).json({ error: 'period_start_date and period_end_date are required for period costs' });
      }
      if (next.period_end_date < next.period_start_date) {
        return res.status(400).json({ error: 'period_end_date must be on or after period_start_date' });
      }
      next.reference_date = next.period_start_date;
    }

    const payload = {
      title: next.title,
      description: next.description,
      amount: next.amount,
      currency: next.currency,
      timing_kind: next.timing_kind,
      reference_date: next.reference_date,
      period_start_date: next.period_start_date,
      period_end_date: next.period_end_date,
    };

    const { data, error } = await supabase
      .from('supply_department_punctual_costs')
      .update(payload)
      .eq('id', req.params.id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/** DELETE /api/cost-management/punctual-costs/:id */
router.delete('/punctual-costs/:id', async (req, res) => {
  try {
    const { data: deleted, error } = await supabase
      .from('supply_department_punctual_costs')
      .delete()
      .eq('id', req.params.id)
      .select('id');
    if (error) throw error;
    if (!deleted?.length) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
