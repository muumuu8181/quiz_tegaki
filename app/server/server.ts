import express from 'express';
import path from 'path';
import { QuizUseCase } from '../../core/usecases/QuizUseCase';
import { QuizRepositoryImpl } from './QuizRepositoryImpl';
import { HistoryRepositoryImpl } from './HistoryRepositoryImpl';
import { QuizController } from './QuizController';

const app = express();
const PORT = process.env.PORT || 3001;

// リポジトリとユースケースの初期化
const quizRepository = new QuizRepositoryImpl('./data');
const historyRepository = new HistoryRepositoryImpl();
const quizUseCase = new QuizUseCase(quizRepository, historyRepository);
const quizController = new QuizController(quizUseCase);

// ミドルウェア
app.use(express.static(path.join(__dirname, '../../app/web')));
app.use(express.static(path.join(__dirname, '../../public')));
app.use(express.json());

// ルート設定
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../app/web/index.html'));
});

// API ルート
app.get('/api/questions', (req, res) => quizController.getQuestions(req, res));
app.get('/api/config', (req, res) => quizController.getConfig(req, res));
app.post('/api/config', (req, res) => quizController.saveConfig(req, res));
app.get('/api/stats/:questionId', (req, res) => quizController.getStats(req, res));
app.post('/api/stats/:questionId', (req, res) => quizController.submitAnswer(req, res));
app.get('/api/history', (req, res) => quizController.getHistory(req, res));
app.get('/api/all-stats', (req, res) => quizController.getAllStats(req, res));

app.listen(PORT, () => {
    console.log(`Quiz app running at http://localhost:${PORT}`);
});