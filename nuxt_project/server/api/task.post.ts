// server/api/tasks.post.ts
import { db } from '~/server/utils/database';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const title = body.title;

  if (!title) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Title is required',
    });
  }

  try {
    const stmt = db.prepare('INSERT INTO tasks (title) VALUES (?)');
    const info = stmt.run(title);
    return { success: true, lastInsertRowid: info.lastInsertRowid };
  } catch (error) {
    console.error(error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create task',
    });
  }
});