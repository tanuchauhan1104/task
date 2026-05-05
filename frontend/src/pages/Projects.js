import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

function ProjectCard({ project, onClick }) {
  const donePercent = project.task_count > 0 ? Math.round((project.done_count / project.task_count) * 100) : 0;
  return (
    <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}
      onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.transform = ''; }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <h3 style={{ fontWeight: 700, fontSize: 17 }}>{project.name}</h3>
        <span className={`badge badge-${project.my_role}`}>{project.my_role}</span>
      </div>
      {project.description && (
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16, lineHeight: 1.5 }}>
          {project.description.length > 80 ? project.description.slice(0, 80) + '…' : project.description}
        </p>
      )}
      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
        <span>👥 {project.member_count} members</span>
        <span>☑ {project.task_count} tasks</span>
        <span>✅ {project.done_count} done</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${donePercent}%` }} />
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{donePercent}% complete</div>
    </div>
  );
}

function CreateProjectModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Project name is required.'); return; }
    setLoading(true);
    try {
      const project = await api.post('/projects', form);
      onCreate(project);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">New Project</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {error && <div className="error-msg">{error}</div>}
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input className="form-input" placeholder="e.g. Website Redesign" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" placeholder="What is this project about?" rows={3}
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.get('/projects').then(setProjects).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" />Loading projects…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>{projects.length} project{projects.length !== 1 ? 's' : ''} you're part of</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 16 }}>⬡</div>
          <h3>No projects yet</h3>
          <p style={{ marginBottom: 24 }}>Create your first project and invite your team</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Project</button>
        </div>
      ) : (
        <div className="grid-3">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} onClick={() => navigate(`/projects/${project.id}`)} />
          ))}
        </div>
      )}

      {showModal && (
        <CreateProjectModal
          onClose={() => setShowModal(false)}
          onCreate={p => setProjects(prev => [p, ...prev])}
        />
      )}
    </div>
  );
}
