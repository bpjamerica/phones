import { Router } from 'express';
import { smsLog } from '../db/queries.js';
import { requireAuth } from '../services/auth.js';

const router = Router();

// Get SMS history
router.get('/', requireAuth, (req, res) => {
  const { limit } = req.query;

  try {
    const history = smsLog.getAll({ limit: limit ? parseInt(limit) : 100 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Twilio webhook for status updates (no auth required)
router.post('/webhook', (req, res) => {
  const { MessageSid, MessageStatus } = req.body;

  if (MessageSid && MessageStatus) {
    try {
      smsLog.updateStatus(MessageSid, MessageStatus);
    } catch (error) {
      console.error('SMS webhook error:', error);
    }
  }

  res.sendStatus(200);
});

// Twilio webhook for incoming SMS (replies) - no auth required
router.post('/incoming', (req, res) => {
  const { From, Body } = req.body;

  console.log(`Incoming SMS from ${From}: ${Body}`);

  if (From && Body) {
    try {
      // Normalize phone number (remove any formatting)
      const phone = From.replace(/[^\d+]/g, '');
      const result = smsLog.acknowledgeByPhone(phone, Body);

      if (result) {
        console.log(`Acknowledged SMS for call ${result.call_id}`);
      } else {
        console.log(`No unacknowledged SMS found for phone ${phone}`);
      }
    } catch (error) {
      console.error('Incoming SMS error:', error);
    }
  }

  // Respond with empty TwiML (no auto-reply)
  res.type('text/xml');
  res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
});

export default router;
