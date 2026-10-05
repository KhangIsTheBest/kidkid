import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'kidkid.db');
export const db = new Database(DB_PATH);

// Enable WAL mode for high performance
db.pragma('journal_mode = WAL');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
      phone TEXT,
      email TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      nickname TEXT,
      dob TEXT NOT NULL,
      gender TEXT CHECK(gender IN ('male', 'female', 'other')),
      evaluation_date TEXT,
      evaluator_name TEXT,
      diagnosis TEXT,
      parent_name TEXT,
      parent_phone TEXT,
      current_class TEXT,
      assigned_user_ids TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assessment_sessions (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      assessor_name TEXT,
      assessment_date TEXT NOT NULL,
      round_number INTEGER NOT NULL CHECK(round_number BETWEEN 1 AND 4),
      scores TEXT NOT NULL DEFAULT '{}',
      skill_rounds TEXT NOT NULL DEFAULT '{}',
      notes TEXT NOT NULL DEFAULT '{}',
      general_summary TEXT,
      strengths TEXT,
      challenges TEXT,
      iep_goals TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL,
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS student_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      student_id TEXT,
      request_type TEXT NOT NULL CHECK(request_type IN ('create', 'update', 'delete')),
      payload TEXT NOT NULL,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      admin_note TEXT,
      created_at TEXT NOT NULL,
      reviewed_at TEXT,
      reviewed_by TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(student_id) REFERENCES students(id)
    );
  `);

  // Ensure default Admin exists: Ngô Thị Thùy Linh (ngothithuylinh.vica / ngothithuylinh.vica@admin)
  const admin = db.prepare('SELECT * FROM users WHERE username = ?').get('ngothithuylinh.vica') as any;
  const adminPasswordHash = bcrypt.hashSync('ngothithuylinh.vica@admin', 10);

  if (!admin) {
    db.prepare(`
      INSERT INTO users (id, username, password_hash, full_name, role, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('user-admin', 'ngothithuylinh.vica', adminPasswordHash, 'Ngô Thị Thùy Linh', 'admin', 1, new Date().toISOString());
  } else {
    // Keep password sync
    db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(adminPasswordHash, 'ngothithuylinh.vica');
  }

  // Ensure sample teacher exists: giaovien1 / 123456
  const teacher = db.prepare('SELECT * FROM users WHERE username = ?').get('giaovien1') as any;
  if (!teacher) {
    const teacherPasswordHash = bcrypt.hashSync('123456', 10);
    db.prepare(`
      INSERT INTO users (id, username, password_hash, full_name, role, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('user-teacher-1', 'giaovien1', teacherPasswordHash, 'Nguyễn Thị Mai (Giáo viên)', 'user', 1, new Date().toISOString());
  }

  // Ensure sample student exists
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get('student-1') as any;
  if (!student) {
    db.prepare(`
      INSERT INTO students (id, full_name, nickname, dob, gender, evaluation_date, evaluator_name, diagnosis, parent_name, parent_phone, current_class, assigned_user_ids, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'student-1',
      'Hoàng Gia Bảo',
      'Rô',
      '2022-04-15',
      'male',
      '2026-03-01',
      'Cô Thùy Linh',
      'Rối loạn phổ tự kỷ (ASD)',
      'Hoàng Văn Hưng',
      '0912345678',
      'Lớp Chồi 1',
      JSON.stringify(['user-teacher-1', 'user-admin']),
      new Date().toISOString(),
      new Date().toISOString()
    );
  }
}
