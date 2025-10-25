import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import connectDB from './utils/db.js';

import authRoutes from './routes/auth.routes.js';
import courseRoutes from './routes/course.routes.js';
import assignmentRoutes from './routes/assignment.routes.js';
import submissionRoutes from './routes/submission.routes.js';
import aiRoutes from './routes/ai.routes.js';
import paymentRoutes from './routes/payment.routes.js';

const app = express();

// --- CRITICAL FIX: Manual Universal CORS Configuration ---
// This is done BEFORE any other middleware to ensure preflight headers are sent first.
app.use((req, res, next) => {
    // 1. Set the specific frontend origin (Vercel URL)
    const allowedOrigin = process.env.CLIENT_ORIGIN || 'https://classroom-1r4ryysw-somanshs-projects-2206d97b.vercel.app';
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    
    // 2. Allow credentials (cookies)
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // 3. Allow all common headers
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // 4. Allow all necessary methods (critical for preflight)
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

    // 5. Handle Preflight Request (OPTIONS)
    if (req.method === 'OPTIONS') {
        // Send a success response immediately for the preflight check
        return res.sendStatus(204); 
    }
    
    next();
});

// --- Security & logging middleware ---
// We keep helmet commented out as it is known to conflict with CORS headers.
// app.use(helmet()); 
app.use(morgan('dev'));

// --- Body parsers ---
app.use(express.json({ limit: '5mb' })); 
app.use(cookieParser());

// --- Serve uploaded files (Local Path is ignored on Cloudinary setup) ---
app.use('/uploads', express.static(path.resolve('uploads')));

// --- Health check route ---
app.get('/health', (_, res) => res.json({ ok: true }));

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/payment', paymentRoutes);

// --- Start Server after DB connection ---
const port = process.env.PORT || 4000;
connectDB().then(() => {
    // We bind to 0.0.0.0 which Render requires
    app.listen(port, '0.0.0.0', () => console.log(`✅ API running on port ${port}`));
});