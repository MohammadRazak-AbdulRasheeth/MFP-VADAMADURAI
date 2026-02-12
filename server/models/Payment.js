import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    method: {
        type: String,
        enum: ['CASH', 'UPI', 'CARD'],
        required: true
    },
    notes: {
        type: String
    },
    category: {
        type: String,
        enum: ['ADMISSION', 'RENEWAL', 'GENERAL'],
        default: 'GENERAL',
        index: true
    }
}, {
    timestamps: true
});

paymentSchema.index({ memberId: 1 });
paymentSchema.index({ date: -1 });

export default mongoose.model('Payment', paymentSchema);
