import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'kidkid-ablls-r-secret-key-2026';

export interface AuthUser {
  id: string;
  username: string;
  full_name: string;
  role: 'admin' | 'user';
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, username: user.username, full_name: user.full_name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    // Verify user is still active in database
    const dbUser = db.prepare('SELECT id, username, full_name, role, is_active FROM users WHERE id = ?').get(decoded.id) as any;
    if (!dbUser || !dbUser.is_active) {
      res.status(403).json({ error: 'Tài khoản không tồn tại hoặc đã bị vô hiệu hóa' });
      return;
    }

    req.user = {
      id: dbUser.id,
      username: dbUser.username,
      full_name: dbUser.full_name,
      role: dbUser.role
    };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Chỉ Quản trị viên (Admin) mới có quyền thực hiện thao tác này' });
      return;
    }
    next();
  });
}
