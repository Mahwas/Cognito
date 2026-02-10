export enum AppState {
  HOME = 'HOME',
  PLANNING = 'PLANNING',
  STUDYING = 'STUDYING',
  QUIZ = 'QUIZ'
}

export interface ModuleResource {
  title: string;
  url: string;
  source?: string;
}

export interface StudyModule {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  topics: string[];
  isCompleted?: boolean;
}

export interface StudyPlan {
  topic: string;
  modules: StudyModule[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface QuizResult {
  score: number;
  total: number;
  topic: string;
}