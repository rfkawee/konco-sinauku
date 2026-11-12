// Antarmuka tipe data frontend Konco-Sinauku

export interface DocumentItem {
  id: string;
  filename: string;
  file_size_bytes: number;
  page_count: number;
  topics: string[];
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: number[];
  isStreaming?: boolean;
}

export interface SummaryData {
  document_id: string;
  executive_summary: string;
  key_points: string[];
  glossary: Record<string, string>;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  relevant_page: number;
}

export interface QuizGenerateResponse {
  topic: string;
  total_questions: number;
  questions: QuizQuestion[];
}

export interface QuestionResultDetail {
  question_id: number;
  question: string;
  options: string[];
  user_answer: string | null;
  correct_answer: string;
  is_correct: boolean;
  explanation: string;
  relevant_page: number;
}

export interface QuizSubmitResponse {
  topic: string;
  total_questions: number;
  correct_count: number;
  percentage: number;
  message: string;
  details: QuestionResultDetail[];
}

export interface UserProfile {
  id: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
}
