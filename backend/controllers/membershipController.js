const prisma = require('../config/prisma');

// GET /api/memberships - Get all membership plans
async function getAllMemberships(req, res, next) {
  try {
    const { status } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }

    const memberships = await prisma.membership.findMany({
      where,
      include: {
        _count: {
          select: {
            members: true,
            payments: true,
          },
        },
      },
      orderBy: { price: 'asc' },
    });

    res.json({
      success: true,
      count: memberships.length,
      data: memberships,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/memberships/:id - Get single membership with members
async function getMembershipById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);

    const membership = await prisma.membership.findUnique({
      where: { id },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            joinDate: true,
          },
        },
        _count: {
          select: {
            payments: true,
          },
        },
      },
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Membership plan not found',
      });
    }

    res.json({
      success: true,
      data: membership,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/memberships - Create new membership plan
async function createMembership(req, res, next) {
  try {
    const { name, description, price, durationInDays, features, status = 'ACTIVE' } = req.body;

    if (!name || price === undefined || !durationInDays) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, and durationInDays are required',
      });
    }

    const newPlan = await prisma.membership.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        durationInDays: parseInt(durationInDays, 10),
        features: typeof features === 'string' ? features : (features || []).join(', '),
        status,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Membership plan created successfully',
      data: newPlan,
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/memberships/:id - Update membership plan
async function updateMembership(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, description, price, durationInDays, features, status } = req.body;

    const existing = await prisma.membership.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Membership plan not found',
      });
    }

    const updated = await prisma.membership.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(durationInDays !== undefined && { durationInDays: parseInt(durationInDays, 10) }),
        ...(features !== undefined && {
          features: typeof features === 'string' ? features : (features || []).join(', '),
        }),
        ...(status && { status }),
      },
    });

    res.json({
      success: true,
      message: 'Membership plan updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/memberships/:id - Delete membership plan
async function deleteMembership(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);

    const existing = await prisma.membership.findUnique({
      where: { id },
      include: { _count: { select: { members: true } } },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Membership plan not found',
      });
    }

    if (existing._count.members > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete plan with ${existing._count.members} active member(s). Reassign them first or mark plan INACTIVE.`,
      });
    }

    await prisma.membership.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Membership plan deleted successfully',
      id,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllMemberships,
  getMembershipById,
  createMembership,
  updateMembership,
  deleteMembership,
};
