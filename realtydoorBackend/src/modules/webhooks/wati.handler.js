const prisma = require('../../lib/prisma');
const logger = require('../../lib/logger');

const KEYWORD_MAP = {
  '1': 'INTERESTED',
  'yes': 'INTERESTED',
  'interested': 'INTERESTED',
  '2': 'NOT_INTERESTED',
  'no': 'NOT_INTERESTED',
  'not interested': 'NOT_INTERESTED',
  '3': 'STILL_DECIDING',
  'maybe': 'STILL_DECIDING',
  'still deciding': 'STILL_DECIDING',
};

function parseStatus(text) {
  const normalized = (text || '').trim().toLowerCase();
  return KEYWORD_MAP[normalized] ?? null;
}

async function watiWebhook(req, res) {
  const token = process.env.WATI_WEBHOOK_TOKEN;
  if (token && req.headers['x-wati-token'] !== token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { waId, text } = req.body || {};
    if (!waId || !text) return res.json({ status: 'ignored' });

    const status = parseStatus(text);
    if (!status) return res.json({ status: 'ignored' });

    // Normalize to E.164 — WATI sends without leading +
    const phone = waId.startsWith('+') ? waId : `+${waId}`;

    const lead = await prisma.lead.findFirst({
      where: {
        buyerPhone: phone,
        whatsappSentAt: { not: null },
        feedbackReceivedAt: null,
      },
      orderBy: { whatsappSentAt: 'desc' },
    });

    if (!lead) return res.json({ status: 'no_matching_lead' });

    await prisma.lead.update({
      where: { id: lead.id },
      data: { buyerFeedbackStatus: status, feedbackReceivedAt: new Date() },
    });

    logger.info('[watiWebhook] buyer feedback recorded', { leadId: lead.id, phone, status });
    return res.json({ status: 'ok' });
  } catch (err) {
    logger.error('[watiWebhook] error', { error: err.message });
    return res.status(500).json({ error: 'Internal error' });
  }
}

module.exports = { watiWebhook };
