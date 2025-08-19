import { Question, QuestionStats, QuestionWithPriority } from '../types';

export class QuizDomain {
  static calculateQuestionPriority(question: Question, stats: QuestionStats): QuestionWithPriority {
    const correctRate = stats.attempts > 0 ? stats.correct / stats.attempts : 0;
    const daysSinceLastAnswer = stats.lastAnswered 
      ? Math.floor((Date.now() - new Date(stats.lastAnswered).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    let priority = 1;

    if (stats.attempts === 0) {
      priority = 10; // 未解答問題は最優先
    } else if (correctRate < 0.7) {
      priority = 8; // 正解率70%未満は高優先度
    } else if (correctRate >= 0.9 && daysSinceLastAnswer < 7) {
      priority = 1; // 正解率90%以上で1週間未満は最低優先度
    } else if (daysSinceLastAnswer >= 7) {
      priority = 6; // 1週間以上経過は中優先度（忘却曲線考慮）
    } else {
      priority = 3; // その他は通常優先度
    }

    return { 
      ...question, 
      priority, 
      correctRate, 
      daysSinceLastAnswer 
    };
  }

  static selectQuestions(questionsWithPriority: QuestionWithPriority[], count: number): QuestionWithPriority[] {
    // 重み付けランダム選択
    const weightedQuestions: QuestionWithPriority[] = [];
    questionsWithPriority.forEach(q => {
      for (let i = 0; i < q.priority; i++) {
        weightedQuestions.push(q);
      }
    });

    const selectedQuestions: QuestionWithPriority[] = [];
    const usedIds = new Set<number>();
    
    while (selectedQuestions.length < count && usedIds.size < questionsWithPriority.length) {
      const randomIndex = Math.floor(Math.random() * weightedQuestions.length);
      const question = weightedQuestions[randomIndex];
      
      if (!usedIds.has(question.id)) {
        selectedQuestions.push(question);
        usedIds.add(question.id);
      }
    }

    return selectedQuestions;
  }

  static validateAnswer(question: Question, selectedAnswer: number): boolean {
    return selectedAnswer === question.correct;
  }
}