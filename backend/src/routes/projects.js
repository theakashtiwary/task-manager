const router = require('express').Router();
const auth = require('../middleware/auth');
const { requireProjectAdmin, requireProjectMember } = require('../middleware/rbac');
const {
  getProjects, createProject, getProject, updateProject, deleteProject,
  getMembers, addMember, removeMember
} = require('../controllers/projectController');
const { getTasks, createTask } = require('../controllers/taskController');

router.use(auth);

router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProject);
router.put('/:id', requireProjectAdmin, updateProject);
router.delete('/:id', requireProjectAdmin, deleteProject);

// Members
router.get('/:id/members', requireProjectMember, getMembers);
router.post('/:id/members', requireProjectAdmin, addMember);
router.delete('/:id/members/:userId', requireProjectAdmin, removeMember);

// Tasks (nested under project)
router.get('/:id/tasks', getTasks);
router.post('/:id/tasks', createTask);

module.exports = router;
