import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { db } from '../db';
import { AuthRequest } from '../auth';
import abllsRawData from '../../data/ablls_master_dataset.json';

const TEMP_DIR = path.resolve(process.cwd(), 'temp_reports');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

export const exportDocxReport = async (req: AuthRequest, res: Response) => {
  const { studentId } = req.params;
  const roundNumber = parseInt(req.query.round as string) || 1;

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  if (!student) {
    return res.status(404).json({ error: 'Không tìm thấy học sinh' });
  }

  const session = db.prepare('SELECT * FROM assessment_sessions WHERE student_id = ? AND round_number = ?').get(studentId, roundNumber) as any;
  const parsedScores = session ? JSON.parse(session.scores || '{}') : {};
  const parsedSkillRounds = session ? JSON.parse(session.skill_rounds || '{}') : {};
  const parsedNotes = session ? JSON.parse(session.notes || '{}') : {};
  const parsedIepGoals = session ? JSON.parse(session.iep_goals || '[]') : [];

  // Calculate repertoire stats
  const repertoires = (abllsRawData as any).repertoires.map((rep: any) => {
    const repSkills = (abllsRawData as any).skills.filter((s: any) => s.repertoire_code === rep.code);
    const earned = repSkills.reduce((sum: number, s: any) => sum + (parsedScores[s.code] || 0), 0);
    const percentage = rep.total_points > 0 ? Math.round((earned / rep.total_points) * 100) : 0;
    
    // Norm benchmark
    let normBenchmark = 0;
    const normEntry = (abllsRawData as any).norms[rep.code];
    if (normEntry && normEntry.values && normEntry.values.length > 10) {
      normBenchmark = Math.round(normEntry.values[10] * 100);
    }

    return {
      code: rep.code,
      name: rep.name,
      name_en: rep.name_en,
      earned,
      total: rep.total_points,
      percentage,
      normBenchmark
    };
  });

  const totalEarned = repertoires.reduce((sum: number, r: any) => sum + r.earned, 0);
  const totalMax = repertoires.reduce((sum: number, r: any) => sum + r.total, 0);
  const scoredSkillsCount = Object.keys(parsedScores).filter(k => parsedScores[k] > 0).length;

  const timestamp = Date.now();
  const inputJsonPath = path.join(TEMP_DIR, `data_docx_${studentId}_${timestamp}.json`);
  const outputDocxPath = path.join(TEMP_DIR, `BaoCao_ABLLS_${student.nickname || student.full_name}_${timestamp}.docx`);

  const payload = {
    student,
    session: {
      assessment_date: session?.assessment_date || student.evaluation_date,
      assessor_name: session?.assessor_name || student.evaluator_name,
      round_number: roundNumber,
      general_summary: session?.general_summary || '',
      strengths: session?.strengths || '',
      iep_goals: parsedIepGoals
    },
    age_str: `${student.dob} (46 tháng)`,
    stats: {
      totalEarned,
      totalMax,
      totalPercent: totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0,
      scoredSkillsCount
    },
    repertoires
  };

  fs.writeFileSync(inputJsonPath, JSON.stringify(payload, null, 2), 'utf-8');

  const scriptPath = path.resolve(process.cwd(), 'scripts', 'generate_docx_report.py');

  execFile('python', [scriptPath, inputJsonPath, outputDocxPath], (err, stdout, stderr) => {
    // Clean up input json
    if (fs.existsSync(inputJsonPath)) fs.unlinkSync(inputJsonPath);

    if (err) {
      console.error('Error generating docx report:', stderr || err.message);
      return res.status(500).json({ error: 'Không thể tạo file báo cáo Word', details: stderr || err.message });
    }

    if (!fs.existsSync(outputDocxPath)) {
      return res.status(500).json({ error: 'File báo cáo không được tạo thành công' });
    }

    const safeFilename = encodeURIComponent(`BaoCao_ABLLS_${student.nickname || 'HocSinh'}_Dot${roundNumber}.docx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);

    const fileStream = fs.createReadStream(outputDocxPath);
    fileStream.pipe(res);
    fileStream.on('end', () => {
      setTimeout(() => {
        if (fs.existsSync(outputDocxPath)) fs.unlinkSync(outputDocxPath);
      }, 5000);
    });
  });
};

export const exportXlsmReport = async (req: AuthRequest, res: Response) => {
  const { studentId } = req.params;

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  if (!student) {
    return res.status(404).json({ error: 'Không tìm thấy học sinh' });
  }

  const sessions = db.prepare('SELECT * FROM assessment_sessions WHERE student_id = ? ORDER BY round_number ASC').all(studentId) as any[];
  const formattedSessions = sessions.map(sess => ({
    round_number: sess.round_number,
    assessor_name: sess.assessor_name,
    assessment_date: sess.assessment_date,
    scores: JSON.parse(sess.scores || '{}'),
    skill_rounds: JSON.parse(sess.skill_rounds || '{}')
  }));

  const timestamp = Date.now();
  const inputJsonPath = path.join(TEMP_DIR, `data_xlsm_${studentId}_${timestamp}.json`);
  const outputXlsmPath = path.join(TEMP_DIR, `ABLLS_DanhGia_${student.nickname || student.full_name}_${timestamp}.xlsm`);

  const payload = {
    student,
    sessions: formattedSessions,
    skills: (abllsRawData as any).skills
  };

  fs.writeFileSync(inputJsonPath, JSON.stringify(payload, null, 2), 'utf-8');

  const scriptPath = path.resolve(process.cwd(), 'scripts', 'generate_xlsm_report.py');

  execFile('python', [scriptPath, inputJsonPath, outputXlsmPath], (err, stdout, stderr) => {
    // Clean up input json
    if (fs.existsSync(inputJsonPath)) fs.unlinkSync(inputJsonPath);

    if (err) {
      console.error('Error generating xlsm report:', stderr || err.message);
      return res.status(500).json({ error: 'Không thể tạo file báo cáo Excel', details: stderr || err.message });
    }

    if (!fs.existsSync(outputXlsmPath)) {
      return res.status(500).json({ error: 'File Excel không được tạo thành công' });
    }

    const safeFilename = encodeURIComponent(`ABLLS_DanhGia_${student.nickname || 'HocSinh'}.xlsm`);
    res.setHeader('Content-Type', 'application/vnd.ms-excel.sheet.macroEnabled.12');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);

    const fileStream = fs.createReadStream(outputXlsmPath);
    fileStream.pipe(res);
    fileStream.on('end', () => {
      setTimeout(() => {
        if (fs.existsSync(outputXlsmPath)) fs.unlinkSync(outputXlsmPath);
      }, 5000);
    });
  });
};
