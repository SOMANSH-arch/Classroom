import { Router } from 'express';
import mongoose from 'mongoose';
import fs from 'fs'; 
import { requireAuth, requireRole } from '../middleware/auth.js';
import Course from '../models/Course.model.js';
import User from '../models/User.model.js';
import { Resend } from 'resend';
import { uploadMaterial } from '../middleware/upload.js'; 
import multer from 'multer'; 
import { v2 as cloudinary } from 'cloudinary';

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY);

// --- Configure Cloudinary ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// --- Helper function to upload buffer to Cloudinary ---
const uploadToCloudinary = (fileBuffer, options) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) { reject(error); } else { resolve(result); }
        }).end(fileBuffer);
    });
};


/**
 * Teacher: create a new course
 */
router.post('/', requireAuth, requireRole('teacher'), async (req, res) => {
  const { title, description, price } = req.body || {};
  if (!title) { return res.status(400).json({ message: 'Title is required' }); }
  const priceInPaise = Number(price);
  if (isNaN(priceInPaise) || priceInPaise < 0) { return res.status(400).json({ message: 'A valid price (0 or more) is required' }); }
  try {
    const c = await Course.create({ title, description, price: priceInPaise, teacher: req.user.sub });
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

    if (!title) { return res.status(400).json({ message: 'Title is required' }); }
    const priceInPaise = Number(price);
    if (isNaN(priceInPaise) || priceInPaise < 0) { return res.status(400).json({ message: 'A valid price (0 or more) is required' }); }

    const updatedCourse = await Course.findOneAndUpdate(
      { _id: id, teacher: req.user.sub },
      { $set: { title, description, price: priceInPaise } },
      { new: true }
    );

    if (!updatedCourse) { return res.status(404).json({ message: 'Course not found or you do not own it' }); }
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
     if (!mongoose.Types.ObjectId.isValid(id)) { return res.status(400).json({ message: 'Invalid Course ID' }); }
    const userId = req.user.sub;
    const course = await Course.findOne({ _id: id, students: userId });
    if (!course) { return res.status(404).json({ message: 'Course not found or you are not enrolled' }); }
    res.json({ course });
  } catch (error) {
    console.error('Error fetching course for student:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * Teacher: Upload Material File to Cloudinary (Path check)
 */
router.post(
  '/:id/materials/upload', // Path check: MUST be '/:id/materials/upload'
  requireAuth,
  requireRole('teacher'),
  uploadMaterial.single('materialFile'),
  async (req, res) => {
    try {
        if (!req.file) { return res.status(400).json({ message: 'No file uploaded or invalid file type.' }); }
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) { return res.status(400).json({ message: 'Invalid Course ID.' }); }
        
        const course = await Course.findOne({ _id: req.params.id, teacher: req.user.sub });
        if (!course) { return res.status(404).json({ message: 'Course not found or not owned by user.' }); }

        const uploadOptions = {
            resource_type: "raw", 
            folder: `innodeed-classroom/materials/${course._id}`, 
            public_id: `${Date.now()}-${req.file.originalname.split('.')[0]}`, 
        };

        const result = await uploadToCloudinary(req.file.buffer, uploadOptions);
        if (!result || !result.secure_url) { throw new Error('Cloudinary upload failed'); }

        res.status(201).json({
          message: 'File uploaded successfully to Cloudinary',
          filePath: result.secure_url,
          fileName: req.file.originalname,
          cloudinaryPublicId: result.public_id
        });

    } catch(error) {
        console.error("Error during Cloudinary file upload:", error);
        res.status(500).json({ message: `Internal server error during file upload: ${error.message || error}` });
    }
  },
  (error, req, res, next) => {
    if (error instanceof multer.MulterError) { return res.status(400).json({ message: `File upload error: ${error.message}` }); } 
    else if (error) { return res.status(400).json({ message: error.message }); }
    next();
  }
);


/**
 * Teacher: post new material metadata
 */
router.post('/:id/materials', requireAuth, requireRole('teacher'), async (req, res) => {
  const { title, description, filePath, fileName } = req.body;
  const { id: courseId } = req.params; // Path check: MUST be ':id/materials'

  if (!title) { return res.status(400).json({ message: 'Title is required' }); }
  if (!mongoose.Types.ObjectId.isValid(courseId)) { return res.status(400).json({ message: 'Invalid Course ID.' }); }

  try {
    const course = await Course.findOne({ _id: courseId, teacher: req.user.sub });
    if (!course) { return res.status(404).json({ message: 'Course not found or not owned' }); }

    const newMaterial = { title, description, filePath, fileName };
    course.materials.push(newMaterial);
    await course.save();

    res.status(201).json({ message: 'Material posted!', course });

    // --- Fire-and-Forget Email Sending ---
    // ... (logic remains the same) ...
    
  } catch (error) {
    console.error('Error posting material metadata:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


/**
 * Public: list published courses (Path check)
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
 * Student: enroll in a published course (Path check)
 */
router.post('/:id/enroll', requireAuth, requireRole('student'), async (req, res) => {
  try {
     if (!mongoose.Types.ObjectId.isValid(req.params.id)) { return res.status(400).json({ message: 'Invalid Course ID.' }); }
    const c = await Course.findById(req.params.id);
    if (!c || !c.published) return res.status(404).json({ message: 'Not found' });
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
 * Student: list courses they are enrolled in (Path check)
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