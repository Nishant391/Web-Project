const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { requireAuth, requireRole } = require('../middleware/clerkAuth');

// Equipment Routes
router.get('/', requireAuth, equipmentController.getAllEquipment);
router.get('/:id', requireAuth, equipmentController.getEquipmentById);
router.post('/', requireAuth, requireRole('ADMIN'), equipmentController.createEquipment);
router.put('/:id', requireAuth, requireRole('ADMIN', 'TRAINER'), equipmentController.updateEquipment);
router.delete('/:id', requireAuth, requireRole('ADMIN'), equipmentController.deleteEquipment);

module.exports = router;
