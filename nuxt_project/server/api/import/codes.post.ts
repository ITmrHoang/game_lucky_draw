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
  const campaignId = Number(form.find((f) => f.name === 'campaignId')?.data?.toString() || '');
  if (!campaignId) throw createError({ statusCode: 400, statusMessage: 'campaignId required' });
  const file = form.find((f) => f.name === 'file');
  if (!file) throw createError({ statusCode: 400, statusMessage: 'file required' });
  const content = (file.data as Buffer).toString('utf8');
  const rows = parseCsv(content);
  if (!rows.length) return { inserted: 0 };
  // optional header: full_name,phone,code
  const first = rows[0].map((s) => s.toLowerCase());
  const startIdx = first[0] === 'full_name' ? 1 : 0;

  const insertPerson = db.prepare('INSERT INTO people (full_name, phone) VALUES (?, ?)');
  const findPerson = db.prepare('SELECT id FROM people WHERE full_name = ? AND phone IS ?');
  const insertCode = db.prepare('INSERT OR IGNORE INTO codes (campaign_id, person_id, code) VALUES (?, ?, ?)');

  let inserted = 0;
  for (let i = startIdx; i < rows.length; i++) {
    const [fullName, phone, code] = rows[i];
    if (!fullName || !code) continue;
    let person = findPerson.get(fullName, phone || null) as any;
    if (!person) {
      const pinfo = insertPerson.run(fullName, phone || null);
      person = { id: Number(pinfo.lastInsertRowid) };
    }
    const info = insertCode.run(campaignId, person.id, code);
    if (info.changes > 0) inserted++;
  }
  return { inserted };
});


