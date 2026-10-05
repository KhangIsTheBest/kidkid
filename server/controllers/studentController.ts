import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { db } from '../db';
import { AuthRequest } from '../auth';

export const getStudents = (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' });

  const rows = db.prepare('SELECT * FROM students ORDER BY updated_at DESC').all() as any[];

  const formatted = rows.map(s => ({
    ...s,
    assignedUserIds: JSON.parse(s.assigned_user_ids || '[]')
  }));

  // Admin gets all students; normal user gets only assigned students
  if (user.role === 'admin') {
    return res.json(formatted);
  } else {
    const userStudents = formatted.filter(s => s.assignedUserIds.includes(user.id));
    return res.json(userStudents);
  }
};

export const getStudentById = (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' });

  const { id } = req.params;
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id) as any;
  if (!student) {
    return res.status(404).json({ error: 'Không tìm thấy học sinh' });
  }

  const assignedUserIds = JSON.parse(student.assigned_user_ids || '[]');
  if (user.role !== 'admin' && !assignedUserIds.includes(user.id)) {
    return res.status(403).json({ error: 'Bạn không có quyền truy cập hồ sơ học sinh này' });
  }

  // Get all assessment sessions for this student
  const sessions = db.prepare('SELECT * FROM assessment_sessions WHERE student_id = ? ORDER BY round_number ASC').all(id) as any[];
  const formattedSessions = sessions.map(sess => ({
    ...sess,
    scores: JSON.parse(sess.scores || '{}'),
    skillRounds: JSON.parse(sess.skill_rounds || '{}'),
    notes: JSON.parse(sess.notes || '{}'),
    iepGoals: JSON.parse(sess.iep_goals || '[]')
  }));

  return res.json({
    student: {
      ...student,
      assignedUserIds
    },
    sessions: formattedSessions
  });
};

export const createStudent = (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Chỉ Quản trị viên mới có quyền thêm học sinh trực tiếp' });
  }

  const {
    fullName,
    nickname,
    dob,
    gender,
    evaluationDate,
    evaluatorName,
    diagnosis,
    parentName,
    parentPhone,
    currentClass,
    assignedUserIds = []
  } = req.body;

  if (!fullName || !dob) {
    return res.status(400).json({ error: 'Vui lòng điền họ tên và ngày sinh của học sinh' });
  }

  const id = `student-${Date.now()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO students (
      id, full_name, nickname, dob, gender, evaluation_date, evaluator_name,
      diagnosis, parent_name, parent_phone, current_class, assigned_user_ids,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    fullName.trim(),
    nickname?.trim() || '',
    dob,
    gender || 'male',
    evaluationDate || now.split('T')[0],
    evaluatorName || 'Giáo viên can thiệp',
    diagnosis || '',
    parentName || '',
    parentPhone || '',
    currentClass || '',
    JSON.stringify(assignedUserIds),
    now,
    now
  );

  const created = db.prepare('SELECT * FROM students WHERE id = ?').get(id) as any;
  return res.status(201).json({
    ...created,
    assignedUserIds: JSON.parse(created.assigned_user_ids || '[]')
  });
};

export const updateStudent = (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Chỉ Quản trị viên mới có quyền chỉnh sửa học sinh trực tiếp' });
  }

  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(id) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Không tìm thấy học sinh' });
  }

  const {
    fullName = existing.full_name,
    nickname = existing.nickname,
    dob = existing.dob,
    gender = existing.gender,
    evaluationDate = existing.evaluation_date,
    evaluatorName = existing.evaluator_name,
    diagnosis = existing.diagnosis,
    parentName = existing.parent_name,
    parentPhone = existing.parent_phone,
    currentClass = existing.current_class,
    assignedUserIds
  } = req.body;

  const now = new Date().toISOString();
  const assignedIdsJson = assignedUserIds !== undefined
    ? JSON.stringify(assignedUserIds)
    : existing.assigned_user_ids;

  db.prepare(`
    UPDATE students SET
      full_name = ?, nickname = ?, dob = ?, gender = ?, evaluation_date = ?,
      evaluator_name = ?, diagnosis = ?, parent_name = ?, parent_phone = ?,
      current_class = ?, assigned_user_ids = ?, updated_at = ?
    WHERE id = ?
  `).run(
    fullName.trim(),
    nickname?.trim() || '',
    dob,
    gender,
    evaluationDate,
    evaluatorName,
    diagnosis,
    parentName,
    parentPhone,
    currentClass,
    assignedIdsJson,
    now,
    id
  );

  const updated = db.prepare('SELECT * FROM students WHERE id = ?').get(id) as any;
  return res.json({
    ...updated,
    assignedUserIds: JSON.parse(updated.assigned_user_ids || '[]')
  });
};

export const deleteStudent = (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Chỉ Quản trị viên mới có quyền xóa học sinh' });
  }

  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Không tìm thấy học sinh' });
  }

  db.prepare('DELETE FROM assessment_sessions WHERE student_id = ?').run(id);
  db.prepare('DELETE FROM student_requests WHERE student_id = ?').run(id);
  db.prepare('DELETE FROM students WHERE id = ?').run(id);

  return res.json({ success: true, message: 'Đã xóa học sinh thành công' });
};

export const saveSession = (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' });

  const { id } = req.params;
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id) as any;
  if (!student) {
    return res.status(404).json({ error: 'Không tìm thấy học sinh' });
  }

  const assignedUserIds = JSON.parse(student.assigned_user_ids || '[]');
  if (user.role !== 'admin' && !assignedUserIds.includes(user.id)) {
    return res.status(403).json({ error: 'Bạn không có quyền cập nhật đánh giá của học sinh này' });
  }

  const {
    sessionId,
    roundNumber,
    assessorName,
    assessmentDate,
    scores,
    skillRounds,
    notes,
    generalSummary,
    strengths,
    challenges,
    iepGoals
  } = req.body;

  const now = new Date().toISOString();
  const sid = sessionId || `session-${id}-r${roundNumber}-${Date.now()}`;

  const existing = db.prepare('SELECT * FROM assessment_sessions WHERE student_id = ? AND round_number = ?').get(id, roundNumber) as any;

  if (existing) {
    db.prepare(`
      UPDATE assessment_sessions SET
        assessor_name = ?, assessment_date = ?, scores = ?, skill_rounds = ?,
        notes = ?, general_summary = ?, strengths = ?, challenges = ?,
        iep_goals = ?, updated_at = ?
      WHERE id = ?
    `).run(
      assessorName || user.full_name,
      assessmentDate || now.split('T')[0],
      JSON.stringify(scores || {}),
      JSON.stringify(skillRounds || {}),
      JSON.stringify(notes || {}),
      generalSummary || '',
      strengths || '',
      challenges || '',
      JSON.stringify(iepGoals || []),
      now,
      existing.id
    );
  } else {
    db.prepare(`
      INSERT INTO assessment_sessions (
        id, student_id, assessor_name, assessment_date, round_number,
        scores, skill_rounds, notes, general_summary, strengths, challenges,
        iep_goals, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sid,
      id,
      assessorName || user.full_name,
      assessmentDate || now.split('T')[0],
      roundNumber,
      JSON.stringify(scores || {}),
      JSON.stringify(skillRounds || {}),
      JSON.stringify(notes || {}),
      generalSummary || '',
      strengths || '',
      challenges || '',
      JSON.stringify(iepGoals || []),
      now
    );
  }

  // Update student updated_at
  db.prepare('UPDATE students SET updated_at = ? WHERE id = ?').run(now, id);

  return res.json({ success: true, message: 'Đã lưu kết quả đánh giá thành công' });
};

