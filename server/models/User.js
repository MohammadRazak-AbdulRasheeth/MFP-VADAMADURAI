import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['ADMIN', 'STAFF'],
        default: 'STAFF'
    },
    phone: {
        type: String
    },
    email: {
        type: String,
        lowercase: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Create default admin on first run
userSchema.statics.createDefaultAdmin = async function () {
    const adminExists = await this.findOne({ role: 'ADMIN' });
    if (!adminExists) {
        await this.create({
            username: 'mfp_vadamadurai_admin',
            password: 'mfp_vadamadurai_admin_password', // In production, hash this!
            name: 'MFP Vadamadurai Admin',
            role: 'ADMIN',
            isActive: true
        });
        console.log('✅ Default admin account created');
    }
};

export default mongoose.model('User', userSchema);
