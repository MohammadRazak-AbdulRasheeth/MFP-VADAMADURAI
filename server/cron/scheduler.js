import cron from 'node-cron';
import Member from '../models/Member.js';
import { sendExpiryReminder, sendExpiredNotification } from '../services/email.js';
import { sendExpiryReminderWhatsApp } from '../services/whatsapp.js';

export const initScheduler = () => {
    console.log('⏰ Scheduler initialized: Daily expiry checks set for 6:00 AM');

    // Schedule task for 6:00 AM daily in Asia/Kolkata timezone
    cron.schedule('0 6 * * *', runDailyCheck, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });
};

export const runDailyCheck = async () => {
    console.log('🔄 Running daily expiry check worker...');

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // --- CHECK 1: UPCOMING EXPIRY REMINDERS (7, 3, 1 days left) ---
        const targetDays = [7, 3, 1];

        for (const days of targetDays) {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + days);

            // Create start and end of that specific target day for query
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);

            // Find active members expiring on this specific day
            const expiringMembers = await Member.find({
                isActive: true,
                packageEnd: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            });

            if (expiringMembers.length > 0) {
                console.log(`found ${expiringMembers.length} members expiring in ${days} days.`);

                for (const member of expiringMembers) {
                    if (member.email) {
                        console.log(`📤 Sending ${days}-day expiry reminder to ${member.fullName} (${member.email})`);
                        await sendExpiryReminder(member, days);
                    }
                    if (member.phone) {
                        await sendExpiryReminderWhatsApp(member, days);
                    }
                }
            }
        }

        // --- CHECK 2: RECENTLY EXPIRED (Expired Yesterday) ---
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1); // Go back 1 day

        const startOfYesterday = new Date(yesterday);
        startOfYesterday.setHours(0, 0, 0, 0);

        const endOfYesterday = new Date(yesterday);
        endOfYesterday.setHours(23, 59, 59, 999);

        const expiredMembers = await Member.find({
            isActive: true, // They might still be marked active until we manually expire them
            packageEnd: {
                $gte: startOfYesterday,
                $lte: endOfYesterday
            }
        });

        if (expiredMembers.length > 0) {
            console.log(`found ${expiredMembers.length} members who expired yesterday.`);
            for (const member of expiredMembers) {
                if (member.email) {
                    console.log(`📤 Sending Expiry Notification to ${member.fullName} (${member.email})`);
                    await sendExpiredNotification(member);
                }
            }

        }

        console.log('✅ Daily expiry check completed.');
    } catch (error) {
        console.error('❌ Error in daily expiry scheduler:', error);
    }
};
