const Task = require('../models/Task');
const Project = require('../models/Project');

// GET /api/projects/:id/tasks
const getTasks = async (req, res, next) => {
  try {
    const projectId = req.params.id;

    // Verify membership
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const isMember = project.members.some((m) => m.user.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Not a member' });

    const tasks = await Task.find({ project: projectId })
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:id/tasks
const createTask = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    // Verify membership
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const isMember = project.members.some((m) => m.user.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Not a member' });

    // Validate assignee is a member
    if (assigneeId) {
      const assigneeIsMember = project.members.some((m) => m.user.toString() === assigneeId);
      if (!assigneeIsMember) return res.status(400).json({ error: 'Assignee must be a project member' });
    }

    const task = await Task.create({
      title: title.trim(),
      description: (description || '').trim(),
      status: status || 'TODO',
      priority: priority || 'MEDIUM',
      dueDate: dueDate || null,
      project: projectId,
      assignee: assigneeId || null,
      createdBy: req.user.id
    });

    const populated = await Task.findById(task._id)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json({ task: populated });
  } catch (err) {
    next(err);
  }
};

// PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Verify membership in the task's project
    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const member = project.members.find((m) => m.user.toString() === req.user.id);
    if (!member) return res.status(403).json({ error: 'Not a member' });

    const { title, description, status, priority, dueDate, assigneeId } = req.body;
    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (assigneeId !== undefined) {
      if (assigneeId) {
        const assigneeIsMember = project.members.some((m) => m.user.toString() === assigneeId);
        if (!assigneeIsMember) return res.status(400).json({ error: 'Assignee must be a project member' });
      }
      task.assignee = assigneeId || null;
    }

    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email');

    res.json({ task: populated });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/tasks/:id/status
const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status || !['TODO', 'IN_PROGRESS', 'DONE'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be TODO, IN_PROGRESS, or DONE' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const isMember = project.members.some((m) => m.user.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Not a member' });

    task.status = status;
    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email');

    res.json({ task: populated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const member = project.members.find((m) => m.user.toString() === req.user.id);
    if (!member) return res.status(403).json({ error: 'Not a member' });

    // Only admin or task creator can delete
    if (member.role !== 'ADMIN' && task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only admin or task creator can delete' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTasks, createTask, updateTask, updateTaskStatus, deleteTask };
