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

// --- CORS (with credentials for cookies) ---
const allowedOrigins = [
  "https://classroom-j9p5il6vz-somanshs-projects-2206d97b.vercel.app",
  "https://classroom.vercel.app",
  "http://localhost:3000"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
// --- Security & logging middleware ---
app.use(helmet());
app.use(morgan('dev'));

// --- Body parsers ---
app.use(express.json({ limit: '5mb' })); // Increased limit for file metadata
app.use(cookieParser());

// --- Serve uploaded files (student submissions, etc.) ---
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
