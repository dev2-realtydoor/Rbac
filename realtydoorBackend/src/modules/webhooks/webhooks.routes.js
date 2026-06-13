const express = require('express');
const router  = express.Router();
const ctrl    = require('./webhooks.controller');
const { clerkWebhook } = require('./clerk.handler');

// Both routes use express.raw() — safe because this router is mounted in app.js
// BEFORE express.json(), so the stream has not been consumed yet.

const rawBody = (req, res, next) => {
  express.raw({ type: 'application/json' })(req, res, () => {
    try {
      req.rawBody = req.body;
      req.body    = JSON.parse(req.body.toString());
      next();
    } catch {
      res.status(400).json({ error: 'Invalid JSON in webhook body' });
    }
  });
};

router.post('/razorpay', rawBody, ctrl.razorpay);
router.post('/clerk',    rawBody, clerkWebhook);

module.exports = router;