function runPythonParser(filePath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(process.cwd(), 'scripts/import_excel_assessment.py');
    execFile('python', [scriptPath, filePath], { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(stderr || err.message));
      }
      try {
        const parsed = JSON.parse(stdout);
        if (parsed.error) {
          return reject(new Error(parsed.error));
        }
        resolve(parsed);
      } catch (parseErr: any) {
        reject(new Error(`Không thể phân tích dữ liệu từ Excel: ${stdout.slice(0, 300)}`));
      }
    });
  });
}

export const parseExcelAssessment = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' });

  const { fileBase64, fileName = 'upload.xlsm' } = req.body;
  if (!fileBase64) {
    return res.status(400).json({ error: 'Vui lòng tải lên file Excel (.xlsm hoặc .xlsx)' });
  }

  const tempDir = path.resolve(process.cwd(), 'data/temp_imports');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const cleanBase64 = fileBase64.replace(/^data:.*?;base64,/, '');
  const tempPath = path.join(tempDir, `import_${Date.now()}_${fileName}`);
  fs.writeFileSync(tempPath, Buffer.from(cleanBase64, 'base64'));

  try {
    const parsed = await runPythonParser(tempPath);

    // Attempt to match with existing students in DB
    const allStudents = db.prepare('SELECT id, full_name, nickname, dob, current_class, assigned_user_ids FROM students').all() as any[];

    let matchedStudent: any = null;
    if (parsed.student?.fullName) {
      const parsedNameNorm = parsed.student.fullName.trim().toLowerCase();
      matchedStudent = allStudents.find(s => {
        const sNameNorm = (s.full_name || '').trim().toLowerCase();
        return sNameNorm === parsedNameNorm;
      });
    }

    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }

    return res.json({
      success: true,
      parsed,
      matchedStudent: matchedStudent ? {
        ...matchedStudent,
        assignedUserIds: JSON.parse(matchedStudent.assigned_user_ids || '[]')
      } : null
    });
  } catch (err: any) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    return res.status(500).json({ error: 'Lỗi khi đọc file Excel', details: err.message });
  }
};

