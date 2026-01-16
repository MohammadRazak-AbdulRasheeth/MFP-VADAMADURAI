import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    type: {
        type: String,
        enum: ['EXPIRY_7_DAY', 'EXPIRY_3_DAY', 'EXPIRED'],
        required: true
    },
    sentAt: {
        type: Date,
        default: Date.now
    },
    channel: {
        type: String,
        enum: ['EMAIL', 'SMS', 'WHATSAPP'],
        required: true
    },
    status: {
        type: String,
        enum: ['SENT', 'FAILED'],
        default: 'SENT'
    }
}, {
    timestamps: true
});

reminderSchema.index({ memberId: 1 });
reminderSchema.index({ sentAt: -1 });

export default mongoose.model('Reminder', reminderSchema);
