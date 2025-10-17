import { db } from '~/server/utils/database';

function parseCsv(content: string): string[][] {
  return content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((l) => l.split(',').map((c) => c.trim()));
}

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event);
  if (!form) throw createError({ statusCode: 400, statusMessage: 'multipart/form-data required' });
  const prizeId = Number(form.find((f) => f.name === 'prizeId')?.data?.toString() || '');
  if (!prizeId) throw createError({ statusCode: 400, statusMessage: 'prizeId required' });
  const file = form.find((f) => f.name === 'file');
  if (!file) throw createError({ statusCode: 400, statusMessage: 'file required' });
  const content = (file.data as Buffer).toString('utf8');
  const rows = parseCsv(content);
  if (!rows.length) return { inserted: 0 };
  // optional header: code
  const first = rows[0].map((s) => s.toLowerCase());
  const startIdx = first[0] === 'code' ? 1 : 0;

  const findCode = db.prepare('SELECT id FROM codes WHERE code = ?');
  const insertPreset = db.prepare('INSERT OR IGNORE INTO prize_preset_winners (prize_id, code_id) VALUES (?, ?)');
  let inserted = 0;
  for (let i = startIdx; i < rows.length; i++) {
    const [code] = rows[i];
    if (!code) continue;
    const c = findCode.get(code) as any;
    if (!c) continue;
    const info = insertPreset.run(prizeId, c.id);
    if (info.changes > 0) inserted++;
  }
  return { inserted };
});


