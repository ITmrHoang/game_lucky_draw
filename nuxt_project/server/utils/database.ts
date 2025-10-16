import Database from 'better-sqlite3';

// Lấy đường dẫn file DB từ biến môi trường
const dbPath = process.env.DATABASE_PATH || './workspace/dev.db';

// Tạo một instance duy nhất (singleton) của database
export const db = new Database(dbPath);

console.log(`Database connected at ${dbPath}`);

// Tạo bảng 'tasks' nếu nó chưa tồn tại
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);