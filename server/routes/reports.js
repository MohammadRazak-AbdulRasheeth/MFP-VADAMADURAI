
import express from 'express';
import Member from '../models/Member.js';
import Payment from '../models/Payment.js';

const router = express.Router();

// Get Monthly Growth Report (New Joining vs Renewals)
router.get('/monthly_growth', async (req, res) => {
    try {
        // 1. New Joinings (Members grouped by month of joining)
        const newMembersData = await Member.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: "$dateOfJoining" },
                        month: { $month: "$dateOfJoining" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // 2. Renewals (Payments with 'Renewal' in notes grouped by month)
        const renewalsData = await Payment.aggregate([
            {
                $match: {
                    $or: [
                        { category: 'RENEWAL' },
                        { notes: { $regex: /Renewal/i } }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" }
                    },
                    // Count unique members who renewed in that month
                    memberIds: { $addToSet: "$memberId" }
                }
            },
            {
                $project: {
                    count: { $size: "$memberIds" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // 3. Merge Data
        const monthlyData = {};

        // Helper to generate key "YYYY-MM"
        const getKey = (year, month) => {
            return `${year}-${String(month).padStart(2, '0')}`;
        };

        // Process New Members
        newMembersData.forEach(item => {
            const key = getKey(item._id.year, item._id.month);
            if (!monthlyData[key]) {
                monthlyData[key] = {
                    month: key, // YYYY-MM
                    year: item._id.year,
                    monthNum: item._id.month,
                    newMembers: 0,
                    renewals: 0
                };
            }
            monthlyData[key].newMembers = item.count;
        });

        // Process Renewals
        renewalsData.forEach(item => {
            const key = getKey(item._id.year, item._id.month);
            if (!monthlyData[key]) {
                monthlyData[key] = {
                    month: key,
                    year: item._id.year,
                    monthNum: item._id.month,
                    newMembers: 0,
                    renewals: 0
                };
            }
            monthlyData[key].renewals = item.count;
        });

        // Convert to array and sort chronologically
        const result = Object.values(monthlyData).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.monthNum - b.monthNum;
        });

        res.json(result);

    } catch (error) {
        console.error('Error fetching monthly growth report:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
