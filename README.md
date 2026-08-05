# X2050 Backend - Cloudflare Workers + Neon

## 部署步骤

### 1. 准备 Neon 数据库连接串
去 Neon 控制台 → 你的项目 → Connection Details → 复制 **Pooled connection string**

格式类似：
```
postgresql://neondb_owner:密码@ep-xxx-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 2. 安装依赖
```bash
npm install
```

### 3. 设置数据库连接（Cloudflare Secret）
```bash
echo "你的Neon连接串" | npx wrangler secret put DATABASE_URL
```

### 4. 在 Neon 里建表
去 Neon 控制台 → SQL Editor → 粘贴 `sql/init.sql` 的全部内容 → Run

### 5. 本地测试
```bash
npm run dev
# 访问 http://localhost:8787/api/health
```

### 6. 部署到 Cloudflare
```bash
npm run deploy
```

部署成功后会输出一个地址，类似：
```
https://x2050-backend.你的用户名.workers.dev
```

### 7. 绑定自定义域名
在 Cloudflare 控制台 → Workers & Pages → x2050-backend → Settings → Domains & Routes
添加：`api.x2050.top`

## API 接口列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/health | 健康检查 |
| GET | /api/users | 用户排行榜 |
| GET | /api/users/:id | 用户详情 |
| GET | /api/videos | 视频列表 |
| POST | /api/videos | 提交视频 |
| GET | /api/posts | 帖子列表 |
| POST | /api/posts | 发帖 |
| POST | /api/checkin | 签到 |
| GET | /api/checkin/:userId | 检查今日签到 |
| GET | /api/websites | 导航网站列表 |
| POST | /api/websites | 提交网站 |
| GET | /api/messages | 聊天消息 |
| POST | /api/messages | 发消息 |
| POST | /api/videos/:id/like | 点赞视频 |
| POST | /api/posts/:id/like | 点赞帖子 |
| POST | /api/follow | 关注用户 |
