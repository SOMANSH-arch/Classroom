import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import Submission from '../models/Submission.model.js';
import Assignment from '../models/Assignment.model.js';
// --- MODIFIED IMPORTS ---
import { gradeWithAI, getHintWithAI } from '../utils/openrouter.js';

const router = Router();

// Your existing route for grading
router.post('/grade/:submissionId', requireAuth, async (req, res) => {
  const { submissionId } = req.params;
  const submission = await Submission.findById(submissionId);
  if (!submission) return res.status(404).json({ message: 'Submission not found' });

  const assignment = await Assignment.findById(submission.assignment);
  const result = await gradeWithAI({ instructions: assignment?.instructions || "", content: submission.content });

  submission.aiFeedback = result.feedback || '';
  await submission.save();

  res.json({ ai: result, submission });
});


// --- NEW ROUTE FOR GETTING HINTS ---
router.post('/hint/:assignmentId', requireAuth, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await Assignment.findById(assignmentId);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Call our new AI function
    const result = await getHintWithAI({
      title: assignment.title,
      instructions: assignment.instructions
    });

    res.json({ ai: result });
  
  } catch (err) {
    console.error('Error getting AI hint:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


export default router;