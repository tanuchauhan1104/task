const express = require('express');
const { getDbSync } = require('../db');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Dashboard stats must come before /:id
router.get('/dashboard/stats', auth, (req, res) => {
  const db = getDbSync();
  const uid = req.user.id;
  const total = db.get(`SELECT COUNT(*) as count FROM tasks WHERE project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)`, [uid]);
  const byStatus = db.all(`SELECT status, COUNT(*) as count FROM tasks WHERE project_id IN (SELECT project_id FROM project_members WHERE user_id = ?) GROUP BY status`, [uid]);
  const byPriority = db.all(`SELECT priority, COUNT(*) as count FROM tasks WHERE project_id IN (SELECT project_id FROM project_members WHERE user_id = ?) GROUP BY priority`, [uid]);
  const overdue = db.get(`SELECT COUNT(*) as count FROM tasks WHERE project_id IN (SELECT project_id FROM project_members WHERE user_id = ?) AND due_date < date('now') AND status != 'done'`, [uid]);
  const myTasks = db.get(`SELECT COUNT(*) as count FROM tasks WHERE assignee_id = ?`, [uid]);
  const projects = db.get(`SELECT COUNT(*) as count FROM project_members WHERE user_id = ?`, [uid]);
  res.json({ total: total.count, byStatus, byPriority, overdue: overdue.count, myTasks: myTasks.count, projects: projects.count });
});

router.get('/', auth, (req, res) => {
  const db = getDbSync();
  const { project_id, status, assignee_id, overdue } = req.query;
  let sql = `
    SELECT t.*, u.name as assignee_name, u.email as assignee_email,
      c.name as created_by_name, p.name as project_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
    LEFT JOIN users c ON c.id = t.created_by
    LEFT JOIN projects p ON p.id = t.project_id
    WHERE t.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)
  `;
  const params = [req.user.id];
  if (project_id) { sql += ' AND t.project_id = ?'; params.push(project_id); }
  if (status) { sql += ' AND t.status = ?'; params.push(status); }
  if (assignee_id) { sql += ' AND t.assignee_id = ?'; params.push(assignee_id); }
  if (overdue === 'true') { sql += ` AND t.due_date < date('now') AND t.status != 'done'`; }
  sql += ' ORDER BY t.created_at DESC';
  res.json(db.all(sql, params));
});

router.post('/', auth, (req, res) => {
  const db = getDbSync();
  const { title, description, status, priority, project_id, assignee_id, due_date } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required.' });
  if (!project_id) return res.status(400).json({ error: 'project_id is required.' });
  const isMember = db.get('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?', [project_id, req.user.id]);
  if (!isMember) return res.status(403).json({ error: 'Access denied to this project.' });
  if (assignee_id) {
    const ok = db.get('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?', [project_id, assignee_id]);
    if (!ok) return res.status(400).json({ error: 'Assignee must be a project member.' });
  }
  const validStatus = ['todo','in_progress','done'].includes(status) ? status : 'todo';
  const validPriority = ['low','medium','high'].includes(priority) ? priority : 'medium';
  try {
    const result = db.run(
      `INSERT INTO tasks (title,description,status,priority,project_id,assignee_id,created_by,due_date) VALUES (?,?,?,?,?,?,?,?)`,
      [title, description||'', validStatus, validPriority, project_id, assignee_id||null, req.user.id, due_date||null]
    );
    const task = db.get(`
      SELECT t.*, u.name as assignee_name, c.name as created_by_name, p.name as project_name
      FROM tasks t LEFT JOIN users u ON u.id=t.assignee_id LEFT JOIN users c ON c.id=t.created_by LEFT JOIN projects p ON p.id=t.project_id
      WHERE t.id = ?
    `, [result.lastInsertRowid]);
    res.status(201).json(task);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, (req, res) => {
  const db = getDbSync();
  const task = db.get(`
    SELECT t.*, u.name as assignee_name, c.name as created_by_name, p.name as project_name
    FROM tasks t LEFT JOIN users u ON u.id=t.assignee_id LEFT JOIN users c ON c.id=t.created_by LEFT JOIN projects p ON p.id=t.project_id
    WHERE t.id = ? AND t.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)
  `, [req.params.id, req.user.id]);
  if (!task) return res.status(404).json({ error: 'Task not found.' });
  res.json(task);
});

router.put('/:id', auth, (req, res) => {
  const db = getDbSync();
  const { title, description, status, priority, assignee_id, due_date } = req.body;
  const task = db.get(`SELECT t.* FROM tasks t WHERE t.id = ? AND t.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)`, [req.params.id, req.user.id]);
  if (!task) return res.status(404).json({ error: 'Task not found.' });
  const myRole = db.get('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?', [task.project_id, req.user.id]);
  if (myRole?.role !== 'admin' && task.assignee_id !== req.user.id && task.created_by !== req.user.id) {
    return res.status(403).json({ error: 'You can only update your own tasks.' });
  }
  const validStatus = ['todo','in_progress','done'].includes(status) ? status : task.status;
  const validPriority = ['low','medium','high'].includes(priority) ? priority : task.priority;
  db.run(
    `UPDATE tasks SET title=?,description=?,status=?,priority=?,assignee_id=?,due_date=?,updated_at=datetime('now') WHERE id=?`,
    [title||task.title, description!==undefined?description:task.description, validStatus, validPriority,
     assignee_id!==undefined?assignee_id:task.assignee_id, due_date!==undefined?due_date:task.due_date, req.params.id]
  );
  const updated = db.get(`
    SELECT t.*, u.name as assignee_name, c.name as created_by_name, p.name as project_name
    FROM tasks t LEFT JOIN users u ON u.id=t.assignee_id LEFT JOIN users c ON c.id=t.created_by LEFT JOIN projects p ON p.id=t.project_id
    WHERE t.id = ?
  `, [req.params.id]);
  res.json(updated);
});

router.delete('/:id', auth, (req, res) => {
  const db = getDbSync();
  const task = db.get(`SELECT t.* FROM tasks t WHERE t.id = ? AND t.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)`, [req.params.id, req.user.id]);
  if (!task) return res.status(404).json({ error: 'Task not found.' });
  const myRole = db.get('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?', [task.project_id, req.user.id]);
  if (myRole?.role !== 'admin' && task.created_by !== req.user.id) return res.status(403).json({ error: 'Only admins or task creator can delete.' });
  db.run('DELETE FROM tasks WHERE id = ?', [req.params.id]);
  res.json({ message: 'Task deleted.' });
});

module.exports = router;
