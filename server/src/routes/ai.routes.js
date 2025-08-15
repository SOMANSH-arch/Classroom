import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import Submission from '../models/Submission.model.js';
import Assignment from '../models/Assignment.model.js';
import { gradeWithAI } from '../utils/openrouter.js';

const router = Router();

// Teacher triggers AI feedback OR student requests draft feedback
router.post('/grade/:submissionId', requireAuth, async (req, res) => {
  const { submissionId } = req.params;
  const submission = await Submission.findById(submissionId);
  if (!submission) return res.status(404).json({ message: 'Submission not found' });

  const assignment = await Assignment.findById(submission.assignment);
  const result = await gradeWithAI({ instructions: assignment?.instructions || "", content: submission.content });

  // store AI suggestion (doesn't overwrite teacher grade)
  submission.aiFeedback = result.feedback || '';
  if (typeof result.score === 'number') {
    // optional: store suggested score if you like
  }
  await submission.save();

  res.json({ ai: result, submission });
});

export default router;
