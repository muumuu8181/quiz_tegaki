class QuizApp {
    constructor() {
        this.currentScreen = 'menu';
        this.questions = [];
        this.currentQuestions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.config = { questionsPerRound: 5 };
        this.stats = {};
        this.history = [];
        
        this.init();
    }

    async init() {
        await this.loadData();
        this.loadHistory();
        this.setupEventListeners();
        this.showScreen('menu');
    }

    async loadData() {
        try {
            const [questionsRes, configRes] = await Promise.all([
                fetch('/api/questions'),
                fetch('/api/config')
            ]);
            
            this.questions = await questionsRes.json();
            this.config = await configRes.json();
            
            document.getElementById('question-count').value = this.config.questionsPerRound;
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    }

    async loadStats(questionId) {
        try {
            const res = await fetch(`/api/stats/${questionId}`);
            return await res.json();
        } catch (error) {
            return { attempts: 0, correct: 0, lastAnswered: null };
        }
    }

    async saveStats(questionId, isCorrect) {
        try {
            await fetch(`/api/stats/${questionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correct: isCorrect })
            });
        } catch (error) {
            console.error('Failed to save stats:', error);
        }
    }

    async saveConfig() {
        try {
            await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.config)
            });
        } catch (error) {
            console.error('Failed to save config:', error);
        }
    }

    loadHistory() {
        const saved = localStorage.getItem('quizHistory');
        this.history = saved ? JSON.parse(saved) : [];
    }

    saveHistory() {
        localStorage.setItem('quizHistory', JSON.stringify(this.history));
    }

    addToHistory(questionId, questionText, selectedAnswer, correctAnswer, isCorrect) {
        const historyItem = {
            questionId,
            questionText,
            selectedAnswer,
            correctAnswer,
            isCorrect,
            timestamp: new Date().toLocaleString('ja-JP')
        };
        this.history.unshift(historyItem);
        
        // 最新100件まで保持
        if (this.history.length > 100) {
            this.history = this.history.slice(0, 100);
        }
        
        this.saveHistory();
    }

    calculateQuestionPriority(question, stats) {
        const correctRate = stats.attempts > 0 ? stats.correct / stats.attempts : 0;
        const daysSinceLastAnswer = stats.lastAnswered 
            ? Math.floor((Date.now() - new Date(stats.lastAnswered).getTime()) / (1000 * 60 * 60 * 24))
            : 999;

        let priority = 1;

        if (stats.attempts === 0) {
            priority = 10;
        } else if (correctRate < 0.7) {
            priority = 8;
        } else if (correctRate >= 0.9 && daysSinceLastAnswer < 7) {
            priority = 1;
        } else if (daysSinceLastAnswer >= 7) {
            priority = 6;
        } else {
            priority = 3;
        }

        return { ...question, priority, correctRate, daysSinceLastAnswer };
    }

    async selectQuestions() {
        const questionsWithPriority = [];
        
        for (const question of this.questions) {
            const stats = await this.loadStats(question.id);
            const questionWithPriority = this.calculateQuestionPriority(question, stats);
            questionsWithPriority.push(questionWithPriority);
        }

        questionsWithPriority.sort((a, b) => b.priority - a.priority);

        const weightedQuestions = [];
        questionsWithPriority.forEach(q => {
            for (let i = 0; i < q.priority; i++) {
                weightedQuestions.push(q);
            }
        });

        const selectedQuestions = [];
        const usedIds = new Set();
        
        while (selectedQuestions.length < this.config.questionsPerRound && usedIds.size < this.questions.length) {
            const randomIndex = Math.floor(Math.random() * weightedQuestions.length);
            const question = weightedQuestions[randomIndex];
            
            if (!usedIds.has(question.id)) {
                selectedQuestions.push(question);
                usedIds.add(question.id);
            }
        }

        return selectedQuestions;
    }

    setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', async () => {
            this.currentQuestions = await this.selectQuestions();
            this.currentQuestionIndex = 0;
            this.score = 0;
            this.startQuiz();
        });

        document.getElementById('config-btn').addEventListener('click', () => {
            this.showScreen('config');
        });

        document.getElementById('history-btn').addEventListener('click', () => {
            this.showHistory();
        });

        document.getElementById('stats-btn').addEventListener('click', () => {
            this.showStats();
        });

        document.getElementById('config-save').addEventListener('click', () => {
            this.config.questionsPerRound = parseInt(document.getElementById('question-count').value);
            this.saveConfig();
            this.showScreen('menu');
        });

        document.getElementById('config-back').addEventListener('click', () => {
            this.showScreen('menu');
        });

        document.getElementById('history-back').addEventListener('click', () => {
            this.showScreen('menu');
        });

        document.getElementById('stats-back').addEventListener('click', () => {
            this.showScreen('menu');
        });

        document.getElementById('retry-btn').addEventListener('click', async () => {
            this.currentQuestions = await this.selectQuestions();
            this.currentQuestionIndex = 0;
            this.score = 0;
            this.startQuiz();
        });

        document.getElementById('menu-btn').addEventListener('click', () => {
            this.showScreen('menu');
        });

        document.querySelectorAll('.answer-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!e.target.classList.contains('disabled')) {
                    this.handleAnswer(parseInt(e.target.dataset.answer));
                }
            });
        });
    }

    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(`${screenName}-screen`).classList.add('active');
        this.currentScreen = screenName;
    }

    startQuiz() {
        this.showScreen('quiz');
        this.displayQuestion();
    }

    displayQuestion() {
        const question = this.currentQuestions[this.currentQuestionIndex];
        
        document.getElementById('current-question').textContent = this.currentQuestionIndex + 1;
        document.getElementById('total-questions').textContent = this.currentQuestions.length;
        document.getElementById('question-id').textContent = question.id;
        document.getElementById('question-text').textContent = question.question;
        
        const answerBtns = document.querySelectorAll('.answer-btn');
        answerBtns.forEach((btn, index) => {
            btn.textContent = question.options[index];
            btn.className = 'answer-btn'; // すべてのクラスをリセット
            btn.disabled = false;
        });
    }

    async handleAnswer(selectedAnswer) {
        const question = this.currentQuestions[this.currentQuestionIndex];
        const isCorrect = selectedAnswer === question.correct;
        
        if (isCorrect) {
            this.score++;
        }

        await this.saveStats(question.id, isCorrect);
        this.addToHistory(question.id, question.question, selectedAnswer, question.correct, isCorrect);

        const answerBtns = document.querySelectorAll('.answer-btn');
        answerBtns.forEach((btn, index) => {
            btn.classList.add('disabled');
            if (index === question.correct) {
                btn.classList.add('correct');
            } else if (index === selectedAnswer && !isCorrect) {
                btn.classList.add('incorrect');
            }
        });

        // 正解・不正解を確認する時間を0.6秒与える
        setTimeout(() => {
            this.currentQuestionIndex++;
            if (this.currentQuestionIndex < this.currentQuestions.length) {
                this.displayQuestion();
            } else {
                this.showResult();
            }
        }, 600);
    }

    showResult() {
        document.getElementById('score-text').textContent = 
            `${this.currentQuestions.length}問中${this.score}問正解`;
        this.showScreen('result');
    }

    showHistory() {
        const historyList = document.getElementById('history-list');
        
        if (this.history.length === 0) {
            historyList.innerHTML = '<div class="history-item">まだ解答履歴がありません</div>';
        } else {
            historyList.innerHTML = this.history.map(item => {
                const question = this.questions.find(q => q.id === item.questionId);
                const selectedText = question ? question.options[item.selectedAnswer] : '不明';
                const correctText = question ? question.options[item.correctAnswer] : '不明';
                
                return `
                    <div class="history-item">
                        <div class="question-info">ID:${item.questionId} - ${item.questionText}</div>
                        <div class="result ${item.isCorrect ? 'correct' : 'incorrect'}">
                            選択: ${selectedText} | 正解: ${correctText} | ${item.isCorrect ? '正解' : '不正解'}
                        </div>
                        <div class="timestamp">${item.timestamp}</div>
                    </div>
                `;
            }).join('');
        }
        
        this.showScreen('history');
    }

    async showStats() {
        const statsList = document.getElementById('stats-list');
        const statsHtml = [];
        
        for (const question of this.questions) {
            const stats = await this.loadStats(question.id);
            const correctRate = stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : 0;
            
            statsHtml.push(`
                <div class="stats-item">
                    <div class="question-title">ID:${question.id} - ${question.question}</div>
                    <div class="stats-data">
                        ${stats.attempts}回挑戦<br>
                        正解率: ${correctRate}%<br>
                        最終解答: ${stats.lastAnswered || 'なし'}
                    </div>
                </div>
            `);
        }
        
        statsList.innerHTML = statsHtml.join('');
        this.showScreen('stats');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new QuizApp();
});