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

export default router;
