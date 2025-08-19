import { HistoryRepository } from '../../core/usecases/QuizUseCase';
import { HistoryItem } from '../../core/types';

export class HistoryRepositoryImpl implements HistoryRepository {
  private history: HistoryItem[] = [];
  private readonly maxHistorySize = 100;

  constructor() {
    this.loadHistory();
  }

  private loadHistory(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('quizHistory');
        this.history = saved ? JSON.parse(saved) : [];
      } catch (error) {
        console.error('Failed to load history:', error);
        this.history = [];
      }
    }
  }

  private saveHistory(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('quizHistory', JSON.stringify(this.history));
      } catch (error) {
        console.error('Failed to save history:', error);
      }
    }
  }

  getHistory(): HistoryItem[] {
    return [...this.history];
  }

  addToHistory(item: HistoryItem): void {
    this.history.unshift(item);
    
    // 最新100件まで保持
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(0, this.maxHistorySize);
    }
    
    this.saveHistory();
  }
}