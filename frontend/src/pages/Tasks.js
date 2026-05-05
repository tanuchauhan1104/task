import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const statusLabel = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

export default function Tasks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', priority: '', mine: false, overdue: false });

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter.status) params.set('status', filter.status);
    if (filter.mine) params.set('assignee_id', user.id);
    if (filter.overdue) params.set('overdue', 'true');
    api.get(`/tasks?${params}`).then(setTasks).catch(console.error).finally(() => setLoading(false));
  }, [filter, user.id]);

  const today = new Date().toISOString().split('T')[0];

  const filtered = filter.priority ? tasks.filter(t => t.priority === filter.priority) : tasks;

  if (loading) return <div className="loading"><div className="spinner" />Loading tasks…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">All Tasks</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>{filtered.length} task{filtered.length !== 1 ? 's' : ''} found</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="form-input" style={{ width: 'auto' }} value={filter.status}
          onChange={e => setFilter(p => ({ ...p, status: e.target.value }))}>
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select className="form-input" style={{ width: 'auto' }} value={filter.priority}
          onChange={e => setFilter(p => ({ ...p, priority: e.target.value }))}>
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button
          className={`btn ${filter.mine ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setFilter(p => ({ ...p, mine: !p.mine }))}>
          👤 Mine
        </button>
        <button
          className={`btn ${filter.overdue ? 'btn-danger' : 'btn-secondary'} btn-sm`}
          onClick={() => setFilter(p => ({ ...p, overdue: !p.overdue }))}>
          ⚠ Overdue
        </button>
        {(filter.status || filter.priority || filter.mine || filter.overdue) && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilter({ status: '', priority: '', mine: false, overdue: false })}>
            Clear all
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 16 }}>☑</div>
          <h3>No tasks found</h3>
          <p>Try adjusting your filters or create tasks in a project</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/projects')}>
            Go to Projects
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th><th>Project</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(task => (
                <tr key={task.id} onClick={() => navigate(`/projects/${task.project_id}`)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 500, maxWidth: 240 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                    {task.description && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {task.description.length > 50 ? task.description.slice(0, 50) + '…' : task.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>{task.project_name}</span>
                  </td>
                  <td><span className={`badge badge-${task.status}`}>{statusLabel[task.status]}</span></td>
                  <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                  <td>
                    {task.assignee_name ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                        <div className="avatar" style={{ width: 24, height: 24, fontSize: 10 }}>
                          {task.assignee_name.slice(0, 2).toUpperCase()}
                        </div>
                        {task.assignee_name}
                      </div>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td style={{ fontSize: 13, color: task.due_date && task.due_date < today && task.status !== 'done' ? 'var(--red)' : 'var(--text-muted)' }}>
                    {task.due_date || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
