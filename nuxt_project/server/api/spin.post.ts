import { db } from '~/server/utils/database';

type SpinBody = {
  campaignId: number;
  prizeId: number;
  force?: boolean;
};

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as SpinBody;
  const { campaignId, prizeId, force } = body;
  if (!campaignId || !prizeId) {
    throw createError({ statusCode: 400, statusMessage: 'campaignId & prizeId required' });
  }

  const prize = db.prepare('SELECT * FROM prizes WHERE id = ? AND campaign_id = ?').get(prizeId, campaignId);
  if (!prize) throw createError({ statusCode: 404, statusMessage: 'Prize not found' });

  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);
  if (!campaign) throw createError({ statusCode: 404, statusMessage: 'Campaign not found' });

  // Đếm số người đã trúng của giải này
  const winnersCount = db.prepare('SELECT COUNT(1) as c FROM winners WHERE prize_id = ?').get(prizeId).c as number;
  if (winnersCount >= prize.winners_quota && !force) {
    return { exhausted: true, winnersCount, winnersQuota: prize.winners_quota };
  }

  // Nếu có preset và còn preset chưa dùng, ưu tiên chọn
  const preset = db.prepare(`
    SELECT c.id as code_id, c.code, p.full_name, p.phone
    FROM prize_preset_winners pp
    JOIN codes c ON c.id = pp.code_id AND c.campaign_id = ?
    JOIN people p ON p.id = c.person_id
    WHERE pp.prize_id = ?
      AND NOT EXISTS (SELECT 1 FROM winners w WHERE w.prize_id = ? AND w.code_id = c.id)
    LIMIT 1
  `).get(campaignId, prizeId, prizeId);

  let chosen: any = preset;

  if (!chosen) {
    // Ràng buộc một người chỉ trúng 1 lần trong kỳ nếu bật
    const onlyOne = campaign.only_one_win_per_person === 1;
    const candidates = db.prepare(`
      SELECT c.id as code_id, c.code, p.full_name, p.phone
      FROM codes c
      JOIN people p ON p.id = c.person_id
      WHERE c.campaign_id = ?
        AND c.used = 0
        AND NOT EXISTS (SELECT 1 FROM winners w WHERE w.code_id = c.id)
        ${onlyOne ? 'AND NOT EXISTS (SELECT 1 FROM winners w2 JOIN codes c2 ON c2.id = w2.code_id WHERE w2.campaign_id = c.campaign_id AND c2.person_id = c.person_id)' : ''}
      ORDER BY RANDOM()
      LIMIT 1
    `).get(campaignId);
    if (!candidates) {
      return { exhausted: true };
    }
    chosen = candidates;
  }

  const insert = db.prepare('INSERT INTO winners (campaign_id, prize_id, code_id) VALUES (?, ?, ?)');
  insert.run(campaignId, prizeId, chosen.code_id);
  db.prepare('UPDATE codes SET used = 1 WHERE id = ?').run(chosen.code_id);

  const maskedPhone = chosen.phone ? `${chosen.phone.slice(0, -3)}xxx` : '';
  return { code: chosen.code, fullName: chosen.full_name, phone: maskedPhone };
});


