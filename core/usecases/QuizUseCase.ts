import { Question, QuestionStats, QuizConfig, HistoryItem, QuestionWithPriority } from '../types';
import { QuizDomain } from '../domain/QuizDomain';

export interface QuizRepository {
  getQuestions(): Promise<Question[]>;
  getConfig(): Promise<QuizConfig>;
  saveConfig(config: QuizConfig): Promise<void>;
  getStats(questionId: number): Promise<QuestionStats>;
  saveStats(questionId: number, isCorrect: boolean): Promise<void>;
}

export interface HistoryRepository {
  getHistory(): HistoryItem[];
  addToHistory(item: HistoryItem): void;
}

export class QuizUseCase {
  constructor(
    private quizRepo: QuizRepository,
    private historyRepo: HistoryRepository
  ) {}

  async generateQuizSession(): Promise<QuestionWithPriority[]> {
    const questions = await this.quizRepo.getQuestions();
    const config = await this.quizRepo.getConfig();
    
    const questionsWithPriority: QuestionWithPriority[] = [];
    
    for (const question of questions) {
      const stats = await this.quizRepo.getStats(question.id);
      const questionWithPriority = QuizDomain.calculateQuestionPriority(question, stats);
      questionsWithPriority.push(questionWithPriority);
    }

    // 優先度でソート
    questionsWithPriority.sort((a, b) => b.priority - a.priority);

    return QuizDomain.selectQuestions(questionsWithPriority, config.questionsPerRound);
  }

  async submitAnswer(questionId: number, selectedAnswer: number): Promise<boolean> {
    const questions = await this.quizRepo.getQuestions();
    const question = questions.find(q => q.id === questionId);
    
    if (!question) {
      throw new Error(`Question with id ${questionId} not found`);
    }

    const isCorrect = QuizDomain.validateAnswer(question, selectedAnswer);
    
    // 統計を保存
    await this.quizRepo.saveStats(questionId, isCorrect);
    
    // 履歴に追加
    const historyItem: HistoryItem = {
      questionId,
      questionText: question.question,
      selectedAnswer,
      correctAnswer: question.correct,
      isCorrect,
      timestamp: new Date().toLocaleString('ja-JP')
    };
    
    this.historyRepo.addToHistory(historyItem);

    return isCorrect;
  }

  async updateConfig(config: QuizConfig): Promise<void> {
    await this.quizRepo.saveConfig(config);
  }

  getHistory(): HistoryItem[] {
    return this.historyRepo.getHistory();
  }

  async getStatsForAllQuestions(): Promise<Array<{ question: Question; stats: QuestionStats }>> {
    const questions = await this.quizRepo.getQuestions();
    const result = [];
    
    for (const question of questions) {
      const stats = await this.quizRepo.getStats(question.id);
      result.push({ question, stats });
    }
    
    return result;
  }
}