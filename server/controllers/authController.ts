import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { generateToken, AuthRequest } from '../auth';

export const login = (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim()) as any;
  if (!user || !user.is_active) {
    return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
  }

  const token = generateToken({
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    role: user.role
  });

  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      phone: user.phone,
      email: user.email
    }
  });
};

export const getCurrentUser = (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Chưa đăng nhập' });
  }

  const user = db.prepare('SELECT id, username, full_name, role, phone, email, is_active, created_at FROM users WHERE id = ?').get(req.user.id) as any;
  if (!user) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng' });
  }

  // Get assigned students
  const allStudents = db.prepare('SELECT id, full_name, nickname, assigned_user_ids FROM students').all() as any[];
  const assignedStudents = allStudents.filter(s => {
    try {
      const ids = JSON.parse(s.assigned_user_ids || '[]');
      return ids.includes(user.id);
    } catch {
      return false;
    }
  });

  // Get user's requests count
  const requests = db.prepare('SELECT id, status FROM student_requests WHERE user_id = ?').all(user.id) as any[];

  return res.json({
    user,
    assignedStudentsCount: user.role === 'admin' ? allStudents.length : assignedStudents.length,
    assignedStudents,
    requestsCount: requests.length,
    pendingRequestsCount: requests.filter(r => r.status === 'pending').length
  });
};

export const changePassword = (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Chưa đăng nhập' });
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
  }

  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id) as any;
  if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(400).json({ error: 'Mật khẩu hiện tại không chính xác' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);

  return res.json({ success: true, message: 'Đổi mật khẩu thành công' });
};
