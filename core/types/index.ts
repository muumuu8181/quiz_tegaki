export interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
}

export interface QuestionStats {
  attempts: number;
  correct: number;
  lastAnswered: string | null;
}

export interface QuizConfig {
  questionsPerRound: number;
}

export interface HistoryItem {
  questionId: number;
  questionText: string;
  selectedAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  timestamp: string;
}

export interface QuestionWithPriority extends Question {
  priority: number;
  correctRate: number;
  daysSinceLastAnswer: number;
}