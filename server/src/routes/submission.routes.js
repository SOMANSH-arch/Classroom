import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import Submission from '../models/Submission.model.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for file uploads
const uploadDir = path.resolve('uploads/submissions');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

/**
 * Student: submit or update assignment
 */
router.post('/', requireAuth, requireRole('student'), upload.single('file'), async (req, res) => {
  try {
    const { assignment, content } = req.body;

    // Check if a submission already exists
    let existing = await Submission.findOne({
      assignment,
      student: req.user.sub
    });

    const submissionData = {
      content
    };

    if (req.file) {
      submissionData.files = [
        {
          name: req.file.originalname,
          url: `/uploads/submissions/${req.file.filename}`
        }
      ];
    }

    if (existing) {
      // Update existing submission
      existing.content = submissionData.content;
      if (submissionData.files) {
        existing.files = submissionData.files;
      }
      await existing.save();
      return res.json({ message: 'Submission updated', submission: existing });
    }

    // Create a new submission
    const sub = await Submission.create({
      assignment,
      student: req.user.sub,
      ...submissionData
    });

    res.status(201).json({ message: 'Submission created', submission: sub });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error saving submission' });
  }
});

/**
 * Student: view my submissions
 */
router.get('/mine', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user.sub })
      .populate({
        path: 'assignment',
        populate: { path: 'course' }
      });
    res.json({ submissions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching submissions' });
  }
});

/**
 * Teacher: view submissions for assignments in their courses
 */
router.get('/', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const submissions = await Submission.find()
      .populate({
        path: 'assignment',
        populate: { path: 'course', select: 'title teacher' }
      })
      .populate('student', 'name email');

    // Filter so teacher sees only submissions for their own courses
    const filtered = submissions.filter(s => s.assignment?.course?.teacher?.toString() === req.user.sub);

    res.json({ submissions: filtered });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching submissions' });
  }
});

/**
 * Teacher: grade a submission
 */
router.patch('/:id/grade', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    const sub = await Submission.findById(req.params.id).populate({
      path: 'assignment',
      populate: { path: 'course', select: 'teacher' }
    });

    if (!sub) return res.status(404).json({ message: 'Submission not found' });
    if (sub.assignment?.course?.teacher?.toString() !== req.user.sub) {
      return res.status(403).json({ message: 'Not authorized to grade this submission' });
    }

    sub.grade = grade;
    sub.feedback = feedback;
    await sub.save();

    res.json({ message: 'Grade saved', submission: sub });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error grading submission' });
  }
});

router.get('/count/:assignmentId', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const count = await Submission.countDocuments({ assignment: req.params.assignmentId });
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching submission count' });
  }
});


/**
 * Teacher: view submissions for a specific assignment
 */
router.get('/assignment/:assignmentId', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const submissions = await Submission.find({ assignment: assignmentId })
      .populate('student', 'name email')
      .populate({
        path: 'assignment',
        populate: { path: 'course', select: 'title teacher' }
      });

    // Make sure this teacher owns the course for this assignment
    const filtered = submissions.filter(
      s => s.assignment?.course?.teacher?.toString() === req.user.sub
    );

    res.json({ submissions: filtered });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching assignment submissions' });
  }
});


export default router;
