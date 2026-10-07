const prisma = require('../config/prisma');

// GET /api/salaries/my-salaries - Trainer views their own salary records
async function getMySalaries(req, res, next) {
  try {
    if (!req.user.trainerId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only registered trainers can access personal salary records.',
      });
    }

    const salaries = await prisma.trainerSalary.findMany({
      where: { trainerId: req.user.trainerId },
      orderBy: { createdAt: 'desc' },
      include: {
        trainer: {
          select: { id: true, name: true, email: true, specialization: true },
        },
      },
    });

    res.json({
      success: true,
      count: salaries.length,
      data: salaries,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/salaries - Admin views all trainer salaries
async function getAllSalaries(req, res, next) {
  try {
    const { trainerId, status, month } = req.query;
    const where = {};

    if (trainerId) where.trainerId = parseInt(trainerId, 10);
    if (status) where.status = status;
    if (month) where.month = { contains: month, mode: 'insensitive' };

    const salaries = await prisma.trainerSalary.findMany({
      where,
      include: {
        trainer: {
          select: { id: true, name: true, email: true, specialization: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      count: salaries.length,
      data: salaries,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/salaries - Admin creates a new salary payout record
async function createSalaryRecord(req, res, next) {
  try {
    const { trainerId, amount, month, status = 'PENDING', paymentDate, notes } = req.body;

    if (!trainerId || !amount || !month) {
      return res.status(400).json({
        success: false,
        message: 'trainerId, amount, and month are required.',
      });
    }

    const newSalary = await prisma.trainerSalary.create({
      data: {
        trainerId: parseInt(trainerId, 10),
        amount: parseFloat(amount),
        month,
        status,
        paymentDate: paymentDate ? new Date(paymentDate) : (status === 'PAID' ? new Date() : null),
        notes,
      },
      include: {
        trainer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Trainer salary record generated successfully',
      data: newSalary,
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/salaries/:id - Admin updates status (e.g. mark Paid, Pending, Overdue)
async function updateSalaryStatus(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, paymentDate, notes, amount } = req.body;

    const salary = await prisma.trainerSalary.findUnique({ where: { id } });
    if (!salary) {
      return res.status(404).json({
        success: false,
        message: 'Salary record not found',
      });
    }

    const updateData = {};
    if (status) {
      updateData.status = status;
      if (status === 'PAID' && !paymentDate) {
        updateData.paymentDate = new Date();
      }
    }
    if (paymentDate !== undefined) {
      updateData.paymentDate = paymentDate ? new Date(paymentDate) : null;
    }
    if (notes !== undefined) updateData.notes = notes;
    if (amount !== undefined) updateData.amount = parseFloat(amount);

    const updated = await prisma.trainerSalary.update({
      where: { id },
      data: updateData,
      include: {
        trainer: {
          select: { id: true, name: true },
        },
      },
    });

    res.json({
      success: true,
      message: 'Salary status updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/salaries/:id - Admin only
async function deleteSalary(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.trainerSalary.delete({ where: { id } });
    res.json({
      success: true,
      message: 'Salary record deleted',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMySalaries,
  getAllSalaries,
  createSalaryRecord,
  updateSalaryStatus,
  deleteSalary,
};
