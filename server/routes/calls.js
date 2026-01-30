import { Router } from 'express';
import { calls, smsLog, reps } from '../db/queries.js';
import { sendSMS, formatCallNotification } from '../services/twilio.js';
import { requireAuth } from '../services/auth.js';

const router = Router();

// Get all calls with optional filters
router.get('/', requireAuth, (req, res) => {
  const { startDate, endDate, customerRepId, grouped } = req.query;

  try {
    if (grouped === 'true') {
      const result = calls.getGroupedByRep({ startDate, endDate });
      // Group by rep
      const grouped = {};
      result.forEach(call => {
        if (!grouped[call.rep_id]) {
          grouped[call.rep_id] = {
            repId: call.rep_id,
            repName: call.customer_rep_name,
            calls: []
          };
        }
        grouped[call.rep_id].calls.push(call);
      });
      res.json(Object.values(grouped));
    } else {
      const result = calls.getAll({ startDate, endDate, customerRepId });
      res.json(result);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single call
router.get('/:id', requireAuth, (req, res) => {
  try {
    const call = calls.getById(req.params.id);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    // Get SMS history for this call
    const smsHistory = smsLog.getByCallId(req.params.id);
    res.json({ ...call, smsHistory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Log a new call
router.post('/', requireAuth, async (req, res) => {
  const { customer_rep_id, customer_name, customer_phone, notes, send_sms } = req.body;
  const logged_by_rep_id = req.session.user.id;

  if (!customer_rep_id || !customer_name) {
    return res.status(400).json({ error: 'Customer rep and customer name are required' });
  }

  try {
    // Create the call
    const call = calls.create({
      logged_by_rep_id,
      customer_rep_id,
      customer_name,
      customer_phone,
      notes
    });

    let smsResult = null;

    // Send SMS if requested
    if (send_sms) {
      const customerRep = reps.getById(customer_rep_id);
      const loggedByRep = reps.getById(logged_by_rep_id);

      if (customerRep && customerRep.phone) {
        const message = formatCallNotification(
          customer_name,
          customer_phone,
          loggedByRep.name,
          notes
        );

        const result = await sendSMS(customerRep.phone, message);

        // Log the SMS
        smsLog.create({
          call_id: call.id,
          to_rep_id: customer_rep_id,
          message,
          twilio_sid: result.sid,
          status: result.success ? (result.status || 'sent') : 'failed'
        });

        smsResult = result;
      }
    }

    // Return the created call with details
    const createdCall = calls.getById(call.id);
    res.status(201).json({ ...createdCall, smsResult });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
