import express from 'express';
import Member from '../models/Member.js';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        const today = new Date();
        const weekLater = new Date();
        weekLater.setDate(today.getDate() + 7);

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const [
            totalMembers,
            activeMembers,
            expiringThisWeek,
            expiredMembers,
            revenueStats,
            pendingDuesResult,
            membersWithDues,
            unverifiedMembersCount,
            recentAdmissions
        ] = await Promise.all([
            Member.countDocuments(),
            Member.countDocuments({ packageEnd: { $gt: today }, isActive: true }), // Improved active check
            Member.countDocuments({ packageEnd: { $gt: today, $lte: weekLater } }),
            Member.countDocuments({ packageEnd: { $lte: today } }),
            Member.aggregate([
                {
                    $group: {
                        _id: null,
                        totalCollected: { $sum: '$amountPaid' },
                        totalPackageValue: { $sum: '$packagePrice' }
                    }
                }
            ]),
            Member.aggregate([
                { $match: { balanceDue: { $gt: 0 } } },
                { $group: { _id: null, totalPending: { $sum: '$balanceDue' } } }
            ]),
            Member.countDocuments({ balanceDue: { $gt: 0 } }),
            Member.countDocuments({ isVerified: false }),
            Member.find({
                createdAt: { $gte: new Date(today.getTime() - (3 * 24 * 60 * 60 * 1000)) }
            }).populate('createdBy', 'name role').sort({ createdAt: -1 })
        ]);

        const totalCollected = revenueStats[0]?.totalCollected || 0;
        const totalPending = pendingDuesResult[0]?.totalPending || 0;

        res.json({
            totalMembers,
            activeMembers,
            expiringThisWeek,
            expiredMembers,
            totalCollected,
            totalPending,
            membersWithDues,
            unverifiedMembersCount,
            recentAdmissions
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
