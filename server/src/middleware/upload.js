import multer from 'multer';
import path from 'path';
import fs from 'fs';

// --- Configure Storage for Course Materials (Memory Storage) ---
const materialStorage = multer.memoryStorage(); // <-- Changed to memory storage

// --- Configure Storage for Submissions (Keep Disk Storage if used) ---
const submissionStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/submissions';
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// --- Multer Middleware Instances ---
// Allow only PDFs for materials (or adjust as needed)
const uploadMaterial = multer({
    storage: materialStorage, // <-- Using memory storage
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') { // Allow PDFs
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed for materials!'), false);
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

const uploadSubmission = multer({
    storage: submissionStorage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

// Export the middleware
export { uploadMaterial, uploadSubmission };