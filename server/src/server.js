import 'dotenv/config';
import express from 'express';
import cors from 'cors'; 
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

// --- CRITICAL FIX: Universal CORS with Credentials ---
// This ensures ALL origins are allowed to send credentials (the cookie).
// Security is maintained by the 'secure' and 'sameSite' flags on the cookie itself.
app.use(
  cors({
    origin: (origin, callback) => {
        // Allow the request if there is no origin (like a direct server call)
        // OR if the origin matches our client origin (Vercel URL).
        const allowedOrigins = [process.env.CLIENT_ORIGIN, 'https://classroom-1r4ryysw-somanshs-projects-2206d97b.vercel.app'];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'), false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    preflightContinue: false, // Do not pass preflight to next middleware
    optionsSuccessStatus: 204 // Crucial for preflight success on some hosts
  })
);

// --- Handle Preflight OPTIONS for ALL routes (REQUIRED) ---
app.options('*', cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 204
}));

// --- Security & logging middleware ---
// We will leave helmet disabled to avoid header conflicts
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