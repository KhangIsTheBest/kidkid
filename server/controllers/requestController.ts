import { Response } from 'express';
import { db } from '../db';
import { AuthRequest } from '../auth';

export const getRequests = (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' });

  let query = `
    SELECT
      r.*,
      u.full_name as user_full_name,
      u.username as user_username,
      s.full_name as student_full_name,
      s.nickname as student_nickname
    FROM student_requests r
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN students s ON r.student_id = s.id
  `;

  let rows: any[] = [];
  if (user.role === 'admin') {
    query += " ORDER BY CASE WHEN r.status = 'pending' THEN 0 ELSE 1 END, r.created_at DESC";
    rows = db.prepare(query).all();
  } else {
    query += ' WHERE r.user_id = ? ORDER BY r.created_at DESC';
    rows = db.prepare(query).all(user.id);
  }

  const formatted = rows.map(r => ({
    ...r,
    payload: JSON.parse(r.payload || '{}')
  }));

  return res.json(formatted);
};

export const createRequest = (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' });

  const { studentId, requestType, payload, reason } = req.body;

  if (!requestType || !['create', 'update', 'delete'].includes(requestType)) {
    return res.status(400).json({ error: 'Loại yêu cầu không hợp lệ' });
  }

  if (requestType !== 'create' && !studentId) {
    return res.status(400).json({ error: 'Thiếu mã học sinh cho yêu cầu sửa hoặc xóa' });
  }

  const id = `req-${Date.now()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO student_requests (
      id, user_id, student_id, request_type, payload, reason, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(
    id,
    user.id,
    studentId || null,
    requestType,
    JSON.stringify(payload || {}),
    reason || '',
    now
  );

  return res.status(201).json({
    id,
    message: 'Yêu cầu của bạn đã được gửi thành công đến Quản trị viên và đang chờ phê duyệt'
  });
};

export const approveRequest = (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Chỉ Quản trị viên mới có quyền duyệt yêu cầu' });
  }

  const { id } = req.params;
  const { adminNote } = req.body;

  const request = db.prepare('SELECT * FROM student_requests WHERE id = ?').get(id) as any;
  if (!request) {
    return res.status(404).json({ error: 'Không tìm thấy yêu cầu' });
  }

  if (request.status !== 'pending') {
    return res.status(400).json({ error: 'Yêu cầu này đã được xử lý trước đó' });
  }

  const payload = JSON.parse(request.payload || '{}');
  const now = new Date().toISOString();

  // Execute request action
  if (request.request_type === 'create') {
    const newStudentId = `student-${Date.now()}`;
    db.prepare(`
      INSERT INTO students (
        id, full_name, nickname, dob, gender, evaluation_date, evaluator_name,
        diagnosis, parent_name, parent_phone, current_class, assigned_user_ids,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newStudentId,
      payload.fullName || 'Học sinh mới',
      payload.nickname || '',
      payload.dob || '2022-01-01',
      payload.gender || 'male',
      payload.evaluationDate || now.split('T')[0],
      payload.evaluatorName || 'Giáo viên can thiệp',
      payload.diagnosis || '',
      payload.parentName || '',
      payload.parentPhone || '',
      payload.currentClass || '',
      JSON.stringify([request.user_id]),
      now,
      now
    );
  } else if (request.request_type === 'update') {
    const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(request.student_id) as any;
    if (existing) {
      db.prepare(`
        UPDATE students SET
          full_name = ?, nickname = ?, dob = ?, gender = ?, evaluation_date = ?,
          evaluator_name = ?, diagnosis = ?, parent_name = ?, parent_phone = ?,
          current_class = ?, updated_at = ?
        WHERE id = ?
      `).run(
        payload.fullName ?? existing.full_name,
        payload.nickname ?? existing.nickname,
        payload.dob ?? existing.dob,
        payload.gender ?? existing.gender,
        payload.evaluationDate ?? existing.evaluation_date,
        payload.evaluatorName ?? existing.evaluator_name,
        payload.diagnosis ?? existing.diagnosis,
        payload.parentName ?? existing.parent_name,
        payload.parentPhone ?? existing.parent_phone,
        payload.currentClass ?? existing.current_class,
        now,
        request.student_id
      );
    }
  } else if (request.request_type === 'delete') {
    db.prepare('DELETE FROM assessment_sessions WHERE student_id = ?').run(request.student_id);
    db.prepare('DELETE FROM students WHERE id = ?').run(request.student_id);
  }

  // Update request status
  db.prepare(`
    UPDATE student_requests SET
      status = 'approved', admin_note = ?, reviewed_at = ?, reviewed_by = ?
    WHERE id = ?
  `).run(adminNote || '', now, req.user.id, id);

  return res.json({ success: true, message: 'Đã phê duyệt yêu cầu thành công' });
};

export const rejectRequest = (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Chỉ Quản trị viên mới có quyền từ chối yêu cầu' });
  }

  const { id } = req.params;
  const { adminNote } = req.body;

  const request = db.prepare('SELECT * FROM student_requests WHERE id = ?').get(id) as any;
  if (!request) {
    return res.status(404).json({ error: 'Không tìm thấy yêu cầu' });
  }

  if (request.status !== 'pending') {
    return res.status(400).json({ error: 'Yêu cầu này đã được xử lý trước đó' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE student_requests SET
      status = 'rejected', admin_note = ?, reviewed_at = ?, reviewed_by = ?
    WHERE id = ?
  `).run(adminNote || 'Không phê duyệt', now, req.user.id, id);

  return res.json({ success: true, message: 'Đã từ chối yêu cầu' });
};
