import express from 'express';
import Payment from '../models/Payment.js';
import Member from '../models/Member.js';

const router = express.Router();

// Get all payments
router.get('/', async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate('memberId')
            .sort({ date: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get payments by member
router.get('/member/:memberId', async (req, res) => {
    try {
        const payments = await Payment.find({ memberId: req.params.memberId })
            .sort({ date: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create payment (also updates member's amountPaid)
router.post('/', async (req, res) => {
    try {
        const payment = new Payment(req.body);
        const savedPayment = await payment.save();

        // Update member's amountPaid if memberId is provided
        if (req.body.memberId && req.body.amount) {
            const member = await Member.findById(req.body.memberId);
            if (member) {
                member.amountPaid = (member.amountPaid || 0) + req.body.amount;
                await member.save();
            }
        }

        res.status(201).json(savedPayment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Sync existing member payments to Payments collection
router.post('/sync-from-members', async (req, res) => {
    try {
        // Get all members with amountPaid > 0
        const membersWithPayments = await Member.find({ amountPaid: { $gt: 0 } });

        let created = 0;
        let skipped = 0;

        for (const member of membersWithPayments) {
            // Check if payment already exists for this member
            const existingPayment = await Payment.findOne({ memberId: member._id });

            if (!existingPayment) {
                // Create payment record for this member
                const payment = new Payment({
                    memberId: member._id,
                    amount: member.amountPaid,
                    date: member.dateOfJoining || new Date(),
                    method: 'CASH',
                    notes: `Initial payment for ${member.packageType.replace('_', ' ')} package (synced)`
                });
                await payment.save();
                created++;
            } else {
                skipped++;
            }
        }

        res.json({
            message: `Synced payments: ${created} created, ${skipped} already existed`,
            created,
            skipped,
            totalMembers: membersWithPayments.length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
