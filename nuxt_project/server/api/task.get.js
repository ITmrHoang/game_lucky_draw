// server/api/tasks.get.ts
import { db } from '~/server/utils/database';

export default defineEventHandler(() => {
  try {
    const stmt = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC');
    const tasks = stmt.all();
    return { tasks };
  } catch (error) {
    console.error(error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch tasks',
    });
  }
});