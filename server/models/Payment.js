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
    }
}, {
    timestamps: true
});

paymentSchema.index({ memberId: 1 });
paymentSchema.index({ date: -1 });

export default mongoose.model('Payment', paymentSchema);
