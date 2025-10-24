import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import Assignment from '../models/Assignment.model.js';
import Submission from '../models/Submission.model.js';
import mongoose from 'mongoose'; // <-- Make sure this is imported

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


// --- THIS IS THE ROUTE THAT IS MISSING ---
/**
 * Get a single assignment by its ID
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid assignment ID' });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    res.json({ assignment });
  } catch (err) {
    console.error('Error fetching assignment:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
// --- END OF THE MISSING ROUTE ---


export default router;