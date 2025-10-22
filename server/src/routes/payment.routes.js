import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { razorpay } from '../utils/razorpay.js';
import Course from '../models/Course.model.js';
import mongoose from 'mongoose';
import crypto from 'crypto'; 

const router = Router();

/**
 * POST /api/payment/checkout/:courseId
 * Creates a Razorpay order for a course
 */
router.post('/checkout/:courseId', requireAuth, requireRole('student'), async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.sub;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({ message: 'Invalid Course ID' });
  }

  try {
    // 1. Find the course
    const course = await Course.findById(courseId);
    if (!course || !course.published) {
      return res.status(404).json({ message: 'Course not found or not published' });
    }

    // 2. Check if user is already enrolled
    if (course.students.includes(userId)) {
      return res.status(400).json({ message: 'You are already enrolled in this course' });
    }

    // 3. Check for a valid price
    if (course.price == null || course.price <= 0) {
      // We assume purchasable courses must have a price > 0
      return res.status(400).json({ message: 'This course is not available for purchase' });
    }

    // 4. Create Razorpay order
    const options = {
      amount: course.price, // amount in the smallest currency unit (paise)
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`, // <-- THIS IS THE CORRECTED LINE
      notes: {
        courseId: courseId,
        userId: userId,
      }
    };

    const order = await razorpay.orders.create(options);

    // 5. Send order and key to frontend
    res.json({ 
      order, 
      key: process.env.RAZORPAY_KEY_ID 
    });

  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


/**
 * POST /api/payment/verify
 * Verifies a Razorpay payment and enrolls the student
 */
router.post('/verify', requireAuth, requireRole('student'), async (req, res) => {
  const { 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature,
    courseId // We will pass this from the frontend
  } = req.body;
  
  const userId = req.user.sub;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courseId) {
    return res.status(400).json({ message: 'Missing payment details' });
  }

  try {
    // 1. Verify the signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');
    
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // 2. Signature is valid. Find the course.
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // 3. Add student to the course (if not already enrolled)
    // This is the *real* enrollment logic
    if (!course.students.includes(userId)) {
      course.students.push(userId);
      await course.save();
    }
    
    res.json({ 
      message: 'Payment successful! You are now enrolled.',
      courseId: course._id
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


export default router;