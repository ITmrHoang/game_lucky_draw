import { db } from '~/server/utils/database';

export default defineEventHandler((event) => {
  const query = getQuery(event);
  const campaignId = query.campaignId ? Number(query.campaignId) : undefined;
  if (!campaignId) {
    throw createError({ statusCode: 400, statusMessage: 'campaignId required' });
  }
  const prizes = db.prepare(`
    SELECT p.*, COALESCE(w.cnt, 0) AS winners_count
    FROM prizes p
    LEFT JOIN (
      SELECT prize_id, COUNT(1) AS cnt
      FROM winners
      GROUP BY prize_id
    ) w ON w.prize_id = p.id
    WHERE p.campaign_id = ?
    ORDER BY p.id ASC
  `).all(campaignId);
  return { prizes };
});


