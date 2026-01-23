import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Member from '../server/models/Member.js';
import { sendExpiryReminder } from '../server/services/email.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gym-management';

const runTest = async () => {
    console.log('🔄 Connecting to DB for Scheduler Test...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected.');

    console.log('🧪 Simulating Daily Expiry Check (Immediate Run)...');

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Targets: 7 days, 3 days, 1 day before expiry
        const targetDays = [7, 3, 1];

        for (const days of targetDays) {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + days);

            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);

            console.log(`🔎 Checking for members expiring in ${days} days (Target: ${startOfDay.toISOString().split('T')[0]})...`);

            const expiringMembers = await Member.find({
                isActive: true,
                packageEnd: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            });

            if (expiringMembers.length > 0) {
                console.log(`   found ${expiringMembers.length} members.`);
                for (const member of expiringMembers) {
                    if (member.email) {
                        console.log(`   📤 [MOCK SEND] Sending ${days}-day reminder to ${member.fullName}`);
                        // Uncomment to actually send during test:
                        // await sendExpiryReminder(member, days); 
                    } else {
                        console.log(`   ⚠️ Member ${member.fullName} has no email.`);
                    }
                }
            } else {
                console.log(`   No members found expiring in ${days} days.`);
            }
        }
    } catch (error) {
        console.error('❌ Error during test:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Test Completed.');
    }
};

runTest();
