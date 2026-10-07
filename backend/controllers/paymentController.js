const prisma = require('../config/prisma');

// GET /api/payments - List payments with strict role boundaries
async function getAllPayments(req, res, next) {
  try {
    const userRole = req.user.role;

    if (userRole === 'TRAINER') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Coaches cannot inspect gym fee collection ledgers.',
      });
    }

    const { status, membershipId } = req.query;
    const where = {};

    if (userRole === 'MEMBER') {
      where.memberId = req.user.memberId;
    }

    if (status) where.status = status;
    if (membershipId) where.membershipId = parseInt(membershipId, 10);

    const payments = await prisma.payment.findMany({
      where,
      include: {
        member: {
          select: { id: true, name: true, email: true },
        },
        membership: {
          select: { id: true, name: true, price: true },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    res.json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/payments/stats - Admin only financial summary
async function getPaymentStats(req, res, next) {
  try {
    const [completed, pending, totalCount] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.payment.count(),
    ]);

    res.json({
      success: true,
      data: {
        totalRevenue: completed._sum.amount || 0,
        pendingRevenue: pending._sum.amount || 0,
        pendingCount: pending._count.id || 0,
        totalTransactions: totalCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/payments/:id - Get payment receipt (IDOR Protected)
async function getPaymentById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const userRole = req.user.role;

    if (userRole === 'TRAINER') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Coaches cannot view client financial invoices.',
      });
    }

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        member: true,
        membership: true,
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment invoice not found',
      });
    }

    if (userRole === 'MEMBER' && payment.memberId !== req.user.memberId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot inspect another member’s payment receipt.',
      });
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/payments - Admin records payment receipt
async function createPayment(req, res, next) {
  try {
    const { memberId, membershipId, amount, paymentMethod, status = 'COMPLETED', notes } = req.body;

    if (!memberId || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'memberId, amount, and paymentMethod are required',
      });
    }

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

    const newPayment = await prisma.payment.create({
      data: {
        memberId: parseInt(memberId, 10),
        membershipId: membershipId ? parseInt(membershipId, 10) : null,
        amount: parseFloat(amount),
        paymentMethod,
        status,
        invoiceNumber,
        notes,
      },
      include: {
        member: { select: { id: true, name: true, email: true } },
        membership: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Payment transaction logged successfully',
      data: newPayment,
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/payments/:id/status - Admin only
async function updatePaymentStatus(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const updated = await prisma.payment.update({
      where: { id },
      data: { status },
    });

    res.json({
      success: true,
      message: 'Payment status updated',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllPayments,
  getPaymentStats,
  getPaymentById,
  createPayment,
  updatePaymentStatus,
};
