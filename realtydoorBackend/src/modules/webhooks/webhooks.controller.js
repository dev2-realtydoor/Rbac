const { verifyWebhookSignature } = require('../../lib/razorpay');
const { confirmPayment } = require('../escrow/escrow.service');
const prisma = require('../../lib/prisma');
const { sendServiceActivated, sendEscrowPaymentFailed } = require('../../lib/email');
const { createNotification } = require('../../lib/notifications');
const logger = require('../../lib/logger');

async function razorpay(req, res) {
  const signature = req.headers['x-razorpay-signature'];

  if (!verifyWebhookSignature(req.rawBody, signature)) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const { event, payload } = req.body;

  try {
    if (event === 'payment.captured') {
      const { order_id: orderId, id: paymentId } = payload.payment.entity;

      // Route: escrow payment
      const escrow = await prisma.escrowTransaction.findUnique({ where: { razorpayOrderId: orderId } });
      if (escrow) {
        await confirmPayment(orderId, paymentId);
        return res.json({ status: 'ok' });
      }

      // Route: service subscription payment
      const subscription = await prisma.userSubscription.findUnique({ where: { razorpayOrderId: orderId } });
      if (subscription) {
        // Idempotency: skip if already processed
        if (subscription.paymentStatus === 'SUCCESS') return res.json({ status: 'ok' });

        const now = new Date();
        const endDate = new Date(now);
        endDate.setFullYear(endDate.getFullYear() + 1);

        await prisma.userSubscription.update({
          where: { razorpayOrderId: orderId },
          data: {
            paymentStatus: 'SUCCESS',
            razorpayPaymentId: paymentId,
            startDate: now,
            endDate,
          },
        });

        const service = await prisma.service.findUnique({ where: { id: subscription.serviceId } });
        await prisma.serviceTicket.create({
          data: {
            userId: subscription.userId,
            subscriptionId: subscription.id,
            subject: `${service?.name} — Initial Setup`,
            description: 'Service activated. Admin will coordinate.',
            status: 'OPEN',
          },
        });

        await createNotification({
          userId: subscription.userId,
          title: 'Service Activated',
          message: `Your ${service?.name} service is now active.`,
          type: 'SERVICE_ACTIVATED',
          linkUrl: '/dashboard/services',
        });

        const user = await prisma.user.findUnique({ where: { id: subscription.userId } });
        if (user && service) sendServiceActivated(user.email, service.name).catch(() => {});
      }
    }

    if (event === 'payment.failed') {
      const { order_id: orderId } = payload.payment.entity;

      const escrow = await prisma.escrowTransaction.findUnique({ where: { razorpayOrderId: orderId } });
      if (escrow) {
        await prisma.escrowTransaction.update({
          where: { razorpayOrderId: orderId },
          data: { status: 'FAILED', failedAt: new Date() },
        });

        await createNotification({
          userId: escrow.buyerId,
          title: 'Token Advance Payment Failed',
          message: 'Your token advance payment could not be processed. Please retry from your dashboard.',
          type: 'PAYMENT_FAILED',
          linkUrl: '/dashboard/leads',
        });

        const buyer = await prisma.user.findUnique({ where: { id: escrow.buyerId }, select: { email: true } });
        if (buyer) sendEscrowPaymentFailed(buyer.email).catch(() => {});

        return res.json({ status: 'ok' });
      }

      const failedSub = await prisma.userSubscription.findUnique({ where: { razorpayOrderId: orderId } });
      if (failedSub) {
        await prisma.userSubscription.update({
          where: { razorpayOrderId: orderId },
          data: { paymentStatus: 'FAILED' },
        });
        await createNotification({
          userId: failedSub.userId,
          title: 'Service Payment Failed',
          message: 'Your service subscription payment could not be processed. Please retry from your dashboard.',
          type: 'PAYMENT_FAILED',
          linkUrl: '/dashboard/services',
        });
      }
    }

    if (event === 'refund.created') {
      const { payment_id: paymentId, id: refundId, amount } = payload.refund.entity;
      const amountRupees = `₹${(amount / 100).toLocaleString('en-IN')}`;

      const escrow = await prisma.escrowTransaction.findFirst({ where: { razorpayPaymentId: paymentId } });
      if (escrow && escrow.status !== 'REFUNDED') {
        await prisma.escrowTransaction.update({
          where: { id: escrow.id },
          data: { status: 'REFUNDED', razorpayRefundId: refundId, refundedAt: new Date() },
        });
        await createNotification({
          userId: escrow.buyerId,
          title: 'Token Advance Refunded',
          message: `Your token advance of ${amountRupees} has been refunded.`,
          type: 'PAYMENT_REFUNDED',
          linkUrl: '/dashboard/leads',
        });
      }

      const subscription = await prisma.userSubscription.findFirst({ where: { razorpayPaymentId: paymentId } });
      if (subscription && subscription.paymentStatus !== 'REFUNDED') {
        await prisma.userSubscription.update({
          where: { id: subscription.id },
          data: { paymentStatus: 'REFUNDED' },
        });
        await createNotification({
          userId: subscription.userId,
          title: 'Service Payment Refunded',
          message: `Your service subscription payment of ${amountRupees} has been refunded.`,
          type: 'PAYMENT_REFUNDED',
          linkUrl: '/dashboard/services',
        });
      }
    }

    if (event === 'transfer.settled') {
      const { id: transferId } = payload.transfer.entity;
      const escrow = await prisma.escrowTransaction.findFirst({ where: { razorpayTransferId: transferId } });
      if (escrow) {
        logger.info('[RazorpayWebhook] Escrow transfer settled', { transferId, escrowId: escrow.id });
        await createNotification({
          userId: escrow.buyerId,
          title: 'Token Advance Transferred to Seller',
          message: 'The token advance for your property deal has been successfully transferred to the seller.',
          type: 'ESCROW_RELEASED',
          linkUrl: '/dashboard/leads',
        });
      }
    }
  } catch (err) {
    logger.error('[RazorpayWebhook] Error processing event', { event, error: err.message });
  }

  res.json({ status: 'ok' });
}

module.exports = { razorpay };
