import { db } from '~/server/utils/database';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const name = body?.name as string;
  const onlyOne = body?.only_one_win_per_person ? 1 : 0;
  const background_url = body?.background_url as string | undefined;
  if (!name) throw createError({ statusCode: 400, statusMessage: 'name required' });
  const info = db.prepare('INSERT INTO campaigns (name, only_one_win_per_person, background_url) VALUES (?, ?, ?)').run(name, onlyOne, background_url ?? null);
  return { id: Number(info.lastInsertRowid) };
});


