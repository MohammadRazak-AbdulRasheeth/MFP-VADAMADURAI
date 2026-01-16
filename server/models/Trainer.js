import mongoose from 'mongoose';

const trainerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true
    },
    specialty: {
        type: String
    }
}, {
    timestamps: true
});

export default mongoose.model('Trainer', trainerSchema);
