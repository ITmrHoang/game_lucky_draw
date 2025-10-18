
  console.log(import.meta.url); 
import { db } from '~/server/utils/database';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { campaign_id, name, winners_quota = 1, random_mode = 1, image_url } = body || {};
  if (!campaign_id || !name) throw createError({ statusCode: 400, statusMessage: 'campaign_id and name required' });
  const info = db.prepare('INSERT INTO prizes (campaign_id, name, winners_quota, random_mode, image_url) VALUES (?, ?, ?, ?, ?)')
    .run(campaign_id, name, winners_quota, random_mode, image_url ?? null);
  return { id: Number(info.lastInsertRowid) };
});


