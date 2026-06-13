const prisma = require('../../lib/prisma');
const ApiError = require('../../utils/ApiError');
const { createOrder } = require('../../lib/razorpay');

async function getAllServices() {
  return prisma.service.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
}

async function createServiceOrder(userId, serviceId) {
  const service = await prisma.service.findUnique({ where: { id: serviceId, isActive: true } });
  if (!service) throw new ApiError(404, 'Service not found');

  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1); // 1-year subscription

  const amountInPaise = Math.round(service.price * 100);
  const order = await createOrder(amountInPaise, `svc_${userId}_${serviceId}`);

  const subscription = await prisma.userSubscription.create({
    data: {
      userId,
      serviceId,
      razorpayOrderId: order.id,
      paymentStatus: 'PENDING',
      amountPaid: service.price,
      endDate,
    },
  });

  return { subscription, razorpayOrder: order, key: process.env.RAZORPAY_KEY_ID };
}

module.exports = { getAllServices, createServiceOrder };
