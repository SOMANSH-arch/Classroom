import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import Submission from '../models/Submission.model.js';

const router = Router();

router.get('/student/:studentId', requireAuth, async (req, res) => {
  const { studentId } = req.params;
  if (req.user.role === 'student' && req.user.sub !== studentId) return res.status(403).json({ message: 'Forbidden' });

  const byCourse = await Submission.aggregate([
    { $match: { student: require('mongoose').Types.ObjectId.createFromHexString(studentId) } },
    { $lookup: { from: 'assignments', localField: 'assignment', foreignField: '_id', as: 'assign' } },
    { $unwind: '$assign' },
    { $group: { _id: '$assign.course', avgScore: { $avg: '$score' }, count: { $sum: 1 } } }
  ]);

  res.json({ byCourse });
});

export default router;
