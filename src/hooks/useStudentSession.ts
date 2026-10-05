import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { Student, AssessmentSession } from '../types/assessment';
import { updateSkillScore, saveSession as saveLocalSession } from '../utils/storage';

export function useStudentSession(studentId?: string) {
  const [student, setStudent] = useState<Student | null>(null);
  const [sessions, setSessions] = useState<AssessmentSession[]>([]);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [currentSession, setCurrentSession] = useState<AssessmentSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce backend save timer
  const saveTimeoutRef = useRef<any>(null);

  const fetchStudentAndSessions = useCallback(async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ student: any; sessions: any[] }>(`/students/${studentId}`);
      
      const st: Student = {
        id: res.student.id,
        fullName: res.student.full_name || res.student.fullName,
        nickname: res.student.nickname || '',
        dob: res.student.dob,
        gender: res.student.gender,
        diagnosis: res.student.diagnosis,
        currentClass: res.student.current_class || res.student.currentClass,
        evaluationDate: res.student.evaluation_date || res.student.evaluationDate,
        evaluatorName: res.student.evaluator_name || res.student.evaluatorName,
        parentName: res.student.parent_name || res.student.parentName,
        parentPhone: res.student.parent_phone || res.student.parentPhone,
        assignedUserIds: res.student.assignedUserIds || [],
        createdAt: res.student.created_at || res.student.createdAt
      };
      setStudent(st);

      const sessList: AssessmentSession[] = (res.sessions || []).map(s => ({
        id: s.id,
        studentId: s.student_id,
        assessorName: s.assessor_name,
        assessmentDate: s.assessment_date,
        roundNumber: s.round_number,
        scores: s.scores || {},
        skillRounds: s.skillRounds || s.skill_rounds || {},
        notes: s.notes || {},
        generalSummary: s.general_summary || '',
        strengths: s.strengths || '',
        challenges: s.challenges || '',
        iepGoals: s.iepGoals || s.iep_goals || [],
        updatedAt: s.updated_at
      }));
      setSessions(sessList);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Không thể tải dữ liệu học sinh');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchStudentAndSessions();
  }, [fetchStudentAndSessions]);

  // Compute or initialize session for current round whenever sessions or currentRound change
  useEffect(() => {
    if (!student) return;

    let sess = sessions.find(s => s.roundNumber === currentRound);
    // Find latest existing session for inheriting baseline cumulative scores
    const latestExisting = sessions[sessions.length - 1];

    if (!sess) {
      sess = {
        id: `session-${student.id}-r${currentRound}-${Date.now()}`,
        studentId: student.id,
        assessorName: latestExisting?.assessorName || 'Giáo viên can thiệp',
        assessmentDate: new Date().toISOString().split('T')[0],
        roundNumber: currentRound,
        scores: latestExisting ? { ...latestExisting.scores } : {},
        skillRounds: latestExisting ? { ...(latestExisting.skillRounds || {}) } : {},
        notes: latestExisting ? { ...latestExisting.notes } : {},
        generalSummary: latestExisting?.generalSummary || '',
        strengths: latestExisting?.strengths || '',
        challenges: latestExisting?.challenges || '',
        iepGoals: latestExisting ? [...latestExisting.iepGoals] : [],
        updatedAt: new Date().toISOString()
      };
    }

    setCurrentSession(sess);
  }, [student, sessions, currentRound]);

  // Async function to push session to backend API
  const persistSession = useCallback((sess: AssessmentSession) => {
    if (!studentId) return;
    saveLocalSession(sess); // also update localStorage fallback

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaving(true);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.post(`/students/${studentId}/sessions`, {
          sessionId: sess.id,
          roundNumber: sess.roundNumber,
          assessorName: sess.assessorName,
          assessmentDate: sess.assessmentDate,
          scores: sess.scores,
          skillRounds: sess.skillRounds,
          notes: sess.notes,
          generalSummary: sess.generalSummary,
          strengths: sess.strengths,
          challenges: sess.challenges,
          iepGoals: sess.iepGoals
        });
      } catch (err) {
        console.error('Error saving session:', err);
      } finally {
        setSaving(false);
      }
    }, 400); // 400ms debounce
  }, [studentId]);

  const handleUpdateScore = useCallback((skillCode: string, score: number) => {
    if (!currentSession) return;
    const { scores, skillRounds } = updateSkillScore(
      currentSession.scores,
      currentSession.skillRounds,
      skillCode,
      score,
      currentRound
    );

    const updated: AssessmentSession = {
      ...currentSession,
      scores,
      skillRounds,
      updatedAt: new Date().toISOString()
    };

    setCurrentSession(updated);
    setSessions(prev => {
      const idx = prev.findIndex(s => s.roundNumber === currentRound);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [...prev, updated];
    });

    persistSession(updated);
  }, [currentSession, currentRound, persistSession]);

  const handleUpdateNote = useCallback((skillCode: string, note: string) => {
    if (!currentSession) return;
    const updated: AssessmentSession = {
      ...currentSession,
      notes: {
        ...currentSession.notes,
        [skillCode]: note
      },
      updatedAt: new Date().toISOString()
    };

    setCurrentSession(updated);
    persistSession(updated);
  }, [currentSession, persistSession]);

  const handleUpdateSession = useCallback((updatedSession: AssessmentSession) => {
    setCurrentSession(updatedSession);
    setSessions(prev => {
      const idx = prev.findIndex(s => s.roundNumber === updatedSession.roundNumber);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedSession;
        return copy;
      }
      return [...prev, updatedSession];
    });
    persistSession(updatedSession);
  }, [persistSession]);

  return {
    student,
    currentRound,
    setCurrentRound,
    currentSession,
    loading,
    saving,
    error,
    handleUpdateScore,
    handleUpdateNote,
    handleUpdateSession,
    refresh: fetchStudentAndSessions
  };
}