export const importExcelAssessment = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Chưa đăng nhập' });

  const {
    studentId: bodyStudentId,
    fileBase64,
    fileName = 'upload.xlsm',
    parsedData,
    createIfNotFound = false,
    roundsToImport = [1, 2, 3, 4]
  } = req.body;

  let assessmentData = parsedData;

  // If parsedData was not provided, parse the file directly
  if (!assessmentData) {
    if (!fileBase64) {
      return res.status(400).json({ error: 'Thiếu dữ liệu file đánh giá' });
    }
    const tempDir = path.resolve(process.cwd(), 'data/temp_imports');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const cleanBase64 = fileBase64.replace(/^data:.*?;base64,/, '');
    const tempPath = path.join(tempDir, `import_${Date.now()}_${fileName}`);
    fs.writeFileSync(tempPath, Buffer.from(cleanBase64, 'base64'));

    try {
      assessmentData = await runPythonParser(tempPath);
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch (err: any) {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      return res.status(500).json({ error: 'Không thể phân tích file Excel', details: err.message });
    }
  }

  let targetStudentId = bodyStudentId || req.params.id;

  // If no target student ID, check if matching student exists in DB or create new
  if (!targetStudentId || targetStudentId === 'auto') {
    const studentName = assessmentData.student?.fullName?.trim();
    if (studentName) {
      const existing = db.prepare('SELECT id FROM students WHERE LOWER(TRIM(full_name)) = LOWER(TRIM(?))').get(studentName) as any;
      if (existing) {
        targetStudentId = existing.id;
      }
    }

    if (!targetStudentId || targetStudentId === 'auto') {
      if (!createIfNotFound) {
        return res.status(400).json({ error: 'Không tìm thấy học sinh phù hợp để đồng bộ. Vui lòng chọn học sinh hoặc cho phép tạo mới.' });
      }

      // Create new student
      targetStudentId = `student-${Date.now()}`;
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO students (
          id, full_name, nickname, dob, gender, evaluation_date, evaluator_name,
          diagnosis, parent_name, parent_phone, current_class, assigned_user_ids,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        targetStudentId,
        assessmentData.student?.fullName || 'Học sinh mới từ Excel',
        assessmentData.student?.nickname || '',
        assessmentData.student?.dob || '2022-01-01',
        'male',
        now.split('T')[0],
        user.full_name,
        '',
        '',
        '',
        '',
        JSON.stringify([user.id]),
        now,
        now
      );
    }
  }

  // Verify student exists and user has permission
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(targetStudentId) as any;
  if (!student) {
    return res.status(404).json({ error: 'Không tìm thấy học sinh mục tiêu' });
  }

  const assignedUserIds = JSON.parse(student.assigned_user_ids || '[]');
  if (user.role !== 'admin' && !assignedUserIds.includes(user.id)) {
    return res.status(403).json({ error: 'Bạn không có quyền cập nhật đánh giá của học sinh này' });
  }

  // Import assessment rounds
  const rounds = assessmentData.rounds || [];
  let importedCount = 0;
  let totalSkillsUpdated = 0;
  const now = new Date().toISOString();

  for (const r of rounds) {
    if (!roundsToImport.includes(r.roundNumber)) continue;

    const existingSession = db.prepare(
      'SELECT id, scores, skill_rounds, notes, iep_goals FROM assessment_sessions WHERE student_id = ? AND round_number = ?'
    ).get(targetStudentId, r.roundNumber) as any;

    const sessionScores = r.scores || {};
    const sessionSkillRounds = r.skillRounds || {};
    const sessionNotes = r.notes || {};

    totalSkillsUpdated += Object.keys(sessionScores).length;

    if (existingSession) {
      const existingNotes = JSON.parse(existingSession.notes || '{}');

      db.prepare(`
        UPDATE assessment_sessions SET
          assessor_name = ?, assessment_date = ?, scores = ?, skill_rounds = ?,
          notes = ?, updated_at = ?
        WHERE id = ?
      `).run(
        r.assessorName || user.full_name,
        r.assessmentDate || now.split('T')[0],
        JSON.stringify(sessionScores),
        JSON.stringify(sessionSkillRounds),
        JSON.stringify({ ...existingNotes, ...sessionNotes }),
        now,
        existingSession.id
      );
    } else {
      const newSid = `session-${targetStudentId}-r${r.roundNumber}-${Date.now()}`;
      db.prepare(`
        INSERT INTO assessment_sessions (
          id, student_id, assessor_name, assessment_date, round_number,
          scores, skill_rounds, notes, general_summary, strengths, challenges,
          iep_goals, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newSid,
        targetStudentId,
        r.assessorName || user.full_name,
        r.assessmentDate || now.split('T')[0],
        r.roundNumber,
        JSON.stringify(sessionScores),
        JSON.stringify(sessionSkillRounds),
        JSON.stringify(sessionNotes),
        '',
        '',
        '',
        '[]',
        now
      );
    }
    importedCount++;
  }

  // Update student updated_at
  db.prepare('UPDATE students SET updated_at = ? WHERE id = ?').run(now, targetStudentId);

  return res.json({
    success: true,
    message: `Đã đồng bộ thành công ${importedCount} đợt đánh giá (${totalSkillsUpdated} kỹ năng) từ file Excel!`,
    studentId: targetStudentId,
    studentName: student.full_name,
    importedRoundsCount: importedCount,
    totalSkillsUpdated
  });
};
