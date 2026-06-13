const { Webhook } = require('svix');
const prisma = require('../../lib/prisma');
const logger = require('../../lib/logger');
const { setUserRole } = require('../../lib/clerkAdmin');

async function clerkWebhook(req, res) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    logger.error('[ClerkWebhook] CLERK_WEBHOOK_SECRET not set');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  const svixId        = req.headers['svix-id'];
  const svixTimestamp = req.headers['svix-timestamp'];
  const svixSignature = req.headers['svix-signature'];

  if (!svixId || !svixTimestamp || !svixSignature) {
    return res.status(400).json({ error: 'Missing svix headers' });
  }

  let evt;
  try {
    const wh = new Webhook(secret);
    evt = wh.verify(req.rawBody.toString(), {
      'svix-id':        svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  } catch (err) {
    logger.warn('[ClerkWebhook] Invalid signature', { error: err.message });
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const { type, data } = evt;
  logger.info('[ClerkWebhook] Received event', { type, clerkId: data.id });

  try {
    if (type === 'user.created') {
      const email = data.email_addresses?.[0]?.email_address;
      const name  = [data.first_name, data.last_name].filter(Boolean).join(' ') || email;
      const phone = data.phone_numbers?.[0]?.phone_number || null;

      await prisma.user.upsert({
        where:  { clerkId: data.id },
        create: { clerkId: data.id, name, email, phone, profileImageUrl: data.image_url || null, role: 'USER' },
        update: {},  // already exists — don't overwrite role or other fields
      });

      // Stamp default role in Clerk publicMetadata so JWT Template can include it
      await setUserRole(data.id, 'USER').catch((err) =>
        logger.warn('[ClerkWebhook] setUserRole failed', { clerkId: data.id, error: err.message })
      );

      logger.info('[ClerkWebhook] user.created synced', { clerkId: data.id, email });
    }

    if (type === 'user.updated') {
      const email = data.email_addresses?.[0]?.email_address;
      const name  = [data.first_name, data.last_name].filter(Boolean).join(' ') || email;

      await prisma.user.upsert({
        where:  { clerkId: data.id },
        create: { clerkId: data.id, name, email, profileImageUrl: data.image_url || null, role: 'USER' },
        update: { name, email, profileImageUrl: data.image_url || null },
      });
      logger.info('[ClerkWebhook] user.updated synced', { clerkId: data.id });
    }

    if (type === 'user.deleted') {
      const user = await prisma.user.findUnique({ where: { clerkId: data.id } });
      if (user) {
        await prisma.user.delete({ where: { id: user.id } });
        logger.info('[ClerkWebhook] user.deleted synced', { clerkId: data.id });
      }
    }
  } catch (err) {
    logger.error('[ClerkWebhook] DB sync failed', { type, clerkId: data.id, error: err.message });
  }

  res.json({ status: 'ok' });
}

module.exports = { clerkWebhook };
