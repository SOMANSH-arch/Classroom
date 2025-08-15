import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import Assignment from '../models/Assignment.model.js';
import Submission from '../models/Submission.model.js';

const router = Router();

// Teacher: create assignment
router.post('/', requireAuth, requireRole('teacher'), async (req, res) => {
  const { course, title, instructions, dueDate } = req.body || {};
  const a = await Assignment.create({ course, title, instructions, dueDate });
  res.status(201).json({ assignment: a });
});

// Get assignments for a course (student or teacher)
router.get('/course/:courseId', requireAuth, async (req, res) => {
  const items = await Assignment.find({ course: req.params.courseId }).sort({ createdAt: -1 });
  res.json({ assignments: items });
});

// Teacher: get all assignments with submission count
router.get('/teacher', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate('course', 'title teacher')
      .sort({ createdAt: -1 });

    const assignmentsWithCounts = await Promise.all(
      assignments.map(async (a) => {
        const count = await Submission.countDocuments({ assignment: a._id });
        return { ...a.toObject(), submissionCount: count };
      })
    );

    res.json({ assignments: assignmentsWithCounts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching assignments' });
  }
});

export default router;
