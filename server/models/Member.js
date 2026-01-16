import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    memberId: {
        type: String,
        unique: true,
        sparse: true // Allows nulls during initial save if we generate it after
    },
    phone: {
        type: String,
        required: true
    },
    whatsapp: {
        type: String
    },
    email: {
        type: String,
        lowercase: true
    },
    address: {
        type: String
    },
    dateOfJoining: {
        type: Date,
        required: true
    },
    packageType: {
        type: String,
        enum: ['A', 'B', 'C', 'D', 'E'],
        required: true
    },
    packagePrice: {
        type: Number,
        required: true,
        default: 0
    },
    discountType: {
        type: String,
        enum: ['NONE', 'FIXED', 'CUSTOM'],
        default: 'NONE'
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    packageStart: {
        type: Date,
        required: true
    },
    packageEnd: {
        type: Date,
        required: true
    },
    amountPaid: {
        type: Number,
        default: 0
    },
    balanceDue: {
        type: Number,
        default: 0
    },
    paymentStatus: {
        type: String,
        enum: ['PAID', 'DUE', 'PARTIAL'],
        default: 'DUE'
    },
    trainerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trainer'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationDate: {
        type: Date
    },
    lastAction: {
        type: String,
        enum: ['CREATE', 'UPDATE'],
        default: 'CREATE'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Auto-calculate balanceDue and paymentStatus before saving
memberSchema.pre('save', async function (next) {
    // Generate Member ID if it's a new member or doesn't have one
    if (this.isNew || !this.memberId) {
        try {
            const planCode = this.packageType; // A, B, C, D, or E
            const lastMember = await this.constructor.findOne({
                memberId: new RegExp(`^${planCode}`)
            }).sort({ memberId: -1 });

            let nextNumber = 1;
            if (lastMember && lastMember.memberId) {
                const lastNumber = parseInt(lastMember.memberId.substring(1));
                if (!isNaN(lastNumber)) {
                    nextNumber = lastNumber + 1;
                }
            }

            this.memberId = `${planCode}${nextNumber.toString().padStart(6, '0')}`;
        } catch (error) {
            console.error('Error generating memberId:', error);
            // If it fails, we'll let it save and hope for the best or handle in route
        }
    }

    // Apply Discount
    if (this.discountType === 'FIXED') {
        this.discountAmount = 500;
    } else if (this.discountType === 'NONE') {
        this.discountAmount = 0;
    }
    // CUSTOM discountAmount is taken as is from input

    const finalPrice = this.packagePrice - this.discountAmount;

    // Validation: Amount Paid should not be higher than Final Price
    if (this.amountPaid > finalPrice) {
        throw new Error(`Amount paid (₹${this.amountPaid}) cannot be higher than the final price (₹${finalPrice})`);
    }

    this.balanceDue = finalPrice - this.amountPaid;

    if (this.balanceDue <= 0) {
        this.paymentStatus = 'PAID';
        this.balanceDue = 0;
    } else {
        this.paymentStatus = 'DUE';
    }

    next();
});

memberSchema.index({ packageEnd: 1 });
memberSchema.index({ isActive: 1 });
memberSchema.index({ paymentStatus: 1 });

export default mongoose.model('Member', memberSchema);
