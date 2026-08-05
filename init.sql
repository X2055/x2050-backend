-- X2050 Community Database Schema
-- 在 Neon SQL Editor 里直接粘贴执行即可

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500) DEFAULT 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
    bio TEXT DEFAULT '',
    level INTEGER DEFAULT 1,
    level_locked BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    banned BOOLEAN DEFAULT FALSE,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS point_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    points INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_point_logs_user_id ON point_logs(user_id);

CREATE TABLE IF NOT EXISTS check_ins (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON check_ins(user_id);

CREATE TABLE IF NOT EXISTS videos (
    id SERIAL PRIMARY KEY,
    bvid VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(500),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);

CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);

CREATE TABLE IF NOT EXISTS video_comments (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_video_comments_video_id ON video_comments(video_id);

CREATE TABLE IF NOT EXISTS post_comments (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);

CREATE TABLE IF NOT EXISTS video_likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, video_id)
);
CREATE INDEX IF NOT EXISTS idx_video_likes_video_id ON video_likes(video_id);

CREATE TABLE IF NOT EXISTS post_likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);

CREATE TABLE IF NOT EXISTS follows (
    id SERIAL PRIMARY KEY,
    follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

CREATE TABLE IF NOT EXISTS websites (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    icon_url VARCHAR(500) NOT NULL,
    description TEXT,
    submitter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_websites_submitter_id ON websites(submitter_id);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    from_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    to_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_to_user_id_read ON notifications(to_user_id, read);

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    reporter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(50) NOT NULL,
    target_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 默认管理员账号 (密码: admin123, 请上线后修改)
-- 密码哈希对应 bcrypt hash, 你需要用真实哈希替换
INSERT INTO users (email, password_hash, nickname, is_admin, level, total_points)
VALUES ('admin@x2050.top', '$2b$10$YourBcryptHashHere', '管理员', TRUE, 99, 9999)
ON CONFLICT (email) DO NOTHING;
