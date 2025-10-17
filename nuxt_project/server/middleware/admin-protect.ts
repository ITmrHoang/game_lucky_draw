import { getSessionFromEvent } from '~/server/utils/auth';

export default defineEventHandler((event) => {
  const url = getRequestURL(event);
  // Protect admin page and admin APIs except login
  const isAdminUI = url.pathname.startsWith('/admin');
  const isAdminApi = url.pathname.startsWith('/api') && (url.pathname.includes('/admin/') && !url.pathname.endsWith('/admin/login'));
  if (!(isAdminUI || isAdminApi)) return;

  const session = getSessionFromEvent(event);
  if (!session || session.role !== 'admin') {
    if (isAdminUI) {
      return sendRedirect(event, '/admin_login');
    }
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }
});


