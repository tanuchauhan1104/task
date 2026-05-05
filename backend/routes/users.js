const express = require('express');
const { getDbSync } = require('../db');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, (req, res) => {
  const db = getDbSync();
  res.json(db.all('SELECT id, name, email, role FROM users ORDER BY name ASC'));
});

module.exports = router;
