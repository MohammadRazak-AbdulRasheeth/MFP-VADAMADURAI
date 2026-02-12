import { sendWelcomeEmail } from './services/email.js';
import { sendWelcomeWhatsApp } from './services/whatsapp.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// .env is in ../.env because we are in server/ directory and .env is in root
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('--- ENV CHECK ---');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Loaded' : '❌ MISSING');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✅ Loaded' : '❌ MISSING (or incorrect logic)');

const member = {
    fullName: 'Test User',
    phone: '9677791674', // User provided number
    email: 'mohammadrazak@example.com', // Safe dummy
    packageType: 'YEARLY_GOLD',
    packageEnd: new Date(),
    balanceDue: 500
};

(async () => {
    console.log('\n--- TARGET INFO ---');
    console.log(`Sending to Phone: ${member.phone}`);

    console.log('\n--- TESTING WHATSAPP ---');
    try {
        const res = await sendWelcomeWhatsApp(member);
        console.log('WhatsApp Response:', res);
    } catch (err) {
        console.error('WhatsApp Error:', err);
    }

    console.log('\n--- TESTING EMAIL ---');
    try {
        const res = await sendWelcomeEmail(member);
        console.log('Email Response:', res);
    } catch (err) {
        console.error('Email Error:', err);
    }
})();
