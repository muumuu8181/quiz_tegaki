import { Request, Response } from 'express';
import { QuizUseCase } from '../../core/usecases/QuizUseCase';

export class QuizController {
  constructor(private quizUseCase: QuizUseCase) {}

  async getQuestions(req: Request, res: Response): Promise<void> {
    try {
      const questions = await this.quizUseCase.generateQuizSession();
      res.json(questions);
    } catch (error) {
      console.error('Error getting questions:', error);
      res.status(500).json({ error: 'Failed to load questions' });
    }
  }

  async getConfig(req: Request, res: Response): Promise<void> {
    try {
      // 直接リポジトリから取得（設定表示用）
      const config = await this.quizUseCase['quizRepo'].getConfig();
      res.json(config);
    } catch (error) {
      console.error('Error getting config:', error);
      res.status(500).json({ error: 'Failed to load config' });
    }
  }

  async saveConfig(req: Request, res: Response): Promise<void> {
    try {
      await this.quizUseCase.updateConfig(req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving config:', error);
      res.status(500).json({ error: 'Failed to save config' });
    }
  }

  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const questionId = parseInt(req.params.questionId);
      const stats = await this.quizUseCase['quizRepo'].getStats(questionId);
      res.json(stats);
    } catch (error) {
      console.error('Error getting stats:', error);
      res.json({ attempts: 0, correct: 0, lastAnswered: null });
    }
  }

  async submitAnswer(req: Request, res: Response): Promise<void> {
    try {
      const questionId = parseInt(req.params.questionId);
      const { selectedAnswer } = req.body;
      const isCorrect = await this.quizUseCase.submitAnswer(questionId, selectedAnswer);
      res.json({ isCorrect, success: true });
    } catch (error) {
      console.error('Error submitting answer:', error);
      res.status(500).json({ error: 'Failed to save answer' });
    }
  }

  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const history = this.quizUseCase.getHistory();
      res.json(history);
    } catch (error) {
      console.error('Error getting history:', error);
      res.status(500).json({ error: 'Failed to get history' });
    }
  }

  async getAllStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.quizUseCase.getStatsForAllQuestions();
      res.json(stats);
    } catch (error) {
      console.error('Error getting all stats:', error);
      res.status(500).json({ error: 'Failed to get stats' });
    }
  }
}