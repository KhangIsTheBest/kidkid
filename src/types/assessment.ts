export interface SkillCriterion {
  score: number;
  description: string;
}

export interface SkillItem {
  code: string;
  repertoire_code: string;
  repertoire_name: string;
  title: string;
  objective: string;
  question: string;
  example: string;
  max_score: number;
  criteria: SkillCriterion[];
  ages: number[];
}

export interface Repertoire {
  code: string;
  name: string;
  name_en: string;
  skills_count: number;
  total_points: number;
  skills: string[];
}

export interface NormsCategory {
  name: string;
  code: string;
  values: number[];
}

export interface AbllsDataset {
  framework: string;
  name: string;
  version: string;
  total_skills: number;
  total_repertoires: number;
  norms_intervals: string[];
  norms: Record<string, NormsCategory>;
  repertoires: Repertoire[];
  skills: SkillItem[];
}

export interface Student {
  id: string;
  fullName: string;
  nickname?: string;
  dob: string; // YYYY-MM-DD
  gender: 'male' | 'female';
  diagnosis?: string;
  classOrCenter?: string;
  currentClass?: string;
  evaluationDate?: string;
  evaluatorName?: string;
  parentName?: string;
  parentPhone?: string;
  assignedUserIds?: string[];
  notes?: string;
  createdAt?: string;

  // Database snake_case aliases
  full_name?: string;
  evaluation_date?: string;
  evaluator_name?: string;
  parent_name?: string;
  parent_phone?: string;
  current_class?: string;
}


export interface IepGoal {
  skillCode: string;
  skillTitle: string;
  repertoireCode: string;
  targetScore: number;
  priority: 'Cao' | 'Trung bình' | 'Thấp';
  timeframe: '3 tháng' | '6 tháng' | '12 tháng';
  interventionStrategy: string;
}

export interface AssessmentSession {
  id: string;
  studentId: string;
  assessorName: string;
  assessmentDate: string;
  roundNumber: number; // 1: Baseline, 2: 3M, 3: 6M, 4: 12M
  scores: Record<string, number>; // skillCode -> score (0..max_score)
  skillRounds?: Record<string, Record<number, number>>; // skillCode -> { scoreLevel: roundNumber (1..4) }
  notes: Record<string, string>; // skillCode -> observation note
  generalSummary?: string;
  strengths?: string;
  challenges?: string;
  iepGoals: IepGoal[];
  updatedAt: string;
}
