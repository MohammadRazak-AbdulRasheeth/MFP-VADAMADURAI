console.log('!!! SERVER INDEX.JS STARTING !!!');
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initScheduler, runDailyCheck } from './cron/scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

// Debug environment
console.log('Backend FRONTEND_URL:', process.env.FRONTEND_URL);

// Identify this server instance
app.use((req, res, next) => {
    res.setHeader('X-MFP-Server', 'Local-Debug-Instance-5000');
    next();
});

// CORS Middleware (JWT-based auth, no credentials needed)
app.use(cors({
    origin: [
        'https://portal.mfpvadamadurai.com',
        'http://localhost:5173',
        'http://localhost:5174'
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// MongoDB Atlas Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gym-management';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB Atlas');

        // Create default admin account
        const User = (await import('./models/User.js')).default;
        await User.createDefaultAdmin();
    })
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Import routes
import authRoutes from './routes/auth.js';
import memberRoutes from './routes/members.js';
import dashboardRoutes from './routes/dashboard.js';
import paymentRoutes from './routes/payments.js';
import userRoutes from './routes/users.js';
import reportRoutes from './routes/reports.js';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Manual Run Route
app.get('/api/test-scheduler', async (req, res) => {
    console.log('⚠️ Manual scheduler run triggered via API');
    await runDailyCheck();
    res.json({ message: 'Daily check executed carefully check console for logs' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5001;

console.log('--- ATTEMPTING TO START ON PORT:', PORT, '---');

app.listen(PORT, () => {
    console.log(`🏋️ Gym Management Server running on port ${PORT}`);
    console.log(`   API: http://localhost:${PORT}/api`);

    // Start Scheduler
    initScheduler();
});
