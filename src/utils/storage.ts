import { AbllsDataset, Student, AssessmentSession } from '../types/assessment';
import abllsRawData from '../data/ablls_master_dataset.json';

export const abllsData: AbllsDataset = abllsRawData as unknown as AbllsDataset;

const STUDENTS_KEY = 'kidkid_students';
const SESSIONS_KEY = 'kidkid_sessions';

// COLOR MAPPING (Chuẩn 100% theo mod_SyncEngine.bas trong file ABLLS_DanhGia.xlsm)
// 1 = Yellow (#FFFF00)
// 2 = Orange (#FFA500)
// 3 = Green  (#52CF50)
// 4 = Blue   (#B8C7E4)
export const ROUND_COLORS: Record<number, { bg: string; text: string; border: string; name: string; hex: string }> = {
  1: { bg: '#FFFF00', text: '#713F12', border: '#EAB308', name: 'Đợt 1 (Vàng)', hex: '#FFFF00' },
  2: { bg: '#FFA500', text: '#7C2D12', border: '#EA580C', name: 'Đợt 2 (Cam)', hex: '#FFA500' },
  3: { bg: '#52CF50', text: '#14532D', border: '#16A34A', name: 'Đợt 3 (Xanh lá)', hex: '#52CF50' },
  4: { bg: '#B8C7E4', text: '#1E3A8A', border: '#3B82F6', name: 'Đợt 4 (Xanh dương)', hex: '#B8C7E4' },
};

// Target points for each repertoire at ages 2, 3, 4, 5 (from ABLLS_DanhGia.xlsm sheets Mốc tuổi)
export const AGE_TARGETS: Record<number, Record<string, number>> = {
  2: {
    A: 25, B: 4, C: 53, D: 19, E: 17, F: 26, G: 16, H: 3, I: 13, J: 0,
    K: 14, L: 20, M: 0, N: 0, P: 1, Q: 0, R: 0, S: 1, T: 0, U: 0,
    V: 5, W: 0, X: 0, Y: 3, Z: 4
  },
  3: {
    A: 48, B: 22, C: 108, D: 57, E: 44, F: 60, G: 90, H: 48, I: 26, J: 16,
    K: 35, L: 44, M: 2, N: 0, P: 10, Q: 0, R: 2, S: 1, T: 0, U: 9,
    V: 7, W: 3, X: 6, Y: 13, Z: 10
  },
  4: {
    A: 52, B: 50, C: 157, D: 77, E: 51, F: 74, G: 129, H: 112, I: 28, J: 27,
    K: 45, L: 63, M: 23, N: 0, P: 12, Q: 0, R: 6, S: 3, T: 0, U: 13,
    V: 10, W: 6, X: 15, Y: 19, Z: 18
  },
  5: {
    A: 52, B: 94, C: 182, D: 80, E: 55, F: 74, G: 151, H: 172, I: 28, J: 41,
    K: 52, L: 79, M: 36, N: 23, P: 12, Q: 6, R: 37, S: 23, T: 1, U: 25,
    V: 14, W: 11, X: 18, Y: 24, Z: 27
  }
};

// Helper to calculate age in months from DOB and assessment date
export function calculateAgeMonths(dobStr: string, refDateStr: string = new Date().toISOString()): { years: number; months: number; totalMonths: number } {
  const dob = new Date(dobStr);
  const ref = new Date(refDateStr);
  let totalMonths = (ref.getFullYear() - dob.getFullYear()) * 12 + (ref.getMonth() - dob.getMonth());
  if (ref.getDate() < dob.getDate()) {
    totalMonths -= 1;
  }
  totalMonths = Math.max(0, totalMonths);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  return { years, months, totalMonths };
}

// Map age in months to the closest Norms column index
export function getNormsIntervalIndex(totalMonths: number): number {
  if (totalMonths <= 6) return 0;
  if (totalMonths >= 60) return 18;
  const idx = Math.round((totalMonths - 6) / 3);
  return Math.min(18, Math.max(0, idx));
}

