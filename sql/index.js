export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const db = env.DATABASE_URL;

    // 健康检查
    if (url.pathname === '/api/health')
      return Response.json({ status: 'ok' });

    // 视频列表
    if (url.pathname === '/api/videos' && request.method === 'GET') {
      const res = await fetch(db + '&options=json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'SELECT * FROM videos ORDER BY created_at DESC LIMIT 20' })
      });
      return Response.json((await res.json()).rows || []);
    }

    // 发视频
    if (url.pathname === '/api/videos' && request.method === 'POST') {
      const { bvid, title, userId } = await request.json();
      await fetch(db + '&options=json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'INSERT INTO videos (bvid, title, user_id) VALUES ($1, $2, $3)',
          params: [bvid, title || '', userId]
        })
      });
      return Response.json({ success: true });
    }

    // 签到
    if (url.pathname === '/api/checkin' && request.method === 'POST') {
      const { userId } = await request.json();
      const today = new Date().toISOString().split('T')[0];
      const check = await fetch(db + '&options=json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'SELECT id FROM check_ins WHERE user_id = $1 AND date::date = $2',
          params: [userId, today]
        })
      });
      if ((await check.json()).rows?.length > 0)
        return Response.json({ error: '今日已签到' }, { status: 400 });

      await fetch(db + '&options=json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'INSERT INTO check_ins (user_id, date) VALUES ($1, $2)',
          params: [userId, today]
        })
      });
      return Response.json({ success: true, message: '签到成功' });
    }

    return new Response('Not Found', { status: 404 });
  }
};
