'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Box, Button, Container, Typography, List, ListItem } from '@mui/material';
import styles from "./courses.module.css";

// 1. ADD THIS TYPE DEFINITION FOR RAZORPAY
declare global {
  interface Window {
    Razorpay: any;
  }
}

// 2. ADD THIS HELPER FUNCTION TO FORMAT PRICE
const formatPrice = (priceInPaise: number) => {
  if (priceInPaise == null || priceInPaise === 0) return "Free";
  const priceInRupees = (priceInPaise / 100).toFixed(2);
  return `₹${priceInRupees}`;
};

export default function StudentCoursesPage() {
  const [publishedCourses, setPublishedCourses] = useState<any[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);

  const loadPublished = async () => {
    try {
      const data = await api('/api/courses');
      setPublishedCourses(data.courses || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadEnrolled = async () => {
    try {
      const data = await api('/api/courses/enrolled');
      setEnrolledCourses(data.courses || []);
    } catch (err) {
      console.error(err);
    }
  };

  // 3. THIS IS THE COMPLETELY REPLACED ENROLL FUNCTION
  const handleEnroll = async (course: any) => {
    try {
      // --- 1. Create Order ---
      // Call the backend route you created in Step 3
      const { order, key } = await api(`/api/payment/checkout/${course._id}`, {
        method: 'POST',
      });

      // --- 2. Configure Razorpay Options ---
      const options = {
        key: key,
        amount: order.amount, // Amount in paise
        currency: order.currency,
        name: 'Innodeed Classroom', // Your project name
        description: `Enroll in ${course.title}`,
        order_id: order.id,
        
        // --- 3. Handler function (called on payment success) ---
        handler: async function (response: any) {
          try {
            // --- 4. Verify Payment ---
            // Call the backend route you created in Step 4
            const verificationData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              courseId: course._id, // Pass courseId to the backend
            };
            
            await api('/api/payment/verify', {
              method: 'POST',
              body: JSON.stringify(verificationData),
            });
            
            // --- 5. Success ---
            alert('Payment successful! You are now enrolled.');
            loadEnrolled(); // Refresh the enrolled courses list

          } catch (err) {
            console.error(err);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          // You can prefill user data here if you have it
          // name: "Student Name",
          // email: "student.email@example.com",
        },
        theme: {
          color: '#3399cc', // Your theme color
        },
      };

      // --- 6. Open Razorpay Checkout ---
      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response: any) {
        alert(`Payment failed: ${response.error.description}`);
      });
      rzp1.open();

    } catch (err) {
      console.error(err);
      alert('Error: Could not start payment.');
    }
  };

  useEffect(() => {
    loadPublished();
    loadEnrolled();
  }, []);

  return (
    <Container className={styles.page} maxWidth={false} disableGutters>
      {/* Available Courses */}
      <Typography variant="h4" component="h1" className={styles.sectionTitle} mt={4} mb={2}>
        <b>AVAILABLE COURSES</b>
      </Typography>
      <List>
        {publishedCourses.map(course => (
          <ListItem key={course._id} className={styles.courseCard}>
            <Box className={styles.courseText}>
              <div className={styles.courseTitle}>
                {course.title} by {course.teacher?.name || 'Unknown'}
              </div>
              <div className={styles.courseDescription}>
                {course.description}
              </div>
            </Box>
            
            {/* 4. --- MODIFIED BUTTON & PRICE DISPLAY --- */}
            <Box style={{ textAlign: 'right', marginLeft: 'auto', flexShrink: 0 }}>
              <Typography variant="h6" component="div">
                {formatPrice(course.price)}
              </Typography>
              <Button
                className={styles.enrollButton}
                onClick={() => handleEnroll(course)} // Pass the whole course object
                disabled={enrolledCourses.some(c => c._id === course._id)}
              >
                {enrolledCourses.some(c => c._id === course._id) ? 'Enrolled' : 'Enroll Now'}
              </Button>
            </Box>

          </ListItem>
        ))}
      </List>

      {/* Enrolled Courses */}
      <Typography variant="h4" component="h1" className={styles.sectionTitle} mt={6} mb={2}>
        <b>MY ENROLLED COURSES</b>
      </Typography>
      <List>
        {enrolledCourses.map(course => (
          <ListItem key={course._id} className={styles.courseCard}>
            <Box className={styles.courseText}>
              <div className={styles.courseTitle}>{course.title}</div>
              <div className={styles.courseDescription}>{course.description}</div>
            </Box>
          </ListItem>
        ))}
      </List>
    </Container>
  );
}