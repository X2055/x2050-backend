// X2050 Backend - Cloudflare Worker
// 使用 Hono 框架 + Neon Serverless Driver

import { Hono } from 'hono';
import { neon } from '@neondatabase/serverless';

const app = new Hono();

// ========== 健康检查 ==========
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'x2050-backend',
    timestamp: new Date().toISOString(),
  });
});

// ========== 用户相关 ==========
app.get('/api/users/:id', async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const userId = c.req.param('id');
  const rows = await sql`SELECT id, nickname, avatar_url, bio, level, total_points, created_at FROM users WHERE id = ${userId}`;
  if (rows.length === 0) return c.json({ error: '用户不存在' }, 404);
  return c.json(rows[0]);
});

app.get('/api/users', async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const rows = await sql`SELECT id, nickname, avatar_url, level, total_points FROM users ORDER BY total_points DESC LIMIT 50`;
  return c.json(rows);
});

// ========== 视频相关 ==========
app.get('/api/videos', async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const rows = await sql`SELECT v.*, u.nickname, u.avatar_url FROM videos v JOIN users u ON v.user_id = u.id ORDER BY v.created_at DESC LIMIT 20`;
  return c.json(rows);
});

app.post('/api/videos', async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const body = await c.req.json();
  const { bvid, title, userId } = body;
  const rows = await sql`INSERT INTO videos (bvid, title, user_id) VALUES (${bvid}, ${title}, ${userId}) RETURNING *`;
  return c.json(rows[0], 201);
});

// ========== 帖子相关 ==========
app.get('/api/posts', async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const rows = await sql`SELECT p.*, u.nickname, u.avatar_url FROM posts p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC LIMIT 20`;
  return c.json(rows);
});

app.post('/api/posts', async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const body = await c.req.json();
  const { title, content, userId } = body;
  const rows = await sql`INSERT INTO posts (title, content, user_id) VALUES (${title}, ${content}, ${userId}) RETURNING *`;
  return c.json(rows[0], 201);
});

// ========== 签到相关 ==========
app.post('/api/checkin', async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const body = await c.req.json();
  const { userId } = body;
  const today = new Date().toISOString().split('T')[0];

  try {
    const rows = await sql`INSERT INTO check_ins (user_id, date) VALUES (${userId}, ${today}) RETURNING *`;
    // 加积分
    await sql`INSERT INTO point_logs (user_id, action, points) VALUES (${userId}, 'checkin', 10)`;
    await sql`UPDATE users SET total_points = total_points + 10 WHERE id = ${userId}`;
    return c.json({ success: true, message: '签到成功 +10 积分' });
  } catch (e) {
    return c.json({ error: '今日已签到' }, 400);
  }
});

app.get('/api/checkin/:userId', async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const userId = c.req.param('userId');
  const today = new Date().toISOString().split('T')[0];
  const rows = await sql`SELECT * FROM check_ins WHERE user_id = ${userId} AND date = ${today}`;
  return c.json({ checkedIn: rows.length > 0 });
});

// ========== 导航网站 ==========
app.get('/api/websites', async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const rows = await sql`SELECT w.*, u.nickname as submitter_name FROM websites w JOIN users u ON w.submitter_id = u.id ORDER BY w.created_at DESC`;
  return c.json(rows);
});

app.post('/api/websites', async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const body = await c.req.json();
  const { name, url, iconUrl, description, submitterId } = body;
  const rows = await sql`INSERT INTO websites (name, url, icon_url, description, submitter_id) VALUES (${name}, ${url}, ${iconUrl}, ${description}, ${submitterId}) RETURNING *`;
  return c.json(rows[0], 201);
});

// ========== 公共聊天消息 ==========
app.get('/api/messages', async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const rows = await sql`SELECT m.*, u.nickname, u.avatar_url FROM messages m JOIN users u ON m.user_id = u.id ORDER BY m.created_at DESC LIMIT 50`;
  return c.json(rows.reverse());
});

app.post('/api/messages', async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const body = await c.req.json();
  const { userId, content } = body;
  const rows = await sql`INSERT INTO messages (user_id, content) VALUES (${userId}, ${content}) RETURNING *`;
  return c.json(rows[0], 201);
});

// ========== 点赞 ==========
app.post('/api/videos/:id/like', async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const videoId = c.req.param('id');
  const { userId } = await c.req.json();
  try {
    await sql`INSERT INTO video_likes (user_id, video_id) VALUES (${userId}, ${videoId})`;
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: '已点赞' }, 400);
  }
});

app.post('/api/posts/:id/like', async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const postId = c.req.param('id');
  const { userId } = await c.req.json();
  try {
    await sql`INSERT INTO post_likes (user_id, post_id) VALUES (${userId}, ${postId})`;
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: '已点赞' }, 400);
  }
});

// ========== 关注 ==========
app.post('/api/follow', async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const { followerId, followingId } = await c.req.json();
  try {
    await sql`INSERT INTO follows (follower_id, following_id) VALUES (${followerId}, ${followingId})`;
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: '已关注' }, 400);
  }
});

// ========== 404 ==========
app.notFound((c) => {
  return c.json({ error: 'Not Found', path: c.req.path }, 404);
});

// ========== 错误处理 ==========
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: err.message || 'Internal Server Error' }, 500);
});

export default app;
