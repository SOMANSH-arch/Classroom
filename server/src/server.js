import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
// import helmet from 'helmet'; // Keep helmet disabled for now
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

// --- CRITICAL FIX: EXPLICIT Manual CORS Handling with Logging ---
app.use((req, res, next) => {
    const requestOrigin = req.headers.origin; // Get the origin header from the incoming request
    const allowedOrigin = process.env.CLIENT_ORIGIN; // Get the expected origin from .env

    console.log(`[CORS Check] Request Origin: ${requestOrigin}`); // Log incoming origin
    console.log(`[CORS Check] Allowed Origin (from env): ${allowedOrigin}`); // Log expected origin

    // Dynamically set Allow-Origin header ONLY if it matches the expected client origin
    if (requestOrigin && allowedOrigin && requestOrigin === allowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        console.log(`[CORS Check] Access-Control-Allow-Origin SET to: ${allowedOrigin}`);
    } else if (!requestOrigin) {
        // Allow requests with no origin (like server-to-server or tools like Postman)
        console.log("[CORS Check] No Origin header found, proceeding without CORS headers.");
    } else {
        // Origin doesn't match - CORS error will likely occur, but log it
        console.warn(`[CORS Check] Origin Mismatch! Request origin ${requestOrigin} does not match allowed origin ${allowedOrigin}.`);
        // We still need to handle OPTIONS correctly even if origin mismatches
    }

    // Always allow credentials
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Always define allowed methods and headers
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle Preflight Request (OPTIONS) - Respond immediately after setting headers
    if (req.method === 'OPTIONS') {
        console.log('[CORS Check] OPTIONS request received, sending 204.');
        return res.sendStatus(204);
    }
    
    // For non-OPTIONS requests, continue to other middleware/routes
    next();
});

// --- Security & logging middleware ---
// app.use(helmet()); 
app.use(morgan('dev')); // Keep morgan for request logging

// --- Body parsers ---
app.use(express.json({ limit: '5mb' })); 
app.use(cookieParser());

// --- Serve uploaded files ---
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
    app.listen(port, '0.0.0.0', () => console.log(`✅ API running on port ${port}`));
}).catch(err => {
    console.error("!!! Failed to connect to DB and start server:", err);
    process.exit(1); // Exit if DB connection fails
});