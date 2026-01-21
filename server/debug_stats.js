import mongoose from 'mongoose';
import Member from './models/Member.js';
import Payment from './models/Payment.js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const mongooseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

async function debugStats() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, mongooseOptions);
        console.log('✅ Connected to MongoDB');

        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        console.log('\n--- Time Debug ---');
        console.log('Current Server Time:', today.toString());
        console.log('Start of Month:', startOfMonth.toString());
        console.log('Start of Month (ISO):', startOfMonth.toISOString());

        console.log('\n--- Member Debug ---');
        const recentMembers = await Member.find().sort({ createdAt: -1 }).limit(5);
        console.log('Total Members:', await Member.countDocuments());
        console.log('Recent Members (Top 5):');
        recentMembers.forEach(m => {
            console.log(`- ${m.fullName}: Created At ${m.createdAt} (ISO: ${m.createdAt?.toISOString()})`);
        });

        const newMembersCount = await Member.countDocuments({ createdAt: { $gte: startOfMonth } });
        console.log(`\nQuery: { createdAt: { $gte: ${startOfMonth} } }`);
        console.log('New Members This Month Count:', newMembersCount);

        console.log('\n--- Payment Debug ---');
        console.log('\n--- Aggregation Debug ---');
        const aggregationPipeline = [
            {
                $match: {
                    date: { $gte: startOfMonth },
                    notes: { $regex: /Renewal/i }
                }
            },
            {
                $group: {
                    _id: '$memberId'
                }
            },
            {
                $count: 'count'
            }
        ];

        console.log('Running Pipeline:', JSON.stringify(aggregationPipeline));
        const renewalAgg = await Payment.aggregate(aggregationPipeline);
        console.log('Aggregation Result:', JSON.stringify(renewalAgg));

        const count = renewalAgg[0]?.count || 0;
        console.log('Parsed Count:', count);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

debugStats();
