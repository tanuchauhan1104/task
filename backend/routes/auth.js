const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDbSync } = require('../db');
const { auth, JWT_SECRET } = require('../middleware/auth');
const router = express.Router();

router.post('/signup', (req, res) => {
  const db = getDbSync();
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required.' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  const allowedRole = ['admin', 'member'].includes(role) ? role : 'member';
  try {
    const existing = db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) return res.status(409).json({ error: 'Email already registered.' });
    const hashed = bcrypt.hashSync(password, 10);
    const result = db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email.toLowerCase().trim(), hashed, allowedRole]);
    const user = db.get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [result.lastInsertRowid]);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/login', (req, res) => {
  const db = getDbSync();
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  try {
    const user = db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials.' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...u } = user;
    res.json({ token, user: u });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/me', auth, (req, res) => {
  const db = getDbSync();
  const user = db.get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json(user);
});

module.exports = router;
