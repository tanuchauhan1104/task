import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const STATUS_COLS = [
  { key: 'todo', label: 'To Do', color: 'var(--text-muted)' },
  { key: 'in_progress', label: 'In Progress', color: 'var(--blue)' },
  { key: 'done', label: 'Done', color: 'var(--green)' },
];

const PRIORITY_COLORS = { low: 'var(--green)', medium: 'var(--yellow)', high: 'var(--red)' };

function TaskModal({ task, project, members, onClose, onSave, onDelete }) {
  const { user } = useAuth();
  const isAdmin = project?.my_role === 'admin';
  const [form, setForm] = useState(task ? {
    title: task.title, description: task.description || '', status: task.status,
    priority: task.priority, assignee_id: task.assignee_id || '', due_date: task.due_date || ''
  } : { title: '', description: '', status: 'todo', priority: 'medium', assignee_id: '', due_date: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required.'); return; }
    setLoading(true);
    try {
      const payload = { ...form, project_id: project.id, assignee_id: form.assignee_id || null, due_date: form.due_date || null };
      let saved;
      if (task) { saved = await api.put(`/tasks/${task.id}`, payload); }
      else { saved = await api.post('/tasks', payload); }
      onSave(saved);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    try { await api.delete(`/tasks/${task.id}`); onDelete(task.id); onClose(); }
    catch (err) { setError(err.message); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h2 className="modal-title">{task ? 'Edit Task' : 'New Task'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div className="error-msg">{error}</div>}
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" placeholder="Task title" value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" placeholder="Details…" rows={3} value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical' }} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Assignee</label>
              <select className="form-input" value={form.assignee_id}
                onChange={e => setForm(p => ({ ...p, assignee_id: e.target.value }))}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input className="form-input" type="date" value={form.due_date}
                onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 4 }}>
            <div>
              {task && (isAdmin || task.created_by === user?.id) && (
                <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving…' : (task ? 'Update' : 'Create Task')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMemberModal({ projectId, onClose, onAdd }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const result = await api.post(`/projects/${projectId}/members`, { email, role });
      setSuccess(`${result.user.name} added!`);
      setEmail('');
      onAdd();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h2 className="modal-title">Add Member</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div className="error-msg">{error}</div>}
          {success && <div className="success-msg">{success}</div>}
          <div className="form-group">
            <label className="form-label">User Email</label>
            <input className="form-input" type="email" placeholder="member@example.com" value={email}
              onChange={e => setEmail(e.target.value)} autoFocus required />
          </div>
          <div className="form-group">
            <label className="form-label">Project Role</label>
            <select className="form-input" value={role} onChange={e => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding…' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('kanban');
  const [taskModal, setTaskModal] = useState(null); // null | 'new' | task object
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');

  const load = useCallback(async () => {
    try {
      const [proj, t, m] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?project_id=${id}`),
        api.get(`/projects/${id}/members`),
      ]);
      setProject(proj); setTasks(t); setMembers(m);
    } catch (err) {
      if (err.message.includes('not found')) navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  const handleSaveTask = (saved) => {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === saved.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; }
      return [saved, ...prev];
    });
  };
  const handleDeleteTask = (taskId) => setTasks(prev => prev.filter(t => t.id !== taskId));

  const handleDeleteProject = async () => {
    if (!window.confirm(`Delete project "${project.name}"? This cannot be undone.`)) return;
    try { await api.delete(`/projects/${id}`); navigate('/projects'); }
    catch (err) { alert(err.message); }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member?')) return;
    try { await api.delete(`/projects/${id}/members/${memberId}`); load(); }
    catch (err) { alert(err.message); }
  };

  if (loading) return <div className="loading"><div className="spinner" />Loading project…</div>;
  if (!project) return null;

  const isAdmin = project.my_role === 'admin';

  const filteredTasks = tasks.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterAssignee && String(t.assignee_id) !== String(filterAssignee)) return false;
    return true;
  });

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="page">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')} style={{ marginBottom: 12 }}>
          ← Back to Projects
        </button>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div>
            <h1 className="page-title">{project.name}</h1>
            {project.description && <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>{project.description}</p>}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className={`badge badge-${project.my_role}`}>{project.my_role}</span>
            {isAdmin && (
              <>
                <button className="btn btn-primary btn-sm" onClick={() => setTaskModal('new')}>+ Task</button>
                <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>Delete</button>
              </>
            )}
            {!isAdmin && (
              <button className="btn btn-primary btn-sm" onClick={() => setTaskModal('new')}>+ Task</button>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: 20, marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
          <span>👥 {members.length} members</span>
          <span>☑ {tasks.length} tasks</span>
          <span style={{ color: 'var(--green)' }}>✅ {tasks.filter(t => t.status === 'done').length} done</span>
          <span style={{ color: 'var(--red)' }}>⚠ {tasks.filter(t => t.due_date && t.due_date < today && t.status !== 'done').length} overdue</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[{ key: 'kanban', label: '⬡ Kanban' }, { key: 'list', label: '☰ List' }, { key: 'members', label: '👥 Members' }].map(tab => (
          <button key={tab.key} className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}>{tab.label}</button>
        ))}
      </div>

      {/* Filters (kanban + list) */}
      {activeTab !== 'members' && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <select className="form-input" style={{ width: 'auto', minWidth: 130 }}
            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <select className="form-input" style={{ width: 'auto', minWidth: 150 }}
            value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
            <option value="">All Assignees</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          {(filterStatus || filterAssignee) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setFilterStatus(''); setFilterAssignee(''); }}>
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Kanban View */}
      {activeTab === 'kanban' && (
        <div className="kanban-board">
          {STATUS_COLS.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.key);
            return (
              <div key={col.key} className="kanban-col">
                <div className="kanban-col-header">
                  <span style={{ color: col.color }}>{col.label}</span>
                  <span style={{ background: 'var(--bg-hover)', padding: '2px 8px', borderRadius: 99, fontSize: 12 }}>{colTasks.length}</span>
                </div>
                <div className="kanban-col-body">
                  {colTasks.map(task => (
                    <div key={task.id} className="task-card" onClick={() => setTaskModal(task)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                        <div className="task-title" style={{ fontSize: 14 }}>{task.title}</div>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[task.priority], flexShrink: 0, marginTop: 4 }} title={task.priority} />
                      </div>
                      {task.description && (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                          {task.description.length > 60 ? task.description.slice(0, 60) + '…' : task.description}
                        </p>
                      )}
                      <div className="task-meta">
                        {task.assignee_name && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                            <div className="avatar" style={{ width: 22, height: 22, fontSize: 10 }}>
                              {task.assignee_name.slice(0, 2).toUpperCase()}
                            </div>
                            <span style={{ color: 'var(--text-muted)' }}>{task.assignee_name}</span>
                          </div>
                        )}
                        {task.due_date && (
                          <span style={{ fontSize: 11, color: task.due_date < today && task.status !== 'done' ? 'var(--red)' : 'var(--text-muted)' }}>
                            📅 {task.due_date}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, borderRadius: 8, border: '2px dashed var(--border)' }}>
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {activeTab === 'list' && (
        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          {filteredTasks.length === 0 ? (
            <div className="empty-state"><h3>No tasks</h3><p>Create a task to get started</p></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(task => (
                  <tr key={task.id} onClick={() => setTaskModal(task)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 500 }}>{task.title}</td>
                    <td><span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span></td>
                    <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                    <td>
                      {task.assignee_name ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar" style={{ width: 26, height: 26, fontSize: 10 }}>
                            {task.assignee_name.slice(0, 2).toUpperCase()}
                          </div>
                          {task.assignee_name}
                        </div>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ color: task.due_date && task.due_date < today && task.status !== 'done' ? 'var(--red)' : undefined }}>
                      {task.due_date || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div>
          {isAdmin && (
            <div style={{ marginBottom: 16 }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowMemberModal(true)}>+ Add Member</button>
            </div>
          )}
          <div className="card" style={{ padding: 0, overflow: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Member</th><th>Email</th><th>Project Role</th><th>Joined</th>{isAdmin && <th>Actions</th>}</tr></thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar">{m.name.slice(0, 2).toUpperCase()}</div>
                        <span style={{ fontWeight: 500 }}>{m.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{m.email}</td>
                    <td><span className={`badge badge-${m.project_role}`}>{m.project_role}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{m.joined_at?.split('T')[0] || '—'}</td>
                    {isAdmin && (
                      <td>
                        {m.id !== user?.id && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(m.id)}>Remove</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {taskModal !== null && (
        <TaskModal
          task={taskModal === 'new' ? null : taskModal}
          project={project}
          members={members}
          onClose={() => setTaskModal(null)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}

      {showMemberModal && (
        <AddMemberModal
          projectId={id}
          onClose={() => setShowMemberModal(false)}
          onAdd={load}
        />
      )}
    </div>
  );
}
