import { db } from '~/server/utils/database';

export default defineEventHandler((event) => {
  const query = getQuery(event);
  const id = query.id ? Number(query.id) : undefined;
  if (id) {
    const stmt = db.prepare('SELECT * FROM campaigns WHERE id = ?');
    const campaign = stmt.get(id);
    return { campaign };
  }
  const list = db.prepare('SELECT * FROM campaigns ORDER BY id DESC').all();
  return { campaigns: list };
});