// Helper to update skill scores with multi-round color preservation
export function updateSkillScore(
  currentScores: Record<string, number>,
  currentSkillRounds: Record<string, Record<number, number>> | undefined,
  skillCode: string,
  newScore: number,
  roundNumber: number
): { scores: Record<string, number>; skillRounds: Record<string, Record<number, number>> } {
  const scores = { ...currentScores, [skillCode]: newScore };
  const skillRounds = { ...(currentSkillRounds || {}) };
  const existingLevels = { ...(skillRounds[skillCode] || {}) };

  const newLevels: Record<number, number> = {};
  for (let lvl = 1; lvl <= newScore; lvl++) {
    // If level was already attained in an earlier round, keep that round's color!
    // Otherwise, tag it with the currently active round!
    newLevels[lvl] = existingLevels[lvl] || roundNumber;
  }

  skillRounds[skillCode] = newLevels;
  return { scores, skillRounds };
}

// Initial sample students
const initialStudents: Student[] = [
  {
    id: 'student-ro-2026',
    fullName: 'Hoàng Gia Bảo (Rô)',
    dob: '2022-04-15',
    gender: 'male',
    diagnosis: 'Rối loạn phổ tự kỷ (ASD)',
    classOrCenter: 'Trung tâm Can thiệp Sớm',
    notes: 'Trẻ thân thiện, có nhu cầu tương tác nhưng ngôn ngữ diễn đạt còn hạn chế, giảm chú ý có chọn lọc.',
    createdAt: '2026-01-10'
  },
  {
    id: 'student-ngoc-minh',
    fullName: 'Nguyễn Ngọc Minh',
    dob: '2021-08-20',
    gender: 'male',
    diagnosis: 'Chậm phát triển ngôn ngữ & giao tiếp',
    classOrCenter: 'Trung tâm Can thiệp Sớm',
    notes: 'Bắt chước vận động tốt, cần tăng cường giao tiếp mắt, kỹ năng yêu cầu và phản hồi tên gọi.',
    createdAt: '2026-02-05'
  }
];

const roInitialScores: Record<string, number> = {
  'A1': 2, 'A2': 2, 'A3': 3, 'A4': 2, 'A5': 2, 'A6': 1, 'A7': 2, 'A11': 1, 'A12': 1, 'A13': 2,
  'B1': 2, 'B2': 1, 'B3': 2, 'B5': 1, 'B7': 2,
  'C1': 2, 'C2': 1, 'C3': 2, 'C4': 1, 'C5': 1,
  'D1': 2, 'D2': 2, 'D3': 1, 'D4': 2,
  'E1': 1, 'E2': 1,
  'F1': 1, 'F2': 2, 'F3': 1,
  'G1': 1, 'G2': 1,
  'K1': 2, 'K2': 2, 'K3': 1,
  'L1': 2, 'L2': 1,
  'Y1': 1, 'Y2': 1, 'Y3': 1,
  'Z1': 1, 'Z2': 1
};

// Seed skillRounds for Ro (Round 1 Baseline)
const roInitialSkillRounds: Record<string, Record<number, number>> = {};
Object.entries(roInitialScores).forEach(([code, score]) => {
  roInitialSkillRounds[code] = {};
  for (let l = 1; l <= score; l++) {
    roInitialSkillRounds[code][l] = 1; // Round 1
  }
});

