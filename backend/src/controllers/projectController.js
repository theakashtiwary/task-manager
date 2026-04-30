const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

// GET /api/projects
const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ 'members.user': req.user.id })
      .populate('members.user', 'name email')
      .sort({ updatedAt: -1 });

    // Attach task counts
    const projectsWithCounts = await Promise.all(
      projects.map(async (p) => {
        const taskCount = await Task.countDocuments({ project: p._id });
        const doneCount = await Task.countDocuments({ project: p._id, status: 'DONE' });
        return { ...p.toObject(), taskCount, doneCount };
      })
    );

    res.json({ projects: projectsWithCounts });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects
const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const project = await Project.create({
      name: name.trim(),
      description: (description || '').trim(),
      createdBy: req.user.id,
      members: [{ user: req.user.id, role: 'ADMIN' }]
    });

    const populated = await Project.findById(project._id).populate('members.user', 'name email');
    res.status(201).json({ project: populated });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:id
const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate('members.user', 'name email');
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isMember = project.members.some((m) => m.user._id.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Not a member' });

    const myRole = project.members.find((m) => m.user._id.toString() === req.user.id)?.role;
    res.json({ project, myRole });
  } catch (err) {
    next(err);
  }
};

// PUT /api/projects/:id  (admin)
const updateProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (description !== undefined) update.description = description.trim();

    const project = await Project.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
      .populate('members.user', 'name email');
    res.json({ project });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:id  (admin)
const deleteProject = async (req, res, next) => {
  try {
    await Task.deleteMany({ project: req.params.id });
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:id/members
const getMembers = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate('members.user', 'name email');
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ members: project.members });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:id/members  (admin) — body: { email, role? }
const addMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ error: 'User not found with that email' });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const already = project.members.some((m) => m.user.toString() === user._id.toString());
    if (already) return res.status(409).json({ error: 'User is already a member' });

    project.members.push({ user: user._id, role: role || 'MEMBER' });
    await project.save();

    const populated = await Project.findById(project._id).populate('members.user', 'name email');
    res.status(201).json({ members: populated.members });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:id/members/:userId  (admin)
const removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const memberIdx = project.members.findIndex((m) => m.user.toString() === req.params.userId);
    if (memberIdx === -1) return res.status(404).json({ error: 'Member not found' });

    // Prevent removing yourself if you're the only admin
    const admins = project.members.filter((m) => m.role === 'ADMIN');
    if (admins.length === 1 && admins[0].user.toString() === req.params.userId) {
      return res.status(400).json({ error: 'Cannot remove the only admin' });
    }

    project.members.splice(memberIdx, 1);
    await project.save();

    // Also unassign tasks from removed member
    await Task.updateMany(
      { project: project._id, assignee: req.params.userId },
      { assignee: null }
    );

    const populated = await Project.findById(project._id).populate('members.user', 'name email');
    res.json({ members: populated.members });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProjects, createProject, getProject, updateProject, deleteProject,
  getMembers, addMember, removeMember
};
