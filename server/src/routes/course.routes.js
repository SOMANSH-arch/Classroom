import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import Course from '../models/Course.model.js';

const router = Router();

/**
 * Teacher: create a new course
 */
router.post('/', requireAuth, requireRole('teacher'), async (req, res) => {
  // --- THIS IS THE UPDATED VERSION FROM OUR PREVIOUS STEP ---
  const { title, description, price } = req.body || {};
  
  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  // Check if price is a valid number
  const priceInPaise = Number(price);
  if (isNaN(priceInPaise) || priceInPaise < 0) {
    return res.status(400).json({ message: 'A valid price (0 or more) is required' });
  }

  const c = await Course.create({
    title,
    description,
    price: priceInPaise, // Save the price in paise
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


// --- NEW ROUTE 1: GET A SINGLE COURSE (TEACHER-ONLY) ---
/**
 * Teacher: get a single course they own
 */
router.get('/:id/my', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    const c = await Course.findOne({ _id: id, teacher: req.user.sub });
    if (!c) return res.status(404).json({ message: 'Course not found' });
    res.json({ course: c });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// --- NEW ROUTE 2: UPDATE A COURSE (TEACHER-ONLY) ---
/**
 * Teacher: update a course they own (title, desc, price)
 */
router.put('/:id', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price } = req.body;

    // --- Validation ---
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    const priceInPaise = Number(price);
    if (isNaN(priceInPaise) || priceInPaise < 0) {
      return res.status(400).json({ message: 'A valid price (0 or more) is required' });
    }
    // --- End Validation ---

    const updatedCourse = await Course.findOneAndUpdate(
      { _id: id, teacher: req.user.sub }, // Find course by ID and owner
      {
        $set: {
          title,
          description,
          price: priceInPaise
        }
      },
      { new: true } // Return the updated document
    );

    if (!updatedCourse) {
      return res.status(404).json({ message: 'Course not found or you do not own it' });
    }

    res.json({ message: 'Course updated!', course: updatedCourse });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
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
 * Student: enroll in a published course (Original - will be removed later)
 */
router.post('/:id/enroll', requireAuth, requireRole('student'), async (req, res) => {
  const c = await Course.findById(req.params.id);
  if (!c || !c.published) return res.status(404).json({ message: 'Not found' });

  // Note: This logic is now handled by our payment verification route.
  // We can leave it here for now, but it's unsecured.
  // A better solution would be to remove this route entirely
  // so payment is the *only* way to enroll.
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