const initialSessions: AssessmentSession[] = [
  {
    id: 'session-ro-baseline',
    studentId: 'student-ro-2026',
    assessorName: 'Cô Nguyễn Thu Hà',
    assessmentDate: '2026-02-15',
    roundNumber: 1,
    scores: roInitialScores,
    skillRounds: roInitialSkillRounds,
    notes: {
      'A1': 'Bé nhận kẹo M&M rất hào hứng ngay khi đưa ra.',
      'A3': 'Nhìn theo đồ chơi chuyển động tốt nhưng thỉnh thoảng mất tập trung khi có tiếng động bên ngoài.',
      'F1': 'Cần nhắc bằng hình ảnh để chỉ tay yêu cầu đồ chơi.'
    },
    generalSummary: 'Trẻ có mức độ hợp tác tương đối tốt khi có phần thưởng yêu thích. Kỹ năng vận động thô và bắt chước vận động đang hình thành. Ngôn ngữ tiếp nhận và ngôn ngữ diễn đạt còn cách biệt so với mốc tuổi.',
    strengths: 'Vui vẻ, thích tham gia các trò chơi thể chất và đồ chơi phát sáng; phản hồi tích cực với khen thưởng thức ăn yêu thích.',
    challenges: 'Khả năng duy trì chú ý ngắn; chưa chủ động dùng lời nói để yêu cầu (Mand) mà chủ yếu kéo tay người lớn.',
    iepGoals: [
      {
        skillCode: 'F1',
        skillTitle: 'Yêu cầu bằng cử chỉ hoặc hình ảnh',
        repertoireCode: 'F',
        targetScore: 2,
        priority: 'Cao',
        timeframe: '3 tháng',
        interventionStrategy: 'Dạy trẻ chỉ tay hoặc trao thẻ tranh PECS để lấy đồ vật yêu thích trong 8/10 cơ hội.'
      },
      {
        skillCode: 'A6',
        skillTitle: 'Phản ứng với mệnh lệnh thay đổi',
        repertoireCode: 'A',
        targetScore: 2,
        priority: 'Cao',
        timeframe: '3 tháng',
        interventionStrategy: 'Luyện tập chuyển đổi giữa 2 hoạt động chơi tự do sang hoạt động có hướng dẫn.'
      },
      {
        skillCode: 'E1',
        skillTitle: 'Nói theo các âm đơn',
        repertoireCode: 'E',
        targetScore: 2,
        priority: 'Trung bình',
        timeframe: '6 tháng',
        interventionStrategy: 'Mô phỏng các âm nguyên âm cơ bản (a, o, u) và âm thanh tiếng kêu con vật trong giờ chơi.'
      }
    ],
    updatedAt: new Date().toISOString()
  }
];

export function getStudents(): Student[] {
  const data = localStorage.getItem(STUDENTS_KEY);
  if (!data) {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(initialStudents));
    return initialStudents;
  }
  try {
    return JSON.parse(data);
  } catch {
    return initialStudents;
  }
}

export function saveStudent(student: Student): void {
  const students = getStudents();
  const index = students.findIndex(s => s.id === student.id);
  if (index >= 0) {
    students[index] = student;
  } else {
    students.unshift(student);
  }
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
}

export function getSessions(studentId?: string): AssessmentSession[] {
  const data = localStorage.getItem(SESSIONS_KEY);
  let sessions: AssessmentSession[] = [];
  if (!data) {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(initialSessions));
    sessions = initialSessions;
  } else {
    try {
      sessions = JSON.parse(data);
    } catch {
      sessions = initialSessions;
    }
  }
  if (studentId) {
    return sessions.filter(s => s.studentId === studentId);
  }
  return sessions;
}

export function saveSession(session: AssessmentSession): void {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  session.updatedAt = new Date().toISOString();
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.unshift(session);
  }

  // Đồng bộ dữ liệu đánh giá lũy kế giữa tất cả các đợt của học sinh này
  // (Giống 100% Sheet Tổng hợp trong file ABLLS_DanhGia.xlsm)
  sessions.forEach(s => {
    if (s.studentId === session.studentId) {
      s.scores = { ...session.scores };
      s.skillRounds = { ...(session.skillRounds || {}) };
      s.notes = { ...session.notes };
      s.updatedAt = session.updatedAt;
    }
  });

  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}
