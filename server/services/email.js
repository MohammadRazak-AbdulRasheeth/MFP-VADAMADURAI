import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Set API Key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('⚠️ SENDGRID_API_KEY is missing in .env');
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@mfpvadamadurai.com';

// Helper to send email
const sendEmail = async (to, subject, html) => {
  const msg = {
    to,
    from: FROM_EMAIL,
    subject,
    html,
  };

  try {
    await sgMail.send(msg);
    console.log(`✉️ Email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    if (error.response) {
      console.error(error.response.body);
    }
    return { success: false, error: error.message };
  }
};

// Send expiry reminder email
export const sendExpiryReminder = async (member, daysLeft) => {
  const subject = `⏰ Gym Membership Expiring in ${daysLeft} Days`;
  const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🏋️ GymPro</h1>
        </div>
        <div style="padding: 30px; background: #f8fafc;">
          <h2>Hi ${member.fullName}!</h2>
          <p>This is a friendly reminder that your gym membership is expiring in <strong>${daysLeft} days</strong>.</p>
          
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p><strong>Package:</strong> ${member.packageType.replace('_', ' ')}</p>
            <p><strong>Expires:</strong> ${new Date(member.packageEnd).toLocaleDateString()}</p>
          </div>
          
          <p>Don't let your fitness journey pause! Visit the gym today to renew your membership and continue achieving your goals 💪</p>
          
          <a href="#" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            Renew Now
          </a>
        </div>
        <div style="padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
          <p>GymPro Management System</p>
        </div>
      </div>
    `;

  return sendEmail(member.email, subject, html);
};

// Send notification to gym owner
export const sendOwnerNotification = async (expiringMembers) => {
  const memberList = expiringMembers.map(m =>
    `<tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${m.fullName}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${m.phone}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(m.packageEnd).toLocaleDateString()}</td>
    </tr>`
  ).join('');

  const subject = `📊 Daily Report: ${expiringMembers.length} Members Expiring Soon`;
  const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2>🏋️ Daily Expiry Report</h2>
        <p>The following members have memberships expiring within 7 days:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 12px; text-align: left;">Name</th>
              <th style="padding: 12px; text-align: left;">Phone</th>
              <th style="padding: 12px; text-align: left;">Expires</th>
            </tr>
          </thead>
          <tbody>
            ${memberList}
          </tbody>
        </table>
        
        <p style="color: #64748b; font-size: 12px;">
          This is an automated report from GymPro Management System.
        </p>
      </div>
    `;

  return sendEmail(process.env.OWNER_EMAIL || process.env.SENDGRID_FROM_EMAIL, subject, html);
};

// Send Payment Due notification
export const sendPaymentReminder = async (member) => {
  const subject = `🔔 Gym Membership Payment Due`;
  const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f43f5e, #e11d48); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🏋️ GymPro</h1>
        </div>
        <div style="padding: 30px; background: #f8fafc;">
          <h2>Hi ${member.fullName}!</h2>
          <p>We noticed there is a pending balance on your gym membership.</p>
          
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p><strong>Package:</strong> ${member.packageType}</p>
            <p><strong>Balance Due:</strong> ₹${member.balanceDue.toLocaleString()}</p>
          </div>
          
          <p>Please clear your dues at the reception to ensure uninterrupted access to the gym. Thank you for being a valued member!</p>
        </div>
        <div style="padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
          <p>GymPro Management System</p>
        </div>
      </div>
    `;

  return sendEmail(member.email, subject, html);
};

// Send Welcome Email to New Member
export const sendWelcomeEmail = async (member) => {
  const subject = `🎉 Welcome to GymPro, ${member.fullName}!`;
  const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🏋️ GymPro</h1>
        </div>
        <div style="padding: 30px; background: #f8fafc;">
          <h2>Welcome to the Family, ${member.fullName}! 🚀</h2>
          <p>We are thrilled to have you on board. Get ready to embark on a journey of fitness, health, and transformation.</p>
          
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #22c55e;">
            <h3 style="margin-top: 0;">Your Membership Details</h3>
            <p><strong>Plan:</strong> ${member.packageType.replace('_', ' ')}</p>
            <p><strong>Start Date:</strong> ${new Date(member.packageStart).toLocaleDateString()}</p>
            <p><strong>Expiry Date:</strong> ${new Date(member.packageEnd).toLocaleDateString()}</p>
          </div>
          
          <h3>Here's what you can look forward to:</h3>
          <ul>
            <li>✅ State-of-the-art equipment</li>
            <li>✅ Expert trainers and guidance</li>
            <li>✅ A supportive community</li>
          </ul>

          <p>If you have any questions, feel free to ask our staff at the reception.</p>
          
          <p style="margin-top: 30px;">Let's crush those goals! 💪</p>
          
        </div>
        <div style="padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
          <p>GymPro Management System</p>
          <p>Vadamadurai</p>
        </div>
      </div>
    `;

  return sendEmail(member.email, subject, html);
};
