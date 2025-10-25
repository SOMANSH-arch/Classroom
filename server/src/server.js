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

// --- CORS ---
const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:4000';
console.log('✅ Allowed Origin:', allowedOrigin);

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Explicitly handle preflight requests
app.options('*', cors());

// --- Security & logging ---
app.use(helmet());
app.use(morgan('dev'));

// --- Body parsers ---
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// --- Static files ---
app.use('/uploads', express.static(path.resolve('uploads')));

// --- Health check ---
app.get('/health', (_, res) => res.json({ ok: true }));

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/payment', paymentRoutes);

// --- Start server ---
const port = process.env.PORT || 4000;
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`✅ Server running on port ${port}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  });
});
