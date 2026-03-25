import express from 'express';
import { supabase } from '../config/supabase.js';
import { checkRole } from '../middleware/permissions.js';

const router = express.Router();

const GAMIFICATION_KEY = 'gamification_enabled';

async function getGamificationEnabled(): Promise<boolean> {
  const { data, error } = await supabase
    .from('supply_app_settings')
    .select('value_json')
    .eq('key', GAMIFICATION_KEY)
    .maybeSingle();

  if (error || !data?.value_json) return false;
  const raw = (data.value_json as { enabled?: unknown }).enabled;
  return raw === true;
}

router.get('/feature-flags', async (_req, res) => {
  try {
    const gamificationEnabled = await getGamificationEnabled();
    return res.json({ gamificationEnabled });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Falha ao carregar feature flags' });
  }
});

router.put('/feature-flags', checkRole('admin'), async (req, res) => {
  try {
    const gamificationEnabled = req.body?.gamificationEnabled === true;
    const userId = (req.headers['x-user-id'] as string | undefined) ?? null;

    const { error } = await supabase.from('supply_app_settings').upsert(
      {
        key: GAMIFICATION_KEY,
        value_json: { enabled: gamificationEnabled },
        updated_by: userId,
      },
      { onConflict: 'key' },
    );

    if (error) throw error;

    return res.json({ gamificationEnabled });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Falha ao salvar feature flags' });
  }
});

export default router;
