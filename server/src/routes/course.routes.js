
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import Course from '../models/Course.model.js';

const router = Router();

/**
 * Teacher: create a new course
 */
router.post('/', requireAuth, requireRole('teacher'), async (req, res) => {
  const { title, description } = req.body || {};
  if (!title) return res.status(400).json({ message: 'Title is required' });

  const c = await Course.create({
    title,
    description,
    teacher: req.user.sub
  });

  res.status(201).json({ course: c });
});

/**
 * Teacher: publish a course they own
 */
router.patch('/:id/publish', requireAuth, requireRole('teacher'), async (req, res) => {
  const { id } = req.params;
  const c = await Course.findOneAndUpdate(
    { _id: id, teacher: req.user.sub },
    { published: true },
    { new: true }
  );
  if (!c) return res.status(404).json({ message: 'Not found' });
  res.json({ course: c });
});

/**
 * Teacher: list their own courses (published or draft)
 */
router.get('/my', requireAuth, requireRole('teacher'), async (req, res) => {
  const list = await Course.find({ teacher: req.user.sub }).sort({ createdAt: -1 });
  res.json({ courses: list });
});

/**
 * Public: list published courses (anyone can see)
 */
router.get('/', async (_req, res) => {
  const list = await Course.find({ published: true })
    .populate('teacher', 'name')
    .sort({ createdAt: -1 });
  res.json({ courses: list });
});

/**
 * Student: enroll in a published course
 */
router.post('/:id/enroll', requireAuth, requireRole('student'), async (req, res) => {
  const c = await Course.findById(req.params.id);
  if (!c || !c.published) return res.status(404).json({ message: 'Not found' });

  if (!c.students.includes(req.user.sub)) {
    c.students.push(req.user.sub);
    await c.save();
  }

  res.json({ course: c });
});

/**
 * Student: list courses they are enrolled in
 */
router.get('/enrolled', requireAuth, requireRole('student'), async (req, res) => {
  const list = await Course.find({ students: req.user.sub })
    .populate('teacher', 'name')
    .sort({ createdAt: -1 });
  res.json({ courses: list });
});

export default router;
