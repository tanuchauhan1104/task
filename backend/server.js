const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { getDb } = require('./db');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());

// Initialize DB then mount routes
getDb().then(() => {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/projects', require('./routes/projects'));
  app.use('/api/tasks', require('./routes/tasks'));
  app.use('/api/users', require('./routes/users'));

  app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  // Serve React build in production
  const buildPath = path.join(__dirname, '../frontend/build');
  if (fs.existsSync(buildPath)) {
    app.use(express.static(buildPath));
    app.get('*', (req, res) => res.sendFile(path.join(buildPath, 'index.html')));
  } else {
    app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));
  }

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error.' });
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 TaskFlow running on port ${PORT}`));
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
