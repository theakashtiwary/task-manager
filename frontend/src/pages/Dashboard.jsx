import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import './Dashboard.css'

const StatCard = ({ label, value, color, icon }) => (
  <div className="stat-card" style={{ '--stat-color': color }}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
    <div className="stat-glow"></div>
  </div>
)

const statusBadge = (s) => {
  const map = { TODO: 'todo', IN_PROGRESS: 'in-progress', DONE: 'done' }
  const labels = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' }
  return <span className={`badge badge-${map[s]}`}>{labels[s]}</span>
}

const priorityBadge = (p) => {
  const map = { LOW: 'low', MEDIUM: 'medium', HIGH: 'high' }
  return <span className={`badge badge-${map[p]}`}>{p}</span>
}

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>
  }

  const stats = data?.stats || {}

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <p className="welcome-text">Welcome back,</p>
          <h1 className="page-title">{user?.name || 'Commander'} 👋</h1>
        </div>
        <Link to="/projects" className="btn btn-primary" id="dash-view-projects">
          View Projects
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </Link>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Projects" value={stats.totalProjects || 0} color="var(--accent)" icon="📁" />
        <StatCard label="Total Tasks" value={stats.totalTasks || 0} color="var(--cyan)" icon="📋" />
        <StatCard label="My Tasks" value={stats.myTasks || 0} color="var(--pink)" icon="👤" />
        <StatCard label="To Do" value={stats.todo || 0} color="var(--cyan)" icon="📝" />
        <StatCard label="In Progress" value={stats.inProgress || 0} color="var(--amber)" icon="⚡" />
        <StatCard label="Completed" value={stats.done || 0} color="var(--aurora)" icon="✅" />
        <StatCard label="Overdue" value={stats.overdue || 0} color="var(--red)" icon="🔴" />
      </div>

      {/* Overdue Tasks */}
      {data?.overdueTasks?.length > 0 && (
        <section className="dash-section">
          <h2 className="section-title section-title-danger">⚠️ Overdue Tasks</h2>
          <div className="task-list">
            {data.overdueTasks.map(t => (
              <div className="task-row task-overdue" key={t._id}>
                <div className="task-row-main">
                  <span className="task-row-title">{t.title}</span>
                  {statusBadge(t.status)}
                  {priorityBadge(t.priority)}
                </div>
                <div className="task-row-meta">
                  <span>Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                  {t.assignee && <span>→ {t.assignee.name}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Tasks */}
      <section className="dash-section">
        <h2 className="section-title">Recent Tasks</h2>
        {data?.recentTasks?.length > 0 ? (
          <div className="task-list">
            {data.recentTasks.map(t => (
              <div className="task-row" key={t._id}>
                <div className="task-row-main">
                  <span className="task-row-title">{t.title}</span>
                  {statusBadge(t.status)}
                  {priorityBadge(t.priority)}
                </div>
                <div className="task-row-meta">
                  {t.dueDate && <span>Due: {new Date(t.dueDate).toLocaleDateString()}</span>}
                  {t.assignee && <span>→ {t.assignee.name}</span>}
                  <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No tasks yet</h3>
            <p>Create a project and add tasks to get started!</p>
            <Link to="/projects" className="btn btn-primary">Go to Projects</Link>
          </div>
        )}
      </section>
    </div>
  )
}
