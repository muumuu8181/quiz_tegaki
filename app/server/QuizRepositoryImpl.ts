import * as fs from 'fs';
import * as path from 'path';
import { QuizRepository } from '../../core/usecases/QuizUseCase';
import { Question, QuestionStats, QuizConfig } from '../../core/types';

export class QuizRepositoryImpl implements QuizRepository {
  private dataDir: string;

  constructor(dataDir: string = './data') {
    this.dataDir = dataDir;
  }

  async getQuestions(): Promise<Question[]> {
    try {
      const data = fs.readFileSync(path.join(this.dataDir, 'questions.json'), 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load questions:', error);
      return [];
    }
  }

  async getConfig(): Promise<QuizConfig> {
    try {
      const data = fs.readFileSync(path.join(this.dataDir, 'config.json'), 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load config:', error);
      return { questionsPerRound: 5 };
    }
  }

  async saveConfig(config: QuizConfig): Promise<void> {
    try {
      fs.writeFileSync(path.join(this.dataDir, 'config.json'), JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    }
  }

  async getStats(questionId: number): Promise<QuestionStats> {
    try {
      const data = fs.readFileSync(path.join(this.dataDir, 'stats.json'), 'utf8');
      const stats = JSON.parse(data);
      return stats[questionId] || { attempts: 0, correct: 0, lastAnswered: null };
    } catch (error) {
      return { attempts: 0, correct: 0, lastAnswered: null };
    }
  }

  async saveStats(questionId: number, isCorrect: boolean): Promise<void> {
    try {
      let stats: Record<string, QuestionStats> = {};
      try {
        const data = fs.readFileSync(path.join(this.dataDir, 'stats.json'), 'utf8');
        stats = JSON.parse(data);
      } catch (e) {
        // ファイルが存在しない場合は空のオブジェクトから開始
      }
      
      const today = new Date().toISOString().split('T')[0];
      
      if (!stats[questionId]) {
        stats[questionId] = { attempts: 0, correct: 0, lastAnswered: null };
      }
      
      stats[questionId].attempts++;
      if (isCorrect) {
        stats[questionId].correct++;
      }
      stats[questionId].lastAnswered = today;
      
      fs.writeFileSync(path.join(this.dataDir, 'stats.json'), JSON.stringify(stats, null, 2));
    } catch (error) {
      console.error('Failed to save stats:', error);
      throw error;
    }
  }
}