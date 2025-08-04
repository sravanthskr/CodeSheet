export interface User {
  uid: string;
  name: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'user';
  solvedProblems: string[];
  starredProblems: string[];
  notes: Record<string, string>;
}

export interface Problem {
  id: string;
  title: string;
  link: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  subTopic: string;
  sheetType: string; // Changed to string to support dynamic sections
  displayOrder: number;
}

export type SectionType = string; // Changed to string to support dynamic sections

export type DifficultyFilter = 'all' | 'Easy' | 'Medium' | 'Hard';
export type StatusFilter = 'all' | 'solved' | 'unsolved' | 'starred';
