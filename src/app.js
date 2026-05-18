const express = require('express');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  req.traceId = req.headers['x-trace-id'] || `trace-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  next();
});

app.get('/health', (req, res) => res.json({ code: 0, message: 'OK' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit', auditRoutes);
app.use(express.static(path.join(__dirname, '..', 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});
app.get('/users.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'users.html'));
});
app.get('/security.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'security.html'));
});
app.get('/audit.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'audit.html'));
});

module.exports = app;
