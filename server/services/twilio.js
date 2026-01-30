import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

let client = null;

// Initialize client only if credentials are present
if (accountSid && authToken && accountSid !== 'your_account_sid') {
  client = twilio(accountSid, authToken);
}

export async function sendSMS(to, message) {
  if (!client) {
    console.warn('Twilio not configured - SMS would be sent to:', to);
    return {
      success: false,
      error: 'Twilio not configured',
      sid: null
    };
  }

  try {
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: to
    });

    return {
      success: true,
      sid: result.sid,
      status: result.status
    };
  } catch (error) {
    console.error('Twilio SMS error:', error.message);
    return {
      success: false,
      error: error.message,
      sid: null
    };
  }
}

export function formatCallNotification(customerName, customerPhone, loggedByName, notes) {
  let message = `Call from ${customerName}`;
  if (customerPhone) {
    message += ` (${customerPhone})`;
  }
  message += ` logged by ${loggedByName}.`;
  if (notes) {
    message += ` Notes: ${notes.substring(0, 100)}${notes.length > 100 ? '...' : ''}`;
  }
  return message;
}
