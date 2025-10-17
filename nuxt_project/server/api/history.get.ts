import { db } from '~/server/utils/database';

export default defineEventHandler((event) => {
  const query = getQuery(event);
  const campaignId = query.campaignId ? Number(query.campaignId) : undefined;

  const campaign = campaignId
    ? db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId)
    : db.prepare('SELECT * FROM campaigns ORDER BY id DESC LIMIT 1').get();
  if (!campaign) return { campaign: null, winners: [] };

  const winners = db.prepare(`
    SELECT w.id, w.created_at,
           pz.name as prize_name,
           c.code,
           ppl.full_name, ppl.phone
    FROM winners w
    JOIN prizes pz ON pz.id = w.prize_id
    JOIN codes c ON c.id = w.code_id
    JOIN people ppl ON ppl.id = c.person_id
    WHERE w.campaign_id = ?
    ORDER BY w.created_at DESC
  `).all(campaign.id);

  return { campaign, winners };
});


