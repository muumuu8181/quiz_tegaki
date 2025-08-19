const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3001;

app.use(express.static('public'));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/questions', (req, res) => {
    try {
        const data = fs.readFileSync('./data/questions.json', 'utf8');
        const questions = JSON.parse(data);
        res.json(questions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load questions' });
    }
});

app.get('/api/config', (req, res) => {
    try {
        const data = fs.readFileSync('./data/config.json', 'utf8');
        const config = JSON.parse(data);
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load config' });
    }
});

app.post('/api/config', (req, res) => {
    try {
        fs.writeFileSync('./data/config.json', JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save config' });
    }
});

app.get('/api/stats/:questionId', (req, res) => {
    try {
        const data = fs.readFileSync('./data/stats.json', 'utf8');
        const stats = JSON.parse(data);
        const questionId = req.params.questionId;
        res.json(stats[questionId] || { attempts: 0, correct: 0, lastAnswered: null });
    } catch (error) {
        res.json({ attempts: 0, correct: 0, lastAnswered: null });
    }
});

app.post('/api/stats/:questionId', (req, res) => {
    try {
        let stats = {};
        try {
            const data = fs.readFileSync('./data/stats.json', 'utf8');
            stats = JSON.parse(data);
        } catch (e) {}
        
        const questionId = req.params.questionId;
        const { correct } = req.body;
        const today = new Date().toISOString().split('T')[0];
        
        if (!stats[questionId]) {
            stats[questionId] = { attempts: 0, correct: 0, lastAnswered: null };
        }
        
        stats[questionId].attempts++;
        if (correct) {
            stats[questionId].correct++;
        }
        stats[questionId].lastAnswered = today;
        
        fs.writeFileSync('./data/stats.json', JSON.stringify(stats, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save stats' });
    }
});

app.listen(PORT, () => {
    console.log(`Quiz app running at http://localhost:${PORT}`);
});