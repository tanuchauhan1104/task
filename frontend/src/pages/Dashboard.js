import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ value, label, icon, color }) => (
  <div className="stat-card">
    <div className="stat-value" style={{ color }}>{value}</div>
    <div className="stat-label">{label}</div>
    <div className="stat-icon">{icon}</div>
  </div>
);

const statusLabel = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const priorityLabel = { low: 'Low', medium: 'Medium', high: 'High' };

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/tasks/dashboard/stats'),
      api.get('/tasks'),
      api.get('/tasks?overdue=true'),
    ]).then(([s, tasks, overdue]) => {
      setStats(s);
      setRecentTasks(tasks.slice(0, 5));
      setOverdueTasks(overdue.slice(0, 5));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" />Loading dashboard…</div>;

  const todoCount = stats?.byStatus?.find(s => s.status === 'todo')?.count || 0;
  const inProgressCount = stats?.byStatus?.find(s => s.status === 'in_progress')?.count || 0;
  const doneCount = stats?.byStatus?.find(s => s.status === 'done')?.count || 0;
  const donePercent = stats?.total ? Math.round((doneCount / stats.total) * 100) : 0;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
            Good to see you, <strong style={{ color: 'var(--text)' }}>{user?.name}</strong> 👋
          </p>
        </div>
        <span className={`badge badge-${user?.role}`} style={{ padding: '6px 14px', fontSize: 13 }}>
          {user?.role === 'admin' ? '⚡ Admin' : '👤 Member'}
        </span>
      </div>

      {/* Stats */}
      <div className="grid-4 mb-24">
        <StatCard value={stats?.projects || 0} label="Projects" icon="⬡" color="var(--accent)" />
        <StatCard value={stats?.total || 0} label="Total Tasks" icon="☑" color="var(--blue)" />
        <StatCard value={stats?.myTasks || 0} label="Assigned to Me" icon="👤" color="var(--green)" />
        <StatCard value={stats?.overdue || 0} label="Overdue" icon="⚠" color="var(--red)" />
      </div>

      {/* Progress */}
      <div className="card mb-24">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
          <h3 style={{ fontWeight: 700 }}>Overall Progress</h3>
          <span style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent)' }}>{donePercent}%</span>
        </div>
        <div className="progress-bar" style={{ height: 10, marginBottom: 16 }}>
          <div className="progress-fill" style={{ width: `${donePercent}%` }} />
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {[
            { label: 'To Do', count: todoCount, color: 'var(--text-muted)' },
            { label: 'In Progress', count: inProgressCount, color: 'var(--blue)' },
            { label: 'Done', count: doneCount, color: 'var(--green)' },
          ].map(({ label, count, color }) => (
            <div key={label}>
              <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'var(--font-display)' }}>{count}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        {/* Recent Tasks */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700 }}>Recent Tasks</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks')}>View all →</button>
          </div>
          {recentTasks.length === 0 ? (
            <div className="empty-state"><h3>No tasks yet</h3><p>Create a project and add tasks</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentTasks.map(task => (
                <div key={task.id} className="card" style={{ padding: '14px 16px', cursor: 'pointer' }}
                  onClick={() => navigate(`/projects/${task.project_id}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{task.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{task.project_name}</div>
                    </div>
                    <span className={`badge badge-${task.status}`}>{statusLabel[task.status]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue Tasks */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700 }}>⚠ Overdue Tasks</h3>
            {overdueTasks.length > 0 && <span className={`badge badge-high`}>{overdueTasks.length}</span>}
          </div>
          {overdueTasks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
              <p style={{ color: 'var(--text-muted)' }}>No overdue tasks!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {overdueTasks.map(task => (
                <div key={task.id} className="card" style={{ padding: '14px 16px', borderColor: 'rgba(239,68,68,0.3)', cursor: 'pointer' }}
                  onClick={() => navigate(`/projects/${task.project_id}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{task.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--red)' }}>Due: {task.due_date}</div>
                    </div>
                    <span className={`badge badge-${task.priority}`}>{priorityLabel[task.priority]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
