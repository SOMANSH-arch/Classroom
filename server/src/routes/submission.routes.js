import { Router } from 'express'; // Use express Router
import { requireAuth, requireRole } from '../middleware/auth.js';
import Submission from '../models/Submission.model.js';
import Assignment from '../models/Assignment.model.js';
import Course from '../models/Course.model.js'; // Needed for ownership check
import { uploadSubmission } from '../middleware/upload.js';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import mongoose from 'mongoose';

const router = Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Cloudinary upload helper
const uploadToCloudinary = (fileBuffer, options) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) { reject(error); } else { resolve(result); }
        }).end(fileBuffer);
    });
};

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

        let fileUrl = null;
        let originalFileName = null;
        let cloudinaryPublicId = null;

        try {
            // Check for existing submission first (more efficient)
             const existingSubmission = await Submission.findOne({ assignment: assignmentId, student: studentId });
             if (existingSubmission) {
                  return res.status(409).json({ message: 'You have already submitted for this assignment.' });
             }

            // Upload file if present
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

            // Create Submission document
            const newSubmissionData = {
                assignment: assignmentId,
                student: studentId,
                content: content || '',
                ...(fileUrl && originalFileName && { file: { url: fileUrl, name: originalFileName } })
            };
            const newSubmission = await Submission.create(newSubmissionData);
            res.status(201).json({ message: 'Submission successful!', submission: newSubmission });

        } catch (error) {
            console.error("Error creating submission:", error);
            if (cloudinaryPublicId && !(error.code === 11000)) { // Cleanup if not duplicate error
               try { await cloudinary.uploader.destroy(cloudinaryPublicId, { resource_type: 'raw'}); } catch (delErr) { console.error("Failed cleanup:", delErr);}
            }
            if (error.code === 11000) { // Handle duplicate error gracefully
                return res.status(409).json({ message: 'You have already submitted for this assignment.' });
            }
            res.status(500).json({ message: `Submission failed: ${error.message || 'Internal Server Error'}` });
        }
    },
    // Multer Error Handler
    (error, req, res, next) => {
        if (error instanceof multer.MulterError || error) {
            return res.status(400).json({ message: `File upload error: ${error.message}` });
        }
        next();
    }
);


// GET Submissions for the logged-in student
router.get('/mine', requireAuth, async (req, res) => { // Removed requireRole('student') as requireAuth implies user
    try {
        const submissions = await Submission.find({ student: req.user.sub })
                                        .populate({ // Populate assignment and course title
                                            path: 'assignment',
                                            select: 'title dueDate course', // Include course ID
                                            populate: {
                                                path: 'course',
                                                select: 'title' // Select course title
                                            }
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
     if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
        return res.status(400).json({ message: 'Invalid Assignment ID.' });
     }
    // Find assignment first to verify teacher ownership
    const assignment = await Assignment.findById(assignmentId).populate('course', 'teacher');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found.' });
    if (assignment.course?.teacher?.toString() !== req.user.sub) {
        return res.status(403).json({ message: 'You are not authorized to view submissions for this assignment.' });
    }

    // Now fetch submissions for this assignment, populating student details
    const submissions = await Submission.find({ assignment: assignmentId })
      .populate('student', 'name email') // Populate student name and email
      .sort({ createdAt: -1 }); // Sort by newest first

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
    const { score, feedback } = req.body; // Score might be null, empty string, or a number string
    const { id: submissionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
        return res.status(400).json({ message: 'Invalid Submission ID' });
    }

    // --- Validate Score ---
    let validatedScore = null; // Default to null if score is empty/invalid
    // Check if score is provided and not just whitespace
    if (score !== null && score !== undefined && String(score).trim() !== '') {
        const numScore = Number(score); // Convert to number
        // Check if it's a valid number within range
        if (isNaN(numScore) || numScore < 0 || numScore > 100) {
             return res.status(400).json({ message: 'Score must be a number between 0 and 100, or empty.' });
        }
        validatedScore = numScore; // Assign the valid number
    }
    // --- End Validation ---

    // Find the submission and verify teacher ownership via the assignment's course
    const sub = await Submission.findById(submissionId).populate({
      path: 'assignment', // Populate assignment
      select: 'course', // Select only the course field from assignment
      populate: { path: 'course', select: 'teacher' } // Populate course and select teacher
    });

    if (!sub) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    // Authorization check
    if (sub.assignment?.course?.teacher?.toString() !== req.user.sub) {
      return res.status(403).json({ message: 'Not authorized to grade this submission' });
    }

    // --- Update score and feedback ---
    sub.score = validatedScore; // Assign the validated number or null
    sub.feedback = feedback || ''; // Assign feedback or ensure it's an empty string if null/undefined

    await sub.save(); // Save the changes

    console.log(`Grade saved for submission ${submissionId}: Score=${validatedScore}, Feedback=${sub.feedback}`);
    res.json({ message: 'Grade saved successfully', submission: sub });

  } catch (err) {
    console.error("Error grading submission:", err);
    res.status(500).json({ message: 'Error grading submission' });
  }
});


// GET a single submission by ID (Student or Teacher) - Basic version
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Submission ID.' });
        }
        // Find submission
        const submission = await Submission.findById(id).populate('assignment'); // Populate assignment

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found.' });
        }

        // --- Authorization ---
        // Allow if the user is the student who submitted OR the teacher of the course
        const isStudentOwner = submission.student.equals(req.user.sub);
        // Need to ensure assignment and course are populated correctly for teacher check
        const isTeacher = submission.assignment?.course?.teacher?.toString() === req.user.sub; // Requires more population if course isn't populated via assignment

        // Simplified check (assuming assignment population as above):
         if (!isStudentOwner /* && !isTeacher */ ) { // Add teacher check later if needed
             // For now, only student can view their own single submission detail
             return res.status(403).json({ message: 'Forbidden. You cannot view this submission.' });
         }

        res.json({ submission });

    } catch (error) {
        console.error("Error fetching submission:", error);
        res.status(500).json({ message: 'Internal Server Error fetching submission.' });
    }
});


export default router;