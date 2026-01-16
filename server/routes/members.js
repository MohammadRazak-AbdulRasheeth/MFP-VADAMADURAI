import express from 'express';
import Member from '../models/Member.js';
import Payment from '../models/Payment.js';

const router = express.Router();

// Get all members with optional filters
router.get('/', async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = {};

        // Search filter
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Status filter
        const today = new Date();
        if (status === 'active') {
            const weekLater = new Date();
            weekLater.setDate(today.getDate() + 7);
            query.packageEnd = { $gt: weekLater };
            query.isActive = true;
        } else if (status === 'expiring') {
            const weekLater = new Date();
            weekLater.setDate(today.getDate() + 7);
            query.packageEnd = { $gt: today, $lte: weekLater };
        } else if (status === 'expired') {
            query.packageEnd = { $lte: today };
        }

        const members = await Member.find(query)
            .populate('trainerId')
            .sort({ createdAt: -1 });

        res.json(members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single member
router.get('/:id', async (req, res) => {
    try {
        const member = await Member.findById(req.params.id).populate('trainerId');
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }
        res.json(member);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create member
router.post('/', async (req, res) => {
    try {
        // Get user info from auth header (simple token extraction)
        const authHeader = req.headers.authorization;
        let creatorId = null;
        let isAdmin = false;

        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const userId = token.split('-')[1];
            if (userId) {
                const User = (await import('../models/User.js')).default;
                const user = await User.findById(userId);
                if (user) {
                    creatorId = user._id;
                    isAdmin = user.role === 'ADMIN';
                }
            }
        }

        const member = new Member({
            ...req.body,
            isVerified: isAdmin, // Auto-verify if Admin created it
            verificationDate: isAdmin ? new Date() : undefined,
            lastAction: 'CREATE',
            createdBy: creatorId
        });
        const savedMember = await member.save();

        // Auto-create payment record if amountPaid > 0
        if (savedMember.amountPaid > 0) {
            const payment = new Payment({
                memberId: savedMember._id,
                amount: savedMember.amountPaid,
                date: new Date(),
                method: req.body.paymentMethod || 'CASH',
                notes: `Initial payment for ${savedMember.packageType.replace('_', ' ')} package`
            });
            await payment.save();
        }

        res.status(201).json(savedMember);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update member
router.put('/:id', async (req, res) => {
    try {
        const existingMember = await Member.findById(req.params.id);
        if (!existingMember) {
            return res.status(404).json({ message: 'Member not found' });
        }

        // Get user info from auth header
        const authHeader = req.headers.authorization;
        let isAdmin = false;

        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const userId = token.split('-')[1];
            if (userId) {
                const User = (await import('../models/User.js')).default;
                const user = await User.findById(userId);
                if (user && user.role === 'ADMIN') {
                    isAdmin = true;
                }
            }
        }

        const oldAmountPaid = existingMember.amountPaid || 0;
        const newAmountPaid = req.body.amountPaid || 0;

        // Admin edits stay verified; staff edits need re-verification
        const member = await Member.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body,
                isVerified: isAdmin ? true : false,
                verificationDate: isAdmin ? new Date() : undefined,
                lastAction: 'UPDATE'
            },
            { new: true, runValidators: true }
        );

        // If payment increased, create a payment record for the difference
        if (newAmountPaid > oldAmountPaid) {
            const paymentDiff = newAmountPaid - oldAmountPaid;
            const payment = new Payment({
                memberId: member._id,
                amount: paymentDiff,
                date: new Date(),
                method: 'CASH',
                notes: `Additional payment`
            });
            await payment.save();
        }

        res.json(member);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete member
router.delete('/:id', async (req, res) => {
    try {
        const member = await Member.findByIdAndDelete(req.params.id);
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }
        res.json({ message: 'Member deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Renew membership
router.post('/:id/renew', async (req, res) => {
    try {
        const { packageType, packagePrice, amountPaid } = req.body;
        const member = await Member.findById(req.params.id);

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        const packageMonths = {
            'A': 1,
            'B': 3,
            'C': 6,
            'D': 12,
            'E': 24
        };

        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(startDate.getMonth() + packageMonths[packageType]);

        member.packageType = packageType;
        member.packagePrice = packagePrice || member.packagePrice;
        member.packageStart = startDate;
        member.packageEnd = endDate;
        member.amountPaid = amountPaid;
        // Reset discount on renewal to prevent "overpayment" validation error
        member.discountType = 'NONE';
        member.discountAmount = 0;
        member.isActive = true;

        await member.save();

        // Create payment record for renewal
        if (amountPaid > 0) {
            const payment = new Payment({
                memberId: member._id,
                amount: amountPaid,
                date: new Date(),
                method: 'CASH',
                notes: `Renewal payment for ${packageType.replace('_', ' ')} package`
            });
            await payment.save();
        }

        res.json(member);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Verify member (Admin only)
router.patch('/:id/verify', async (req, res) => {
    try {
        const member = await Member.findByIdAndUpdate(
            req.params.id,
            {
                isVerified: true,
                verificationDate: new Date()
            },
            { new: true }
        );

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        res.json(member);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export default router;
