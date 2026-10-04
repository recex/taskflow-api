const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve frontend in production
app.use(express.static(path.join(__dirname, '../frontend')));

// In-memory "database"
let tasks = [
  { id: uuidv4(), title: 'Bem-vindo ao TaskFlow!', description: 'Este é seu primeiro task. Edite ou crie novos.', status: 'done', priority: 'low', createdAt: new Date().toISOString() },
  { id: uuidv4(), title: 'Explorar a API', description: 'Teste os endpoints POST /tasks e GET /tasks', status: 'todo', priority: 'high', createdAt: new Date().toISOString() },
  { id: uuidv4(), title: 'Deploy no Render', description: 'Suba esse projeto e compartilhe o link!', status: 'progress', priority: 'medium', createdAt: new Date().toISOString() },
];

let nextId = 4;

// ====== MIDDLEWARE ======
const validateTask = (req, res, next) => {
  const { title, status, priority } = req.body;
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'Campo "title" é obrigatório e deve ser uma string não vazia.' });
  }
  if (status && !['todo', 'progress', 'done'].includes(status)) {
    return res.status(400).json({ error: 'status inválido. Use: todo, progress, done.' });
  }
  if (priority && !['low', 'medium', 'high'].includes(priority)) {
    return res.status(400).json({ error: 'priority inválido. Use: low, medium, high.' });
  }
  next();
};

// ====== HEALTH ======
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), tasks: tasks.length });
});

// ====== STATS ======
app.get('/api/stats', (req, res) => {
  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done').length;
  const progress = tasks.filter(t => t.status === 'progress').length;
  const todo = tasks.filter(t => t.status === 'todo').length;
  res.json({ total, done, progress, todo });
});

// ====== CRUD TASKS ======
app.get('/api/tasks', (req, res) => {
  const { status, priority, search, sort } = req.query;
  let list = [...tasks];
  if (status) list = list.filter(t => t.status === status);
  if (priority) list = list.filter(t => t.priority === priority);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(t => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)));
  }
  if (sort === 'newest') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (sort === 'priority') {
    const order = { high: 0, medium: 1, low: 2 };
    list.sort((a, b) => order[a.priority] - order[b.priority]);
  }
  res.json(list);
});

app.get('/api/tasks/:id', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task não encontrada.' });
  res.json(task);
});

app.post('/api/tasks', validateTask, (req, res) => {
  const { title, description = '', status = 'todo', priority = 'medium' } = req.body;
  const task = { id: uuidv4(), title: title.trim(), description: description.trim(), status, priority, createdAt: new Date().toISOString() };
  tasks.unshift(task);
  res.status(201).json(task);
});

app.put('/api/tasks/:id', validateTask, (req, res) => {
  const idx = tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Task não encontrada.' });
  const { title, description, status, priority } = req.body;
  tasks[idx] = { ...tasks[idx], title: title?.trim() ?? tasks[idx].title, description: description?.trim() ?? tasks[idx].description, status: status ?? tasks[idx].status, priority: priority ?? tasks[idx].priority };
  res.json(tasks[idx]);
});

app.delete('/api/tasks/:id', (req, res) => {
  const idx = tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Task não encontrada.' });
  const removed = tasks.splice(idx, 1)[0];
  res.json({ message: 'Task removida.', task: removed });
});

// ====== SPA FALLBACK ======
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 TaskFlow API rodando na porta ${PORT}`);
});
