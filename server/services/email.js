const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Send expiry reminder email
const sendExpiryReminder = async (member, daysLeft) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"GymPro" <${process.env.SMTP_USER}>`,
    to: member.email,
    subject: `⏰ Gym Membership Expiring in ${daysLeft} Days`,
    html: `
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
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✉️ Reminder sent to ${member.email}`);
    return { success: true };
  } catch (error) {
    console.error(`Failed to send email to ${member.email}:`, error.message);
    return { success: false, error: error.message };
  }
};

// Send notification to gym owner
const sendOwnerNotification = async (expiringMembers) => {
  const transporter = createTransporter();

  const memberList = expiringMembers.map(m =>
    `<tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${m.fullName}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${m.phone}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(m.packageEnd).toLocaleDateString()}</td>
    </tr>`
  ).join('');

  const mailOptions = {
    from: `"GymPro System" <${process.env.SMTP_USER}>`,
    to: process.env.OWNER_EMAIL || process.env.SMTP_USER,
    subject: `📊 Daily Report: ${expiringMembers.length} Members Expiring Soon`,
    html: `
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
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('📊 Owner notification sent');
    return { success: true };
  } catch (error) {
    console.error('Failed to send owner notification:', error.message);
    return { success: false, error: error.message };
  }
};

// Send Payment Due notification
const sendPaymentReminder = async (member) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"GymPro" <${process.env.SMTP_USER}>`,
    to: member.email,
    subject: `🔔 Gym Membership Payment Due`,
    html: `
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
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✉️ Payment reminder sent to ${member.email}`);
    return { success: true };
  } catch (error) {
    console.error(`Failed to send payment reminder to ${member.email}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendExpiryReminder,
  sendOwnerNotification,
  sendPaymentReminder
};
