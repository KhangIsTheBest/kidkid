import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { AuthRequest } from '../auth';

export const getUsers = (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Chỉ Quản trị viên mới có quyền xem danh sách người dùng' });
  }

  const users = db.prepare('SELECT id, username, full_name, role, phone, email, is_active, created_at FROM users ORDER BY created_at DESC').all() as any[];
  const allStudents = db.prepare('SELECT id, full_name, nickname, assigned_user_ids FROM students').all() as any[];

  const usersWithStudents = users.map(u => {
    const assigned = allStudents.filter(s => {
      try {
        const ids = JSON.parse(s.assigned_user_ids || '[]');
        return ids.includes(u.id);
      } catch {
        return false;
      }
    });

    return {
      ...u,
      assignedStudentsCount: assigned.length,
      assignedStudents: assigned.map(s => ({ id: s.id, fullName: s.full_name, nickname: s.nickname }))
    };
  });

  return res.json(usersWithStudents);
};

export const createUser = (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Chỉ Quản trị viên mới có quyền tạo tài khoản người dùng' });
  }

  const { username, password, fullName, role = 'user', phone, email, assignedStudentIds = [] } = req.body;

  if (!username || !password || !fullName) {
    return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập, mật khẩu và họ tên' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim());
  if (existing) {
    return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại, vui lòng chọn tên khác' });
  }

  const id = `user-${Date.now()}`;
  const passwordHash = bcrypt.hashSync(password, 10);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, username, password_hash, full_name, role, phone, email, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(id, username.trim(), passwordHash, fullName.trim(), role, phone || '', email || '', now);

  // Assign students to this user
  if (Array.isArray(assignedStudentIds) && assignedStudentIds.length > 0) {
    for (const stId of assignedStudentIds) {
      const student = db.prepare('SELECT assigned_user_ids FROM students WHERE id = ?').get(stId) as any;
      if (student) {
        try {
          const ids: string[] = JSON.parse(student.assigned_user_ids || '[]');
          if (!ids.includes(id)) {
            ids.push(id);
            db.prepare('UPDATE students SET assigned_user_ids = ? WHERE id = ?').run(JSON.stringify(ids), stId);
          }
        } catch {
          // ignore
        }
      }
    }
  }

  return res.status(201).json({
    id,
    username: username.trim(),
    fullName: fullName.trim(),
    role,
    phone,
    email,
    isActive: 1,
    createdAt: now
  });
};

export const updateUser = (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Chỉ Quản trị viên mới có quyền cập nhật tài khoản' });
  }

  const { id } = req.params;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  if (!user) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng' });
  }

  const { fullName = user.full_name, phone = user.phone, email = user.email, role = user.role, isActive = user.is_active, password, assignedStudentIds } = req.body;

  let query = 'UPDATE users SET full_name = ?, phone = ?, email = ?, role = ?, is_active = ?';
  const params: any[] = [fullName.trim(), phone, email, role, isActive ? 1 : 0];

  if (password && password.trim().length >= 6) {
    query += ', password_hash = ?';
    params.push(bcrypt.hashSync(password.trim(), 10));
  }

  query += ' WHERE id = ?';
  params.push(id);

  db.prepare(query).run(...params);

  // If assignedStudentIds provided, sync student assignments
  if (Array.isArray(assignedStudentIds)) {
    const allStudents = db.prepare('SELECT id, assigned_user_ids FROM students').all() as any[];
    for (const st of allStudents) {
      try {
        let ids: string[] = JSON.parse(st.assigned_user_ids || '[]');
        const shouldHave = assignedStudentIds.includes(st.id);
        const alreadyHas = ids.includes(id);

        if (shouldHave && !alreadyHas) {
          ids.push(id);
          db.prepare('UPDATE students SET assigned_user_ids = ? WHERE id = ?').run(JSON.stringify(ids), st.id);
        } else if (!shouldHave && alreadyHas) {
          ids = ids.filter(i => i !== id);
          db.prepare('UPDATE students SET assigned_user_ids = ? WHERE id = ?').run(JSON.stringify(ids), st.id);
        }
      } catch {
        // ignore
      }
    }
  }

  return res.json({ success: true, message: 'Đã cập nhật tài khoản thành công' });
};

export const deleteUser = (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Chỉ Quản trị viên mới có quyền xóa tài khoản' });
  }

  const { id } = req.params;
  if (id === req.user.id) {
    return res.status(400).json({ error: 'Không thể xóa chính tài khoản bạn đang đăng nhập' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id);

  // Remove from student assignments
  const allStudents = db.prepare('SELECT id, assigned_user_ids FROM students').all() as any[];
  for (const st of allStudents) {
    try {
      let ids: string[] = JSON.parse(st.assigned_user_ids || '[]');
      if (ids.includes(id)) {
        ids = ids.filter(i => i !== id);
        db.prepare('UPDATE students SET assigned_user_ids = ? WHERE id = ?').run(JSON.stringify(ids), st.id);
      }
    } catch {
      // ignore
    }
  }

  return res.json({ success: true, message: 'Đã xóa tài khoản thành công' });
};
