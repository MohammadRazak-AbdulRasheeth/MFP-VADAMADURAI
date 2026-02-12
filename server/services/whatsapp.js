import twilio from 'twilio';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Default sandbox number

let client;

if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
} else {
    console.warn('⚠️ TWILIO credentials missing in .env. WhatsApp features will be disabled.');
}

const formatPhoneNumber = (phone) => {
    // Ensure phone has country code. Assuming Indian numbers +91 if missing
    let cleanPhone = phone.replace(/\D/g, ''); // Remove non-digits
    if (cleanPhone.length === 10) {
        cleanPhone = '91' + cleanPhone;
    }
    return `whatsapp:+${cleanPhone}`;
};

const sendWhatsApp = async (to, body) => {
    if (!client) {
        console.warn('⚠️ Skipping WhatsApp: No Twilio Client configured.');
        return { success: false, error: 'No Client' };
    }

    try {
        const formattedTo = formatPhoneNumber(to);
        const message = await client.messages.create({
            body: body,
            from: fromNumber,
            to: formattedTo
        });
        console.log(`📲 WhatsApp sent to ${to} (SID: ${message.sid})`);
        return { success: true, sid: message.sid };
    } catch (error) {
        console.error(`❌ Failed to send WhatsApp to ${to}:`, error.message);
        return { success: false, error: error.message };
    }
};

export const sendWelcomeWhatsApp = async (member) => {
    const body = `🎉 *Welcome to MFP Vadamadurai, ${member.fullName}!* 🚀

We are not just a gym, we are a family! Get ready to crush your fitness goals. 💪

*Your Membership Details:*
📌 Plan: ${member.packageType.replace('_', ' ')}
📅 Expires: ${new Date(member.packageEnd).toLocaleDateString()}

Need help? Ask us at the reception.
Let's get started! 🔥`;

    return sendWhatsApp(member.phone, body);
};

export const sendExpiryReminderWhatsApp = async (member, daysLeft) => {
    const body = `⏰ *Membership Expiring Soon!*

Hi ${member.fullName},
Your gym membership expires in *${daysLeft} days* (${new Date(member.packageEnd).toLocaleDateString()}).

Don't let your progress stop! 🛑
Visit the gym to renew today. 💪`;

    return sendWhatsApp(member.phone, body);
};

export const sendPaymentDueWhatsApp = async (member) => {
    const body = `🔔 *Payment Reminder*

Hi ${member.fullName},
This is a gentle reminder that you have a pending balance of *₹${member.balanceDue.toLocaleString()}*.

Please clear your dues to ensure uninterrupted access. Thanks! 🙏`;

    return sendWhatsApp(member.phone, body);
};
