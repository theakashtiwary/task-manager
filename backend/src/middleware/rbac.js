const Project = require('../models/Project');

const requireProjectAdmin = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.params.projectId;
    const userId = req.user.id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const member = project.members.find(
      (m) => m.user.toString() === userId
    );
    if (!member) {
      return res.status(403).json({ error: 'You are not a member of this project' });
    }
    if (member.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.project = project;
    req.memberRole = member.role;
    next();
  } catch (err) {
    next(err);
  }
};

const requireProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.params.projectId;
    const userId = req.user.id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const member = project.members.find(
      (m) => m.user.toString() === userId
    );
    if (!member) {
      return res.status(403).json({ error: 'You are not a member of this project' });
    }

    req.project = project;
    req.memberRole = member.role;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireProjectAdmin, requireProjectMember };
