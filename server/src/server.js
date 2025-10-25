import 'dotenv/config';
import express from 'express';
import cors from 'cors'; // Still needed for internal use/type checking
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

// --- CRITICAL FIX: Manual CORS Handling for Deployment ---
// This bypasses automated Express CORS issues on services like Render/Vercel.
app.use((req, res, next) => {
    const allowedOrigin = process.env.CLIENT_ORIGIN;
    
    // 1. Set Access-Control-Allow-Origin dynamically to the frontend's HTTPS URL
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin || 'https://classroom-1r4ryysw-somanshs-projects-2206d97b.vercel.app');
    
    // 2. Allow credentials (cookies)
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // 3. Define allowed methods and headers
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // 4. Handle Preflight Request (OPTIONS)
    // The browser sends this check first for complex requests (like POST with cookies)
    if (req.method === 'OPTIONS') {
        // Must respond with status 204 (No Content) immediately
        return res.sendStatus(204);
    }
    
    next();
});

// NOTE: The 'helmet' middleware is commented out to prevent potential header conflicts
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
    app.listen(port, () => console.log(`✅ API running on port ${port}`));
});