const cron = require('node-cron');
const prisma = require('../lib/prisma');
const { sendBuyerFeedbackRequest } = require('../lib/wati');
const logger = require('../lib/logger');

// Runs every hour.
// Sends a second WhatsApp nudge 7 days after the buyer replied STILL_DECIDING (Appendix C.4).
function start() {
  cron.schedule('0 * * * *', async () => {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    let leads;
    try {
      leads = await prisma.lead.findMany({
        where: {
          buyerFeedbackStatus: 'STILL_DECIDING',
          feedbackReceivedAt: { not: null, lte: cutoff },
          secondFollowupSentAt: null,
          status: { notIn: ['DROPPED', 'CLOSED'] },
        },
        include: { assignedPartner: { select: { name: true, companyName: true } } },
      });
    } catch (err) {
      logger.error('[StillDecidingJob] DB query failed', { error: err.message, stack: err.stack });
      return;
    }

    if (!leads.length) return;

    logger.info(`[StillDecidingJob] Processing ${leads.length} lead(s)`);

    for (const lead of leads) {
      try {
        const partnerName = lead.assignedPartner?.companyName
          || lead.assignedPartner?.name
          || 'your agent';

        await sendBuyerFeedbackRequest(lead.buyerPhone, partnerName);
        await prisma.lead.update({
          where: { id: lead.id },
          data: { secondFollowupSentAt: new Date() },
        });
        logger.info('[StillDecidingJob] Follow-up sent', { leadId: lead.id });
      } catch (err) {
        logger.error('[StillDecidingJob] Failed for lead', {
          leadId: lead.id,
          error: err.message,
        });
      }
    }
  });

  logger.info('[Jobs] STILL_DECIDING 7-day follow-up job scheduled (every hour)');
}

module.exports = { start };
