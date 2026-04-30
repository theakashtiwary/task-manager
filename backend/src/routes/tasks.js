const router = require('express').Router();
const auth = require('../middleware/auth');
const { updateTask, updateTaskStatus, deleteTask } = require('../controllers/taskController');

router.use(auth);

router.put('/:id', updateTask);
router.patch('/:id/status', updateTaskStatus);
router.delete('/:id', deleteTask);

module.exports = router;
