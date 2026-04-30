import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import './ProjectDetail.css'

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH']
const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE']
const STATUS_LABELS = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' }

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [myRole, setMyRole] = useState(null)
  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('tasks')

  // Task form
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', dueDate: '', assigneeId: '' })
  const [taskError, setTaskError] = useState('')
  const [taskLoading, setTaskLoading] = useState(false)

  // Member form
  const [memberEmail, setMemberEmail] = useState('')
  const [memberRole, setMemberRole] = useState('MEMBER')
  const [memberError, setMemberError] = useState('')

  // Edit task
  const [editingTask, setEditingTask] = useState(null)

  const isAdmin = myRole === 'ADMIN'

  const fetchAll = async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/tasks`)
      ])
      setProject(projRes.data.project)
      setMyRole(projRes.data.myRole)
      setMembers(projRes.data.project.members || [])
      setTasks(taskRes.data.tasks)
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 403) {
        navigate('/projects', { replace: true })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [id])

  // Create task
  const handleCreateTask = async (e) => {
    e.preventDefault()
    setTaskError('')
    if (!taskForm.title.trim()) { setTaskError('Title is required'); return }
    setTaskLoading(true)
    try {
      const res = await api.post(`/projects/${id}/tasks`, taskForm)
      setTasks(prev => [res.data.task, ...prev])
      setTaskForm({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', dueDate: '', assigneeId: '' })
      setShowTaskForm(false)
    } catch (err) {
      setTaskError(err.response?.data?.error || 'Failed to create task')
    } finally {
      setTaskLoading(false)
    }
  }

  // Update task status
  const handleStatusChange = async (taskId, status) => {
    try {
      const res = await api.patch(`/tasks/${taskId}/status`, { status })
      setTasks(prev => prev.map(t => t._id === taskId ? res.data.task : t))
    } catch (err) {
      console.error(err)
    }
  }

  // Update task
  const handleUpdateTask = async (e) => {
    e.preventDefault()
    if (!editingTask) return
    setTaskError('')
    try {
      const res = await api.put(`/tasks/${editingTask._id}`, {
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        status: editingTask.status,
        dueDate: editingTask.dueDate || null,
        assigneeId: editingTask.assigneeId || null
      })
      setTasks(prev => prev.map(t => t._id === editingTask._id ? res.data.task : t))
      setEditingTask(null)
    } catch (err) {
      setTaskError(err.response?.data?.error || 'Update failed')
    }
  }

  // Delete task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return
    try {
      await api.delete(`/tasks/${taskId}`)
      setTasks(prev => prev.filter(t => t._id !== taskId))
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed')
    }
  }

  // Add member
  const handleAddMember = async (e) => {
    e.preventDefault()
    setMemberError('')
    if (!memberEmail.trim()) { setMemberError('Email is required'); return }
    try {
      const res = await api.post(`/projects/${id}/members`, { email: memberEmail, role: memberRole })
      setMembers(res.data.members)
      setMemberEmail('')
    } catch (err) {
      setMemberError(err.response?.data?.error || 'Failed to add member')
    }
  }

  // Remove member
  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return
    try {
      const res = await api.delete(`/projects/${id}/members/${userId}`)
      setMembers(res.data.members)
    } catch (err) {
      alert(err.response?.data?.error || 'Remove failed')
    }
  }

  // Delete project
  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this project and all its tasks? This cannot be undone.')) return
    try {
      await api.delete(`/projects/${id}`)
      navigate('/projects', { replace: true })
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed')
    }
  }

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>
  }

  if (!project) {
    return <div className="page-container"><p>Project not found</p></div>
  }

  // Group tasks by status for kanban view
  const tasksByStatus = { TODO: [], IN_PROGRESS: [], DONE: [] }
  tasks.forEach(t => {
    if (tasksByStatus[t.status]) tasksByStatus[t.status].push(t)
  })

  return (
    <div className="page-container">
      <p className="breadcrumb">
        <Link to="/projects">Projects</Link> / {project.name}
      </p>

      <div className="page-header">
        <div>
          <h1 className="page-title">{project.name}</h1>
          {project.description && <p className="project-detail-desc">{project.description}</p>}
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span className={`badge badge-${isAdmin ? 'admin' : 'member'}`}>
            {isAdmin ? '👑 Admin' : '👤 Member'}
          </span>
          {isAdmin && (
            <button className="btn btn-danger btn-sm" onClick={handleDeleteProject} id="delete-project">
              Delete Project
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="project-tabs">
        <button className={`tab-btn ${tab === 'tasks' ? 'active' : ''}`} onClick={() => setTab('tasks')} id="tab-tasks">
          📋 Tasks ({tasks.length})
        </button>
        <button className={`tab-btn ${tab === 'members' ? 'active' : ''}`} onClick={() => setTab('members')} id="tab-members">
          👥 Members ({members.length})
        </button>
      </div>

      {/* TASKS TAB */}
      {tab === 'tasks' && (
        <div className="tab-content">
          <div style={{ marginBottom: '20px' }}>
            <button className="btn btn-primary" onClick={() => { setShowTaskForm(true); setEditingTask(null) }} id="open-create-task">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Task
            </button>
          </div>

          {/* KANBAN BOARD */}
          <div className="kanban-board">
            {STATUSES.map(status => (
              <div className="kanban-column" key={status}>
                <div className={`kanban-header kanban-header-${status.toLowerCase().replace('_', '-')}`}>
                  <span>{STATUS_LABELS[status]}</span>
                  <span className="kanban-count">{tasksByStatus[status].length}</span>
                </div>
                <div className="kanban-tasks">
                  {tasksByStatus[status].length === 0 ? (
                    <div className="kanban-empty">No tasks</div>
                  ) : (
                    tasksByStatus[status].map(task => (
                      <div className="kanban-task-card" key={task._id}>
                        <div className="ktc-header">
                          <h4 className="ktc-title">{task.title}</h4>
                          <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
                        </div>
                        {task.description && <p className="ktc-desc">{task.description}</p>}
                        <div className="ktc-meta">
                          {task.assignee && (
                            <div className="ktc-assignee">
                              <div className="ktc-avatar">{task.assignee.name?.charAt(0)?.toUpperCase()}</div>
                              <span>{task.assignee.name}</span>
                            </div>
                          )}
                          {task.dueDate && (
                            <span className={`ktc-due ${new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? 'overdue' : ''}`}>
                              📅 {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="ktc-actions">
                          <select
                            value={task.status}
                            onChange={e => handleStatusChange(task._id, e.target.value)}
                            className="ktc-status-select"
                          >
                            {STATUSES.map(s => (
                              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                            ))}
                          </select>
                          <button className="btn btn-secondary btn-sm" onClick={() => {
                            setEditingTask({
                              ...task,
                              assigneeId: task.assignee?._id || '',
                              dueDate: task.dueDate ? task.dueDate.slice(0, 10) : ''
                            })
                            setShowTaskForm(false)
                          }}>✏️</button>
                          {(isAdmin || task.createdBy?._id === user?._id) && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTask(task._id)}>🗑️</button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MEMBERS TAB */}
      {tab === 'members' && (
        <div className="tab-content">
          {isAdmin && (
            <form onSubmit={handleAddMember} className="add-member-form">
              {memberError && <div className="error-msg">{memberError}</div>}
              <div className="amf-row">
                <input
                  className="input"
                  placeholder="Enter email to add"
                  value={memberEmail}
                  onChange={e => setMemberEmail(e.target.value)}
                  id="member-email-input"
                />
                <select value={memberRole} onChange={e => setMemberRole(e.target.value)} className="input" style={{ maxWidth: '130px' }}>
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <button type="submit" className="btn btn-primary" id="add-member-submit">Add</button>
              </div>
            </form>
          )}

          <div className="members-list">
            {members.map(m => (
              <div className="member-row" key={m._id}>
                <div className="member-info">
                  <div className="member-avatar">{m.user?.name?.charAt(0)?.toUpperCase() || '?'}</div>
                  <div>
                    <div className="member-name">{m.user?.name || 'Unknown'}</div>
                    <div className="member-email">{m.user?.email || ''}</div>
                  </div>
                </div>
                <div className="member-actions">
                  <span className={`badge badge-${m.role.toLowerCase()}`}>{m.role === 'ADMIN' ? '👑 Admin' : '👤 Member'}</span>
                  {isAdmin && m.user?._id !== user?._id && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(m.user?._id)}>Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showTaskForm && (
        <div className="modal-overlay" onClick={() => setShowTaskForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">✨ Create Task</h2>
            {taskError && <div className="error-msg">{taskError}</div>}
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label>Title</label>
                <input className="input" id="task-title" value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" autoFocus />
              </div>
              <div className="input-group">
                <label>Description</label>
                <textarea className="input" id="task-desc" value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} placeholder="Details (optional)" rows={2} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label>Priority</label>
                  <select className="input" value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Status</label>
                  <select className="input" value={taskForm.status} onChange={e => setTaskForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label>Due Date</label>
                  <input className="input" type="date" value={taskForm.dueDate} onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label>Assign To</label>
                  <select className="input" value={taskForm.assigneeId} onChange={e => setTaskForm(f => ({ ...f, assigneeId: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {members.map(m => <option key={m.user?._id} value={m.user?._id}>{m.user?.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" id="create-task-submit" disabled={taskLoading}>
                  {taskLoading ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TASK MODAL */}
      {editingTask && (
        <div className="modal-overlay" onClick={() => setEditingTask(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">✏️ Edit Task</h2>
            {taskError && <div className="error-msg">{taskError}</div>}
            <form onSubmit={handleUpdateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label>Title</label>
                <input className="input" value={editingTask.title} onChange={e => setEditingTask(t => ({ ...t, title: e.target.value }))} />
              </div>
              <div className="input-group">
                <label>Description</label>
                <textarea className="input" value={editingTask.description} onChange={e => setEditingTask(t => ({ ...t, description: e.target.value }))} rows={2} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label>Priority</label>
                  <select className="input" value={editingTask.priority} onChange={e => setEditingTask(t => ({ ...t, priority: e.target.value }))}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Status</label>
                  <select className="input" value={editingTask.status} onChange={e => setEditingTask(t => ({ ...t, status: e.target.value }))}>
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label>Due Date</label>
                  <input className="input" type="date" value={editingTask.dueDate || ''} onChange={e => setEditingTask(t => ({ ...t, dueDate: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label>Assign To</label>
                  <select className="input" value={editingTask.assigneeId || ''} onChange={e => setEditingTask(t => ({ ...t, assigneeId: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {members.map(m => <option key={m.user?._id} value={m.user?._id}>{m.user?.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingTask(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
