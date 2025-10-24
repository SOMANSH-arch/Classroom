import { Router } from 'express';
import mongoose from 'mongoose';
import fs from 'fs'; // Still needed for potential cleanup if things go wrong
import { requireAuth, requireRole } from '../middleware/auth.js';
import Course from '../models/Course.model.js';
import User from '../models/User.model.js';
import { Resend } from 'resend';
import { uploadMaterial } from '../middleware/upload.js'; // Import upload middleware
import multer from 'multer'; // Import multer to handle its errors
import { v2 as cloudinary } from 'cloudinary'; // Import Cloudinary

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY);

// --- Configure Cloudinary ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Use https
});

// --- Helper function to upload buffer to Cloudinary ---
const uploadToCloudinary = (fileBuffer, options) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        }).end(fileBuffer);
    });
};


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
  try {
    const c = await Course.create({
      title,
      description,
      price: priceInPaise,
      teacher: req.user.sub
    });
    res.status(201).json({ course: c });
  } catch (error) {
     console.error("Error creating course:", error);
     res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * Teacher: publish a course they own
 */
router.patch('/:id/publish', requireAuth, requireRole('teacher'), async (req, res) => {
  const { id } = req.params;
  try {
     if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid Course ID' });
    const c = await Course.findOneAndUpdate(
      { _id: id, teacher: req.user.sub },
      { published: true },
      { new: true }
    );
    if (!c) return res.status(404).json({ message: 'Course not found or not owned' });
    res.json({ course: c });
  } catch(error) {
      console.error("Error publishing course:", error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * Teacher: list their own courses (published or draft)
 */
router.get('/my', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const list = await Course.find({ teacher: req.user.sub }).sort({ createdAt: -1 });
    res.json({ courses: list });
   } catch(error) {
      console.error("Error fetching teacher courses:", error);
      res.status(500).json({ message: 'Internal Server Error' });
   }
});

/**
 * Teacher: get a single course they own
 */
router.get('/:id/my', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid Course ID' });
    }
    const c = await Course.findOne({ _id: id, teacher: req.user.sub });
    if (!c) return res.status(404).json({ message: 'Course not found or not owned' });
    res.json({ course: c });
  } catch (error) {
    console.error('Error fetching single teacher course:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * Teacher: update a course they own (title, desc, price)
 */
router.put('/:id', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid Course ID' });
    }
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
 * Student: get a single course they are enrolled in
 */
router.get('/:id/student-details', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const { id } = req.params;
     if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid Course ID' });
    }
    const userId = req.user.sub;
    const course = await Course.findOne({ _id: id, students: userId });
    if (!course) {
      return res.status(404).json({ message: 'Course not found or you are not enrolled' });
    }
    res.json({ course });
  } catch (error) {
    console.error('Error fetching course for student:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * Teacher: Upload Material File to Cloudinary
 */
router.post(
  '/:id/materials/upload',
  requireAuth,
  requireRole('teacher'),
  uploadMaterial.single('materialFile'), // Use multer memory storage
  async (req, res) => {
    try {
        if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded or invalid file type.' });
        }
         if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid Course ID.' });
         }
        // Verify course ownership
        const course = await Course.findOne({ _id: req.params.id, teacher: req.user.sub });
        if (!course) {
           return res.status(404).json({ message: 'Course not found or not owned by user.' });
        }

        // --- Upload file buffer to Cloudinary ---
        const uploadOptions = {
            resource_type: "raw", // Treat as raw file (PDF)
            folder: `innodeed-classroom/materials/${course._id}`, // Organize in folders
            public_id: `${Date.now()}-${req.file.originalname.split('.')[0]}`, // Unique name
        };

        const result = await uploadToCloudinary(req.file.buffer, uploadOptions);

        if (!result || !result.secure_url) {
            throw new Error('Cloudinary upload failed');
        }

        // Send back the Cloudinary URL and original name
        res.status(201).json({
          message: 'File uploaded successfully to Cloudinary',
          filePath: result.secure_url, // This is the public URL
          fileName: req.file.originalname,
          cloudinaryPublicId: result.public_id // Store this if you want to delete later
        });

    } catch(error) {
        console.error("Error during Cloudinary file upload:", error);
        res.status(500).json({ message: `Internal server error during file upload: ${error.message || error}` });
    }
  },
  // --- Multer Error Handler ---
  (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
      return res.status(400).json({ message: `File upload error: ${error.message}` });
    } else if (error) {
      return res.status(400).json({ message: error.message });
    }
    next();
  }
);


/**
 * Teacher: post new material metadata (AFTER file upload) AND send email notifications
 */
router.post('/:id/materials', requireAuth, requireRole('teacher'), async (req, res) => {
  const { title, description, filePath, fileName } = req.body; // Expects Cloudinary URL in filePath
  const { id: courseId } = req.params;
  const teacherId = req.user.sub;

  if (!title) { return res.status(400).json({ message: 'Title is required' }); }
  if (!mongoose.Types.ObjectId.isValid(courseId)) { return res.status(400).json({ message: 'Invalid Course ID.' }); }

  try {
    const course = await Course.findOne({ _id: courseId, teacher: teacherId });
    if (!course) {
      // If course not found, maybe delete the uploaded file from Cloudinary? (More complex)
      return res.status(404).json({ message: 'Course not found or not owned' });
    }

    // --- Save Cloudinary URL in filePath ---
    const newMaterial = { title, description, filePath, fileName };
    course.materials.push(newMaterial);
    await course.save();

    res.status(201).json({ message: 'Material posted!', course });

    // --- Fire-and-Forget Email Sending ---
    const sendEmails = async () => {
        try {
            const students = await User.find({ _id: { $in: course.students } }, 'email name');
            if(students.length === 0) return; // No students, skip email

            const emailList = students.map(s => s.email);
            const testEmailAddress = 'somanshrajkashyap@gmail.com'; // Your verified email
            const hasVerifiedStudent = students.some(s => s.email === testEmailAddress);

            if (!hasVerifiedStudent) {
                console.log('Material posted, but verified student not enrolled.');
                return;
            }

            const { data, error } = await resend.emails.send({
              from: 'onboarding@resend.dev',
              to: testEmailAddress,
              subject: `New Material for ${course.title}`,
              html: `
                <div>
                  <h3>Hi student,</h3>
                  <p>New material in <strong>${course.title}</strong>:</p>
                  <h4>${title}</h4>
                  ${description ? `<p>${description}</p>` : ''}
                  ${fileName ? `<p><strong>File:</strong> <a href="${filePath}">${fileName}</a></p>` : ''}
                  <br/><p>Log in to view.</p>
                </div>
              ` // Included link in email
            });
            if (error) { console.error('Resend Error:', error); return; }
            console.log('Resend Success:', data);
            console.log(`Email sent to ${testEmailAddress} for course ${courseId}`);
        } catch(emailError) { console.error('Email Sending Error:', emailError); }
    };
    sendEmails();

  } catch (error) {
    console.error('Error posting material metadata:', error);
    // If saving metadata failed after successful upload, ideally delete from Cloudinary (more complex)
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


/**
 * Public: list published courses (anyone can see)
 */
router.get('/', async (_req, res) => {
 try {
    const list = await Course.find({ published: true })
      .populate('teacher', 'name')
      .sort({ createdAt: -1 });
    res.json({ courses: list });
  } catch(error) {
      console.error("Error fetching public courses:", error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * Student: enroll in a published course (Original - unsecured)
 * NOTE: This should be removed in production as payment verification is the secure way.
 */
router.post('/:id/enroll', requireAuth, requireRole('student'), async (req, res) => {
  try {
     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid Course ID.' });
     }
    const c = await Course.findById(req.params.id);
    if (!c || !c.published) return res.status(404).json({ message: 'Course not found or not published' });
    if (!c.students.includes(req.user.sub)) {
      c.students.push(req.user.sub);
      await c.save();
    }
    res.json({ course: c });
  } catch(error) {
      console.error("Error during manual enrollment:", error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * Student: list courses they are enrolled in
 */
router.get('/enrolled', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const list = await Course.find({ students: req.user.sub })
      .populate('teacher', 'name')
      .sort({ createdAt: -1 });
    res.json({ courses: list });
  } catch(error) {
      console.error("Error fetching enrolled courses:", error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});


export default router;