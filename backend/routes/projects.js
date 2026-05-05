const express = require('express');
const { getDbSync } = require('../db');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, (req, res) => {
  const db = getDbSync();
  const projects = db.all(`
    SELECT p.*, u.name as owner_name,
      (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as done_count,
      pm.role as my_role
    FROM projects p
    JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
    JOIN users u ON u.id = p.owner_id
    ORDER BY p.created_at DESC
  `, [req.user.id]);
  res.json(projects);
});

router.post('/', auth, (req, res) => {
  const db = getDbSync();
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required.' });
  try {
    const result = db.run('INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)', [name, description || '', req.user.id]);
    const projectId = result.lastInsertRowid;
    db.run('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)', [projectId, req.user.id, 'admin']);
    const project = db.get(`
      SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as done_count,
        'admin' as my_role
      FROM projects p JOIN users u ON u.id = p.owner_id WHERE p.id = ?
    `, [projectId]);
    res.status(201).json(project);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, (req, res) => {
  const db = getDbSync();
  const project = db.get(`
    SELECT p.*, u.name as owner_name,
      (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
      pm.role as my_role
    FROM projects p
    JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
    JOIN users u ON u.id = p.owner_id
    WHERE p.id = ?
  `, [req.user.id, req.params.id]);
  if (!project) return res.status(404).json({ error: 'Project not found or access denied.' });
  res.json(project);
});

router.put('/:id', auth, (req, res) => {
  const db = getDbSync();
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required.' });
  const member = db.get('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!member || member.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
  db.run('UPDATE projects SET name = ?, description = ? WHERE id = ?', [name, description || '', req.params.id]);
  const project = db.get(`
    SELECT p.*, u.name as owner_name,
      (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
      pm.role as my_role
    FROM projects p
    JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
    JOIN users u ON u.id = p.owner_id WHERE p.id = ?
  `, [req.user.id, req.params.id]);
  res.json(project);
});

router.delete('/:id', auth, (req, res) => {
  const db = getDbSync();
  const project = db.get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  if (project.owner_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Only project owner can delete.' });
  // Manual cascade
  const taskIds = db.all('SELECT id FROM tasks WHERE project_id = ?', [req.params.id]).map(r => r.id);
  if (taskIds.length) db.run(`DELETE FROM tasks WHERE project_id = ?`, [req.params.id]);
  db.run('DELETE FROM project_members WHERE project_id = ?', [req.params.id]);
  db.run('DELETE FROM projects WHERE id = ?', [req.params.id]);
  res.json({ message: 'Project deleted.' });
});

router.get('/:id/members', auth, (req, res) => {
  const db = getDbSync();
  const isMember = db.get('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!isMember) return res.status(403).json({ error: 'Access denied.' });
  const members = db.all(`
    SELECT u.id, u.name, u.email, u.role as system_role, pm.role as project_role, pm.joined_at
    FROM project_members pm
    JOIN users u ON u.id = pm.user_id
    WHERE pm.project_id = ? ORDER BY pm.joined_at ASC
  `, [req.params.id]);
  res.json(members);
});

router.post('/:id/members', auth, (req, res) => {
  const db = getDbSync();
  const { email, role } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });
  const myRole = db.get('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!myRole || myRole.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
  const user = db.get('SELECT id, name, email FROM users WHERE email = ?', [email.toLowerCase()]);
  if (!user) return res.status(404).json({ error: 'User not found. They must register first.' });
  const existing = db.get('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?', [req.params.id, user.id]);
  if (existing) return res.status(409).json({ error: 'User is already a member.' });
  const memberRole = role === 'admin' ? 'admin' : 'member';
  db.run('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)', [req.params.id, user.id, memberRole]);
  res.status(201).json({ message: `${user.name} added to project.`, user });
});

router.delete('/:id/members/:userId', auth, (req, res) => {
  const db = getDbSync();
  const myRole = db.get('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!myRole || myRole.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
  db.run('DELETE FROM project_members WHERE project_id = ? AND user_id = ?', [req.params.id, req.params.userId]);
  res.json({ message: 'Member removed.' });
});

module.exports = router;
