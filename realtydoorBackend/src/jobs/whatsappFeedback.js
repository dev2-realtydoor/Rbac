const cron = require('node-cron');
const prisma = require('../lib/prisma');
const { sendBuyerFeedbackRequest } = require('../lib/wati');
const logger = require('../lib/logger');

// Runs every hour.
// Fires WhatsApp buyer feedback bot 24h after site visit OTP verified (PRD §5 Leakage 1).
// If buyer says "Yes" but partner marked "Dropped", Admin gets a discrepancy alert.
function start() {
  cron.schedule('0 * * * *', async () => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    let leads;
    try {
      leads = await prisma.lead.findMany({
        where: {
          isOtpVerified: true,
          otpVerifiedAt: { lte: cutoff },
          whatsappSentAt: null,
          status: { not: 'DROPPED' },
        },
        include: { assignedPartner: { select: { name: true, companyName: true } } },
      });
    } catch (err) {
      logger.error('[WhatsAppFeedbackJob] DB query failed', { error: err.message, stack: err.stack });
      return;
    }

    if (!leads.length) return;

    logger.info(`[WhatsAppFeedbackJob] Processing ${leads.length} lead(s)`);

    for (const lead of leads) {
      try {
        const partnerName = lead.assignedPartner?.companyName
          || lead.assignedPartner?.name
          || 'your agent';

        await sendBuyerFeedbackRequest(lead.buyerPhone, partnerName);
        await prisma.lead.update({
          where: { id: lead.id },
          data: { whatsappSentAt: new Date() },
        });
        logger.info('[WhatsAppFeedbackJob] Feedback sent', { leadId: lead.id });
      } catch (err) {
        logger.error('[WhatsAppFeedbackJob] Failed for lead', {
          leadId: lead.id,
          error: err.message,
        });
      }
    }
  });

  logger.info('[Jobs] WhatsApp feedback job scheduled (every hour)');
}

module.exports = { start };
