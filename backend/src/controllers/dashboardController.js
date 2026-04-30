const Project = require('../models/Project');
const Task = require('../models/Task');

// GET /api/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get all projects user is a member of
    const projects = await Project.find({ 'members.user': userId })
      .populate('members.user', 'name email')
      .sort({ updatedAt: -1 });

    const projectIds = projects.map((p) => p._id);

    // Get all tasks across user's projects
    const allTasks = await Task.find({ project: { $in: projectIds } })
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // My tasks (assigned to me)
    const myTasks = allTasks.filter((t) => t.assignee && t.assignee._id.toString() === userId);

    // Stats
    const totalTasks = allTasks.length;
    const todoCount = allTasks.filter((t) => t.status === 'TODO').length;
    const inProgressCount = allTasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const doneCount = allTasks.filter((t) => t.status === 'DONE').length;

    const now = new Date();
    const overdueTasks = allTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
    );

    // Recent tasks (last 10)
    const recentTasks = allTasks.slice(0, 10);

    res.json({
      stats: {
        totalProjects: projects.length,
        totalTasks,
        todo: todoCount,
        inProgress: inProgressCount,
        done: doneCount,
        overdue: overdueTasks.length,
        myTasks: myTasks.length
      },
      recentTasks,
      overdueTasks: overdueTasks.slice(0, 10),
      projects: projects.slice(0, 5)
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };
