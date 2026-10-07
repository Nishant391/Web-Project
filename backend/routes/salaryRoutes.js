const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');
const { requireAuth, requireRole } = require('../middleware/clerkAuth');

// Trainer views own salary history
router.get('/my-salaries', requireAuth, requireRole('TRAINER'), salaryController.getMySalaries);

// Admin controls and views all trainer salaries
router.get('/', requireAuth, requireRole('ADMIN'), salaryController.getAllSalaries);
router.post('/', requireAuth, requireRole('ADMIN'), salaryController.createSalaryRecord);
router.put('/:id', requireAuth, requireRole('ADMIN'), salaryController.updateSalaryStatus);
router.delete('/:id', requireAuth, requireRole('ADMIN'), salaryController.deleteSalary);

module.exports = router;
