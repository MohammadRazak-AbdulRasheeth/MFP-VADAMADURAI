import express from 'express';
import Member from '../models/Member.js';
import Payment from '../models/Payment.js';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        const today = new Date();
        const weekLater = new Date();
        weekLater.setDate(today.getDate() + 7);

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const start = Date.now();
        console.log('📊 Fetching dashboard stats...');

        const [
            statsResult,
            recentAdmissions,
            renewedMembersThisMonth
        ] = await Promise.all([
            // 1. Main Aggregation for all counts and sums
            Member.aggregate([
                {
                    $facet: {
                        "totalMembers": [{ $count: "count" }],
                        "activeMembers": [
                            { $match: { packageEnd: { $gt: today }, isActive: true } },
                            { $count: "count" }
                        ],
                        "expiringThisWeek": [
                            { $match: { packageEnd: { $gt: today, $lte: weekLater } } },
                            { $count: "count" }
                        ],
                        "expiredMembers": [
                            { $match: { packageEnd: { $lte: today } } },
                            { $count: "count" }
                        ],
                        "revenueStats": [
                            {
                                $group: {
                                    _id: null,
                                    totalCollected: { $sum: '$amountPaid' },
                                    totalPackageValue: { $sum: '$packagePrice' }
                                }
                            }
                        ],
                        "pendingDues": [
                            { $match: { balanceDue: { $gt: 0 } } },
                            {
                                $group: {
                                    _id: null,
                                    totalPending: { $sum: '$balanceDue' }
                                }
                            }
                        ],
                        "membersWithDues": [
                            { $match: { balanceDue: { $gt: 0 } } },
                            { $count: "count" }
                        ],
                        "unverifiedMembersCount": [
                            { $match: { isVerified: false } },
                            { $count: "count" }
                        ],
                        "newMembersThisMonth": [
                            { $match: { dateOfJoining: { $gte: startOfMonth } } },
                            { $count: "count" }
                        ]
                    }
                }
            ]),

            // 2. Recent Admissions (Needs populate, better separately or complicated $lookup)
            Member.find({
                createdAt: { $gte: new Date(today.getTime() - (3 * 24 * 60 * 60 * 1000)) }
            }).populate('createdBy', 'name role').sort({ createdAt: -1 }),

            // 3. Renewed Members (Join with Payment model, better separate)
            Payment.aggregate([
                {
                    $match: {
                        date: { $gte: startOfMonth },
                        $or: [
                            { category: 'RENEWAL' },
                            { notes: { $regex: /Renewal/i } }
                        ]
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
            ])
        ]);

        const duration = Date.now() - start;
        console.log(`⏱️ Dashboard Stats DB Queries took: ${duration}ms`);

        const stats = statsResult[0];

        // Safe unpacking of facet results (they return arrays)
        const totalMembers = stats.totalMembers[0]?.count || 0;
        const activeMembers = stats.activeMembers[0]?.count || 0;
        const expiringThisWeek = stats.expiringThisWeek[0]?.count || 0;
        const expiredMembers = stats.expiredMembers[0]?.count || 0;
        const totalCollected = stats.revenueStats[0]?.totalCollected || 0;
        const totalPending = stats.pendingDues[0]?.totalPending || 0;
        const membersWithDues = stats.membersWithDues[0]?.count || 0;
        const unverifiedMembersCount = stats.unverifiedMembersCount[0]?.count || 0;
        const newMembersThisMonth = stats.newMembersThisMonth[0]?.count || 0;
        const renewedCount = renewedMembersThisMonth[0]?.count || 0;

        res.json({
            totalMembers,
            activeMembers,
            expiringThisWeek,
            expiredMembers,
            totalCollected,
            totalPending,
            membersWithDues,
            unverifiedMembersCount,
            recentAdmissions,
            newMembersThisMonth,
            renewedMembersThisMonth: renewedCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get expiring members
router.get('/expiring', async (req, res) => {
    try {
        const today = new Date();
        const weekLater = new Date();
        weekLater.setDate(today.getDate() + 7);

        const expiringMembers = await Member.find({
            packageEnd: { $gte: today, $lte: weekLater }
        }).sort({ packageEnd: 1 });

        res.json(expiringMembers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get members with pending dues
router.get('/pending-dues', async (req, res) => {
    try {
        const members = await Member.find({ balanceDue: { $gt: 0 } })
            .sort({ balanceDue: -1 });
        res.json(members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get unverified members
router.get('/unverified', async (req, res) => {
    try {
        const members = await Member.find({ isVerified: false })
            .populate('createdBy', 'name role')
            .sort({ updatedAt: -1 });
        res.json(members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get analytics data for charts
router.get('/analytics', async (req, res) => {
    try {
        const today = new Date();
        const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

        // Monthly revenue for last 6 months
        const monthlyRevenue = await Member.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    revenue: { $sum: '$amountPaid' },
                    members: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Format monthly revenue data
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const revenueData = monthlyRevenue.map(item => ({
            month: monthNames[item._id.month - 1],
            revenue: item.revenue,
            members: item.members
        }));

        // Package distribution
        const packageDistribution = await Member.aggregate([
            {
                $group: {
                    _id: '$packageType',
                    count: { $sum: 1 },
                    revenue: { $sum: '$amountPaid' }
                }
            }
        ]);

        const packageLabels = {
            'A': '1 Month',
            'B': '3 Months',
            'C': '6 Months',
            'D': '12 Months',
            'E': '24 Months'
        };

        const packageData = packageDistribution.map(item => ({
            name: packageLabels[item._id] || item._id,
            value: item.count,
            revenue: item.revenue
        }));

        // Payment status distribution
        const paymentStatus = await Member.aggregate([
            {
                $group: {
                    _id: '$paymentStatus',
                    count: { $sum: 1 }
                }
            }
        ]);

        const paymentData = paymentStatus.map(item => ({
            name: item._id,
            value: item.count
        }));

        res.json({
            monthlyRevenue: revenueData,
            packageDistribution: packageData,
            paymentStatus: paymentData
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
