import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import Submission from '../models/Submission.model.js';
import Assignment from '../models/Assignment.model.js';
import Course from '../models/Course.model.js';
import { uploadSubmission } from '../middleware/upload.js';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import mongoose from 'mongoose';

const router = Router();

// Configure Cloudinary (needs to be here)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Cloudinary upload helper (needs to be here)
const uploadToCloudinary = (fileBuffer, options) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) { reject(error); } else { resolve(result); }
        }).end(fileBuffer);
    });
};

// --- FIX: Ensure a clean router start ---

/**
 * POST / - Create a new submission (handles file upload to Cloudinary)
 */
router.post(
    '/',
    requireAuth,
    uploadSubmission.single('submissionFile'),
    async (req, res) => {
        const { assignmentId, content } = req.body;
        const studentId = req.user.sub;

        if (!assignmentId || !mongoose.Types.ObjectId.isValid(assignmentId)) {
            return res.status(400).json({ message: 'Valid Assignment ID is required.' });
        }
        if (!req.file && (!content || content.trim() === '')) {
            return res.status(400).json({ message: 'Submission requires a file or text content.' });
        }

        let fileUrl = null; let originalFileName = null; let cloudinaryPublicId = null;

        try {
            const existingSubmission = await Submission.findOne({ assignment: assignmentId, student: studentId });
            if (existingSubmission) { return res.status(409).json({ message: 'You have already submitted for this assignment.' }); }

            if (req.file) {
                const assignment = await Assignment.findById(assignmentId);
                if (!assignment) return res.status(404).json({ message: 'Associated assignment not found.' });

                const uploadOptions = {
                    resource_type: "raw",
                    folder: `innodeed-classroom/submissions/${assignment.course}/${assignmentId}/${studentId}`,
                    public_id: `${Date.now()}-${req.file.originalname.split('.').slice(0, -1).join('.')}`,
                };
                const result = await uploadToCloudinary(req.file.buffer, uploadOptions);
                if (!result || !result.secure_url) throw new Error('Cloudinary upload failed');
                fileUrl = result.secure_url;
                originalFileName = req.file.originalname;
                cloudinaryPublicId = result.public_id;
            }

            const newSubmissionData = {
                assignment: assignmentId, student: studentId, content: content || '',
                ...(fileUrl && originalFileName && { file: { url: fileUrl, name: originalFileName } })
            };
            const newSubmission = await Submission.create(newSubmissionData);
            res.status(201).json({ message: 'Submission successful!', submission: newSubmission });

        } catch (error) {
            console.error("Error creating submission:", error);
            res.status(500).json({ message: `Submission failed: ${error.message || 'Internal Server Error'}` });
        }
    },
    (error, req, res, next) => {
        if (error instanceof multer.MulterError || error) {
            return res.status(400).json({ message: `File upload error: ${error.message}` });
        }
        next();
    }
);


// GET Submissions for the logged-in student
router.get('/mine', requireAuth, async (req, res) => {
    try {
        const submissions = await Submission.find({ student: req.user.sub })
                                        .populate({ 
                                            path: 'assignment',
                                            select: 'title dueDate course',
                                            populate: { path: 'course', select: 'title' }
                                        })
                                        .sort({ createdAt: -1 });
        res.json({ submissions });
    } catch (error) {
        console.error("Error fetching student submissions:", error);
        res.status(500).json({ message: 'Internal Server Error fetching submissions.' });
    }
});


// GET submissions for a specific assignment (Teacher only)
router.get('/assignment/:assignmentId', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(assignmentId)) { return res.status(400).json({ message: 'Invalid Assignment ID.' }); }
    
    const assignment = await Assignment.findById(assignmentId).populate('course', 'teacher');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found.' });
    if (assignment.course?.teacher?.toString() !== req.user.sub) {
        return res.status(403).json({ message: 'You are not authorized to view submissions for this assignment.' });
    }

    const submissions = await Submission.find({ assignment: assignmentId })
      .populate('student', 'name email')
      .sort({ createdAt: -1 });

    res.json({ submissions });
  } catch (err) {
    console.error("Error fetching assignment submissions:", err);
    res.status(500).json({ message: 'Error fetching assignment submissions' });
  }
});


/**
 * Teacher: grade a submission (UPDATE SCORE/FEEDBACK)
 */
router.patch('/:id/grade', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const { score, feedback } = req.body;
    const { id: submissionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(submissionId)) { return res.status(400).json({ message: 'Invalid Submission ID' }); }

    let validatedScore = null;
    if (score !== null && score !== undefined && String(score).trim() !== '') {
        const numScore = Number(score);
        if (isNaN(numScore) || numScore < 0 || numScore > 100) { return res.status(400).json({ message: 'Score must be a number between 0 and 100, or empty.' }); }
        validatedScore = numScore;
    }

    const sub = await Submission.findById(submissionId).populate({
      path: 'assignment', select: 'course',
      populate: { path: 'course', select: 'teacher' }
    });

    if (!sub) { return res.status(404).json({ message: 'Submission not found' }); }
    if (sub.assignment?.course?.teacher?.toString() !== req.user.sub) { return res.status(403).json({ message: 'Not authorized to grade this submission' }); }

    sub.score = validatedScore;
    sub.feedback = feedback || '';

    await sub.save();
    res.json({ message: 'Grade saved successfully', submission: sub });

  } catch (err) {
    console.error("Error grading submission:", err);
    res.status(500).json({ message: 'Error grading submission' });
  }
});


// GET a single submission by ID (Student or Teacher)
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) { return res.status(400).json({ message: 'Invalid Submission ID.' }); }
        
        const submission = await Submission.findById(id).populate('assignment');

        if (!submission) { return res.status(404).json({ message: 'Submission not found.' }); }

        const isStudentOwner = submission.student.equals(req.user.sub);
         if (!isStudentOwner) {
             return res.status(403).json({ message: 'Forbidden. You cannot view this submission.' });
         }

        res.json({ submission });

    } catch (error) {
        console.error("Error fetching submission:", error);
        res.status(500).json({ message: 'Internal Server Error fetching submission.' });
    }
});


export default router;