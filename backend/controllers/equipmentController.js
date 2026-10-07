const prisma = require('../config/prisma');

// GET /api/equipment - List all equipment with filters
async function getAllEquipment(req, res, next) {
  try {
    const { category, condition, status, search } = req.query;

    const where = {};
    if (category) {
      where.category = category;
    }
    if (condition) {
      where.condition = condition;
    }
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    const items = await prisma.equipment.findMany({
      where,
      orderBy: { id: 'desc' },
    });

    res.json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/equipment/:id - Single equipment
async function getEquipmentById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);

    const item = await prisma.equipment.findUnique({
      where: { id },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found',
      });
    }

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/equipment - Create equipment
async function createEquipment(req, res, next) {
  try {
    const {
      name,
      category,
      quantity = 1,
      condition = 'EXCELLENT',
      status = 'AVAILABLE',
      purchaseDate,
      lastMaintenanceDate,
      nextMaintenanceDate,
      location,
      cost,
    } = req.body;

    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Equipment name and category are required',
      });
    }

    const item = await prisma.equipment.create({
      data: {
        name,
        category,
        quantity: parseInt(quantity, 10) || 1,
        condition,
        status,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        lastMaintenanceDate: lastMaintenanceDate ? new Date(lastMaintenanceDate) : null,
        nextMaintenanceDate: nextMaintenanceDate ? new Date(nextMaintenanceDate) : null,
        location,
        cost: cost ? parseFloat(cost) : null,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Equipment registered successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/equipment/:id - Update equipment
async function updateEquipment(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const {
      name,
      category,
      quantity,
      condition,
      status,
      purchaseDate,
      lastMaintenanceDate,
      nextMaintenanceDate,
      location,
      cost,
    } = req.body;

    const existing = await prisma.equipment.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found',
      });
    }

    const updated = await prisma.equipment.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(quantity !== undefined && { quantity: parseInt(quantity, 10) }),
        ...(condition && { condition }),
        ...(status && { status }),
        ...(purchaseDate !== undefined && { purchaseDate: purchaseDate ? new Date(purchaseDate) : null }),
        ...(lastMaintenanceDate !== undefined && {
          lastMaintenanceDate: lastMaintenanceDate ? new Date(lastMaintenanceDate) : null,
        }),
        ...(nextMaintenanceDate !== undefined && {
          nextMaintenanceDate: nextMaintenanceDate ? new Date(nextMaintenanceDate) : null,
        }),
        ...(location !== undefined && { location }),
        ...(cost !== undefined && { cost: cost ? parseFloat(cost) : null }),
      },
    });

    res.json({
      success: true,
      message: 'Equipment updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/equipment/:id - Delete equipment
async function deleteEquipment(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);

    const existing = await prisma.equipment.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found',
      });
    }

    await prisma.equipment.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Equipment deleted successfully',
      id,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
};
