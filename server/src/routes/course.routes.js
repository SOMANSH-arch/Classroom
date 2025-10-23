import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import Course from '../models/Course.model.js';
import User from '../models/User.model.js'; // <-- 1. IMPORT USER MODEL
import { Resend } from 'resend'; // <-- 2. IMPORT RESEND

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY); // <-- 3. INITIALIZE RESEND
console.log('Checking Resend API Key (should say "Yes"):', process.env.RESEND_API_KEY ? 'Yes' : 'No');

// --- All your existing routes (create, publish, list, get, update) stay here ---

/**
 * Teacher: create a new course
 */
router.post('/', requireAuth, requireRole('teacher'), async (req, res) => {
  const { title, description, price } = req.body || {};
  
  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  const priceInPaise = Number(price);
  if (isNaN(priceInPaise) || priceInPaise < 0) {
    return res.status(400).json({ message: 'A valid price (0 or more) is required' });
  }

  const c = await Course.create({
    title,
    description,
    price: priceInPaise,
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
 * Teacher: get a single course they own
 */
router.get('/:id/my', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    // We use .populate() here to get the material details
    const c = await Course.findOne({ _id: id, teacher: req.user.sub });
    if (!c) return res.status(404).json({ message: 'Course not found' });
    res.json({ course: c });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * Teacher: update a course they own (title, desc, price)
 */
router.put('/:id', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    const priceInPaise = Number(price);
    if (isNaN(priceInPaise) || priceInPaise < 0) {
      return res.status(400).json({ message: 'A valid price (0 or more) is required' });
    }

    const updatedCourse = await Course.findOneAndUpdate(
      { _id: id, teacher: req.user.sub },
      { $set: { title, description, price: priceInPaise } },
      { new: true }
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
  // ... (This route is now unsecured and should be removed, but we'll leave it for now) ...
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


// --- 4. THIS IS THE ENTIRE NEW FEATURE ---
/**
 * Teacher: post new material to a course AND send email notifications
 */
router.post('/:id/materials', requireAuth, requireRole('teacher'), async (req, res) => {
  const { title, description } = req.body;
  const { id: courseId } = req.params;
  const teacherId = req.user.sub;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  try {
    // 1. Find the course (and verify ownership)
    const course = await Course.findOne({ _id: courseId, teacher: teacherId });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // 2. Add the new material
    const newMaterial = { title, description };
    course.materials.push(newMaterial);
    await course.save();

    // 3. Respond to the teacher immediately.
    // We won't make the teacher wait for all the emails to send.
    res.status(201).json({ message: 'Material posted!', course });

    // 4. "Fire-and-Forget" Email Sending
    // This function will run in the background.
    const sendEmails = async () => {
      try {
        // Find all students enrolled in the course
        const students = await User.find({ _id: { $in: course.students } }, 'email name');
        
        // Create a list of email addresses
        const emailList = students.map(student => student.email);

        if (emailList.length === 0) {
          console.log('Material posted, but no students are enrolled to notify.');
          return;
        }

        // Send one email to all students (BCC)
        // You MUST use your own verified domain for 'from'.
        // For testing, Resend will replace this with 'onboarding@resend.dev'
        // For testing, we can only send to the verified email.
const testEmailAddress = 'somanshrajkashyap@gmail.com';

// Check if any enrolled student has this test email
const hasVerifiedStudent = students.some(s => s.email === testEmailAddress);

if (!hasVerifiedStudent) {
  console.log('Material posted, but the verified student (somanshrajkashyap@gmail.com) is not enrolled. No email sent.');
  return; // Stop here
}

const { data, error } = await resend.emails.send({
  from: 'onboarding@resend.dev',
  to: testEmailAddress, // <-- THIS IS THE FIX
  // We remove the 'bcc' field entirely for this test
  subject: `New Material for ${course.title}`,
  html: `
    <div>
      <h3>Hi student,</h3>
      <p>Your teacher has posted new material in your course: <strong>${course.title}</strong></p>
      <hr />
      <h4>${title}</h4>
      <p>${description}</p>
      <br/>
      <p>Please log in to Innodeed Classroom to view it.</p>
    </div>
  `
});

if (error) {
  console.error('Error response from Resend:', error);
  return; // Stop here if Resend gave us an error
}

// If successful, log the data
console.log('Success response from Resend:', data);
console.log(`Email notification sent to ${testEmailAddress} for course ${courseId}`);
// --- END OF REPLACEMENT ---
        
        console.log(`Email notification sent to ${emailList.length} students for course ${courseId}`);

      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
      }
    };

    sendEmails(); // Run the function without 'await'

  } catch (error) {
    console.error('Error posting material:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


export default router;