import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import './Projects.css'

function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Project name is required'); return }
    setLoading(true)
    try {
      const res = await api.post('/projects', form)
      onCreated(res.data.project)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">🚀 Create New Project</h2>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group">
            <label htmlFor="project-name">Project Name</label>
            <input
              className="input"
              id="project-name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Mobile App Redesign"
              autoFocus
            />
          </div>
          <div className="input-group">
            <label htmlFor="project-desc">Description</label>
            <textarea
              className="input"
              id="project-desc"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Brief description (optional)"
              rows={3}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" id="create-project-submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const fetchProjects = () => {
    api.get('/projects')
      .then(res => setProjects(res.data.projects))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProjects() }, [])

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} id="open-create-project">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <h3>No projects yet</h3>
          <p>Create your first project and start managing tasks with your team.</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Project</button>
        </div>
      ) : (
        <div className="grid-3">
          {projects.map(p => (
            <Link to={`/projects/${p._id}`} key={p._id} className="project-card card" id={`project-${p._id}`}>
              <div className="project-card-header">
                <div className="project-avatar">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="project-name">{p.name}</h3>
                  <p className="project-desc">{p.description || 'No description'}</p>
                </div>
              </div>
              <div className="project-card-stats">
                <div className="pcs-item">
                  <span className="pcs-val">{p.members?.length || 0}</span>
                  <span className="pcs-label">Members</span>
                </div>
                <div className="pcs-divider"></div>
                <div className="pcs-item">
                  <span className="pcs-val">{p.taskCount || 0}</span>
                  <span className="pcs-label">Tasks</span>
                </div>
                <div className="pcs-divider"></div>
                <div className="pcs-item">
                  <span className="pcs-val">{p.doneCount || 0}</span>
                  <span className="pcs-label">Done</span>
                </div>
              </div>
              {p.taskCount > 0 && (
                <div className="project-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(p.doneCount / p.taskCount) * 100}%` }}></div>
                  </div>
                  <span className="progress-text">{Math.round((p.doneCount / p.taskCount) * 100)}%</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <CreateProjectModal
          onClose={() => setShowModal(false)}
          onCreated={(p) => setProjects(prev => [p, ...prev])}
        />
      )}
    </div>
  )
}
