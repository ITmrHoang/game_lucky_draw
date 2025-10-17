import Database from 'better-sqlite3';

// Lấy đường dẫn file DB từ biến môi trường
const dbPath = process.env.DATABASE_PATH || './workspace/dev.db';

// Tạo một instance duy nhất (singleton) của database
export const db = new Database(dbPath);

console.log(`Database connected at ${dbPath}`);

// Schema cơ bản cho hệ thống quay số
db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    background_url TEXT,
    only_one_win_per_person INTEGER DEFAULT 1, -- 1: một người chỉ trúng 1 lần trong kỳ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS people (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    phone TEXT
  );

  CREATE TABLE IF NOT EXISTS codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    used INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS prizes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    image_url TEXT,
    winners_quota INTEGER NOT NULL DEFAULT 1,
    random_mode INTEGER DEFAULT 1, -- 1: random, 0: theo preset
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Người trúng được cài đặt trước cho một giải
  CREATE TABLE IF NOT EXISTS prize_preset_winners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prize_id INTEGER NOT NULL REFERENCES prizes(id) ON DELETE CASCADE,
    code_id INTEGER NOT NULL REFERENCES codes(id) ON DELETE CASCADE,
    UNIQUE(prize_id, code_id)
  );

  CREATE TABLE IF NOT EXISTS winners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    prize_id INTEGER NOT NULL REFERENCES prizes(id) ON DELETE CASCADE,
    code_id INTEGER NOT NULL REFERENCES codes(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(prize_id, code_id)
  );
`);

// Seed tối thiểu một campaign và prize nếu trống để tiện dev nhanh
const hasCampaign = db.prepare('SELECT 1 FROM campaigns LIMIT 1').get();
if (!hasCampaign) {
  const insertCampaign = db.prepare('INSERT INTO campaigns (name) VALUES (?)');
  const info = insertCampaign.run('Kỳ quay mặc định');
  const campaignId = Number(info.lastInsertRowid);

  // Tạo vài người + code mẫu
  const insertPerson = db.prepare('INSERT INTO people (full_name, phone) VALUES (?, ?)');
  const insertCode = db.prepare('INSERT INTO codes (campaign_id, person_id, code) VALUES (?, ?, ?)');
  for (let i = 1; i <= 20; i++) {
    const person = insertPerson.run(`Người ${i}`, `0900000${String(100 + i)}`);
    const personId = Number(person.lastInsertRowid);
    insertCode.run(campaignId, personId, `CODE-${1000 + i}`);
  }

  db.prepare('INSERT INTO prizes (campaign_id, name, winners_quota, random_mode) VALUES (?, ?, ?, ?)')
    .run(campaignId, 'Giải Nhất', 1, 1);
  db.prepare('INSERT INTO prizes (campaign_id, name, winners_quota, random_mode) VALUES (?, ?, ?, ?)')
    .run(campaignId, 'Giải Khuyến Khích', 3, 1);
}