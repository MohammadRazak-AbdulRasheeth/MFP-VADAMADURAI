import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('--- SendGrid Test Script ---');

const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL;

console.log(`API Key Exists: ${apiKey ? 'YES' : 'NO'}`);
if (apiKey) {
    console.log(`API Key Length: ${apiKey.length}`);
    console.log(`API Key Preview: ${apiKey.substring(0, 5)}...`);
}
console.log(`From Email: ${fromEmail}`);

if (!apiKey || !fromEmail) {
    console.error('❌ ERROR: Missing SENDGRID_API_KEY or SENDGRID_FROM_EMAIL in .env');
    process.exit(1);
}

sgMail.setApiKey(apiKey);

const msg = {
    to: 'test_recipient@example.com', // We will replace this or just let it fail/bounce safely, or user checks logs
    from: fromEmail,
    subject: 'Test Email from Gym App Debugger',
    text: 'If you receive this, SendGrid is working correctly!',
    html: '<strong>If you receive this, SendGrid is working correctly!</strong>',
};

// We'll just try to send to the FROM email itself to be safe and verify connection
msg.to = fromEmail;

console.log(`\nAttempting to send test email to ${msg.to}...`);

sgMail
    .send(msg)
    .then(() => {
        console.log('✅ Email sent successfully!');
    })
    .catch((error) => {
        console.error('❌ Error sending email:');
        console.error(error);
        if (error.response) {
            console.error('SendGrid Response Body:', JSON.stringify(error.response.body, null, 2));
        }
    });
